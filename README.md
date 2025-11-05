<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1RZPmotgxUZVOaXZQZ6xP43OLz1tgPP25

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Use from the terminal or PowerShell

Once dependencies are installed and your `API_KEY` (or `GEMINI_API_KEY`) environment variable is set, you can chat without the web UI:

```bash
# Single question
npm run cli -- --prompt "Explain the difference between let and const in TypeScript."

# Interactive session (type `exit` to quit)
npm run cli

# Attach context files and enable thinking mode
npm run cli -- --thinking --file ./src/utils/example.ts
```

You can also pass the API key directly using `--api-key <key>` if you prefer not to export it beforehand.
