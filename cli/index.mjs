#!/usr/bin/env node
import { GoogleGenAI } from "@google/genai";
import fs from "fs/promises";
import path from "path";
import process from "process";
import readline from "readline/promises";
import { stdin as input, stdout as output } from "node:process";

function printHelp() {
  console.log(`AI Code Assistant CLI\n\n` +
    `Usage:\n` +
    `  npm run cli -- [options] [prompt]\n` +
    `  node cli/index.mjs [options] [prompt]\n\n` +
    `Options:\n` +
    `  -p, --prompt <text>   Prompt to send. If omitted, the CLI enters interactive mode.\n` +
    `  -f, --file <path>     Attach a text file as additional context (can be repeated).\n` +
    `      --thinking        Enable thinking mode (uses gemini-2.5-pro).\n` +
    `      --search          Enable search-grounded mode (uses Google Search).\n` +
    `      --api-key <key>   Provide the Gemini API key explicitly. Defaults to the API_KEY env variable.\n` +
    `  -h, --help            Show this help message.\n\n` +
    `Commands:\n` +
    `  exit                  Leave interactive mode.\n`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    prompt: null,
    files: [],
    thinking: false,
    search: false,
    apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY || null,
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];

    switch (arg) {
      case "-h":
      case "--help":
        printHelp();
        process.exit(0);
        break;
      case "-p":
      case "--prompt":
        if (i + 1 >= args.length) {
          console.error("Error: --prompt requires a value.");
          process.exit(1);
        }
        options.prompt = args[++i];
        break;
      case "-f":
      case "--file":
        if (i + 1 >= args.length) {
          console.error("Error: --file requires a path.");
          process.exit(1);
        }
        options.files.push(args[++i]);
        break;
      case "--thinking":
        options.thinking = true;
        break;
      case "--search":
        options.search = true;
        break;
      case "--api-key":
        if (i + 1 >= args.length) {
          console.error("Error: --api-key requires a value.");
          process.exit(1);
        }
        options.apiKey = args[++i];
        break;
      default:
        if (!arg.startsWith("-")) {
          options.prompt = options.prompt ? `${options.prompt} ${arg}` : arg;
        } else {
          console.error(`Unknown option: ${arg}`);
          process.exit(1);
        }
    }
  }

  if (options.thinking && options.search) {
    console.error("Error: --thinking and --search cannot be used together.");
    process.exit(1);
  }

  return options;
}

async function loadFileContents(files) {
  const resolvedFiles = [];
  for (const filePath of files) {
    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.resolve(process.cwd(), filePath);
    try {
      const content = await fs.readFile(absolutePath, "utf-8");
      resolvedFiles.push({ name: path.basename(absolutePath), content });
    } catch (error) {
      console.error(`Failed to read file: ${filePath}`);
      throw error;
    }
  }
  return resolvedFiles;
}

function buildFileContext(files) {
  if (!files.length) {
    return "";
  }
  const header = "Here is the content of the files provided for context:\n\n";
  const body = files
    .map(file => `--- FILE: ${file.name} ---\n${file.content}`)
    .join("\n\n");
  return `${header}${body}`;
}

function selectModelConfig({ thinking, search }) {
  if (thinking) {
    return {
      modelName: "gemini-2.5-pro",
      config: { thinkingConfig: { thinkingBudget: 32768 } },
      modeDescription: "Thinking mode (gemini-2.5-pro)",
    };
  }
  if (search) {
    return {
      modelName: "gemini-2.5-flash",
      config: { tools: [{ googleSearch: {} }] },
      modeDescription: "Search-grounded mode (gemini-2.5-flash + Google Search)",
    };
  }
  return {
    modelName: "gemini-2.5-flash",
    config: {},
    modeDescription: "Default mode (gemini-2.5-flash)",
  };
}

async function generateResponse(ai, { prompt, options, fileContext, history }) {
  const { modelName, config } = selectModelConfig(options);

  const historyText = history.length
    ? history
        .map((message) => `${message.role === "user" ? "User" : "Assistant"}: ${message.content}`)
        .join("\n\n") + "\n\n"
    : "";

  const basePrompt = `${historyText}User: ${prompt}`;
  const fullPrompt = fileContext
    ? `${fileContext}\n\n---\n\nBased on the file content provided, please answer the following question:\n\n${basePrompt}`
    : basePrompt;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: fullPrompt,
    config,
  });

  const text = response.text;
  let sources = [];
  if (
    options.search &&
    response.candidates?.[0]?.groundingMetadata?.groundingChunks
  ) {
    sources = response.candidates[0].groundingMetadata.groundingChunks
      .filter((chunk) => chunk.web)
      .map((chunk) => ({
        uri: chunk.web.uri,
        title: chunk.web.title,
      }));
  }

  return { text, sources };
}

async function runSinglePrompt(ai, options, fileContext) {
  const history = [];
  const { text, sources } = await generateResponse(ai, {
    prompt: options.prompt,
    options,
    fileContext,
    history,
  });

  console.log(text.trim());
  if (sources.length) {
    console.log("\nSources:");
    for (const source of sources) {
      console.log(`- ${source.title ?? source.uri} (${source.uri})`);
    }
  }
}

async function runInteractive(ai, options, fileContext) {
  const rl = readline.createInterface({ input, output });
  console.log("AI Code Assistant interactive mode. Type 'exit' to quit.\n");

  const history = [];

  while (true) {
    const prompt = (await rl.question("You > ")).trim();
    if (!prompt) {
      continue;
    }
    if (prompt.toLowerCase() === "exit") {
      break;
    }

    try {
      const { text, sources } = await generateResponse(ai, {
        prompt,
        options,
        fileContext,
        history,
      });

      console.log(`\nAssistant > ${text.trim()}\n`);
      if (sources.length) {
        console.log("Sources:");
        for (const source of sources) {
          console.log(`- ${source.title ?? source.uri} (${source.uri})`);
        }
        console.log("");
      }

      history.push({ role: "user", content: prompt });
      history.push({ role: "assistant", content: text.trim() });
    } catch (error) {
      console.error("Failed to generate a response:", error instanceof Error ? error.message : error);
    }
  }

  await rl.close();
}

async function main() {
  const options = parseArgs();

  if (!options.apiKey) {
    console.error("Error: API key is required. Set API_KEY or provide --api-key.");
    process.exit(1);
  }

  const ai = new GoogleGenAI({ apiKey: options.apiKey });
  let attachedFiles = [];
  try {
    attachedFiles = await loadFileContents(options.files);
  } catch (error) {
    process.exit(1);
  }
  const fileContext = buildFileContext(attachedFiles);

  console.log(`Mode: ${selectModelConfig(options).modeDescription}`);
  if (attachedFiles.length) {
    console.log(`Attached files: ${attachedFiles.map((file) => file.name).join(", ")}`);
  }

  if (options.prompt) {
    await runSinglePrompt(ai, options, fileContext);
  } else {
    await runInteractive(ai, options, fileContext);
  }
}

main().catch((error) => {
  console.error("Unexpected error:", error instanceof Error ? error.message : error);
  process.exit(1);
});
