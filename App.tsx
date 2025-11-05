
import React, { useState, useRef, useEffect } from 'react';
import type { Message } from './types';
import { generateResponse } from './services/geminiService';
import ChatMessage from './components/ChatMessage';
import {
  SendIcon,
  BrainCircuitIcon,
  SearchIcon,
  PaperclipIcon,
  XCircleIcon,
} from './components/IconComponents';
import ModeToggle from './components/ModeToggle';
import ThemeToggle from './components/ThemeToggle';

interface AttachedFile {
    name: string;
    content: string;
}

const CHAR_COUNT_WARNING_THRESHOLD = 100000;

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isThinkingMode, setIsThinkingMode] = useState(false);
  const [isSearchGrounded, setIsSearchGrounded] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [fileCharCount, setFileCharCount] = useState(0);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') {
      return 'light';
    }
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'dark' || storedTheme === 'light') {
      return storedTheme;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleThemeToggle = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const files = Array.from(e.target.files);
    // FIX: Explicitly type `file` as `File` to resolve ambiguity in TypeScript's type inference.
    // This corrects errors where `file.name` was inaccessible and `file` was not assignable to Blob.
    const filePromises = files.map((file: File) => {
        return new Promise<AttachedFile>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target && typeof event.target.result === 'string') {
                    resolve({ name: file.name, content: event.target.result });
                } else {
                    reject(new Error('Failed to read file.'));
                }
            };
            reader.onerror = reject;
            reader.readAsText(file);
        });
    });

    Promise.all(filePromises)
        .then(newFiles => {
            setAttachedFiles(prev => {
              const allFiles = [...prev, ...newFiles];
              const totalChars = allFiles.reduce((acc, file) => acc + file.content.length, 0);
              setFileCharCount(totalChars);
              return allFiles;
            });
        })
        .catch(err => {
            console.error("Error reading files:", err);
            setError("Error reading one or more files.");
        });
    
    e.target.value = '';
  };

  const handleClearFiles = () => {
    setAttachedFiles([]);
    setFileCharCount(0);
  };

  // FIX: Extracted submission logic into a dedicated function to be reused and fix type errors.
  const sendMessage = async () => {
    // This check now correctly matches the button's disabled state.
    if (isLoading || (!input.trim() && attachedFiles.length === 0)) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      let fileContext = '';
      if (attachedFiles.length > 0) {
          fileContext = "Here is the content of the files provided for context:\n\n" +
              attachedFiles.map(file => `--- FILE: ${file.name} ---\n${file.content}`).join('\n\n');
      }

      const { text, sources } = await generateResponse({
        prompt: input,
        isThinkingMode,
        isSearchGrounded,
        fileContext
      });

      const modelMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: text,
        sources
      };
      setMessages(prev => [...prev, modelMessage]);

    } catch (err) {
      let userFriendlyMessage = 'An unexpected error occurred. Please try again.';
      if (err instanceof Error) {
        if (err.message.includes('API key not valid')) {
          userFriendlyMessage = "There seems to be an issue with the API key. Please ensure it is configured correctly.";
        } else if (err.message.match(/50\d/)) {
          userFriendlyMessage = "The service is currently experiencing issues. Please try again in a few moments.";
        } else if (err.message.includes('429')) {
            userFriendlyMessage = "You've sent too many requests in a short period. Please wait a bit before sending another."
        }
      }
      
      setError(userFriendlyMessage);
      
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: `Sorry, I ran into a problem: ${userFriendlyMessage}`
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
      handleClearFiles(); // Clear files after submission
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  };
  
  const handleThinkingModeToggle = () => {
      const newMode = !isThinkingMode;
      setIsThinkingMode(newMode);
      if (newMode) setIsSearchGrounded(false);
  };
  
  const handleSearchGroundedToggle = () => {
      const newMode = !isSearchGrounded;
      setIsSearchGrounded(newMode);
      if (newMode) setIsThinkingMode(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-200 text-slate-900 transition-colors duration-300 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 pb-8 pt-6 sm:px-6 lg:px-10">
        <header className="rounded-3xl border border-slate-200/70 bg-surface p-6 shadow-floating backdrop-blur dark:border-slate-800/60 dark:bg-surface-dark dark:shadow-floating-dark">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-rose-500 text-2xl font-semibold text-white shadow-lg shadow-indigo-500/40">
                AI
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">AI Code Assistant</h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
                  یک تجربه مکالمه‌ای جدید برای توسعه‌دهنده‌ها با رابط کاربری مدرن، پشتیبانی از حالت تفکر عمیق و اتصال به جست‌وجو. هر زمان خواستی می‌توانی تم روشن یا تاریک را انتخاب کنی.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <ModeToggle
                id="thinking-mode"
                label="Thinking Mode"
                isOn={isThinkingMode}
                onToggle={handleThinkingModeToggle}
                icon={<BrainCircuitIcon />}
              />
              <ModeToggle
                id="search-grounded"
                label="Search Grounding"
                isOn={isSearchGrounded}
                onToggle={handleSearchGroundedToggle}
                icon={<SearchIcon />}
              />
              <ThemeToggle theme={theme} onToggle={handleThemeToggle} />
            </div>
          </div>
        </header>

        <main className="mt-6 flex-1 overflow-hidden">
          <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/70 bg-surface-emphasis shadow-floating backdrop-blur dark:border-slate-800/60 dark:bg-surface-emphasis-dark dark:shadow-floating-dark">
            <div className="flex-1 space-y-6 overflow-y-auto px-4 py-8 sm:px-6 lg:px-10">
              {messages.length === 0 && !isLoading && (
                <div className="mx-auto max-w-xl rounded-3xl border border-dashed border-slate-300/70 bg-white/70 p-8 text-center shadow-sm dark:border-slate-700/70 dark:bg-slate-900/40">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 text-white shadow-md shadow-indigo-500/40">
                    <SendIcon />
                  </div>
                  <h2 className="mt-5 text-2xl font-semibold">سلام! آماده‌ام کمک کنم ✨</h2>
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-300/90">
                    سوالت دربارهٔ کد را بنویس، فایل‌هایی که نیاز است را پیوست کن و حالت مناسب را انتخاب کن تا بهترین پاسخ را دریافت کنی.
                  </p>
                </div>
              )}
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              {isLoading && (
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-rose-500 font-semibold text-white shadow-lg shadow-indigo-500/40">
                    AI
                  </div>
                  <div className="flex-1">
                    <div className="flex gap-2">
                      <span className="h-3 w-3 animate-bounce rounded-full bg-indigo-400/90" />
                      <span className="h-3 w-3 animate-bounce rounded-full bg-indigo-400/80 [animation-delay:150ms]" />
                      <span className="h-3 w-3 animate-bounce rounded-full bg-indigo-400/70 [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              )}
              {error && (
                <div className="rounded-2xl border border-rose-200/60 bg-rose-50/70 px-4 py-3 text-sm text-rose-600 shadow-sm dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-200">
                  {error}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-slate-200/70 bg-white/70 px-4 py-4 shadow-inner dark:border-slate-800/60 dark:bg-slate-900/60">
              <div className="mx-auto flex max-w-4xl flex-col gap-4">
                {attachedFiles.length > 0 && (
                  <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 text-sm shadow-sm dark:border-slate-700/70 dark:bg-slate-900/60">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap items-center gap-3">
                        <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-300">
                          فایل‌های پیوست شده
                        </h4>
                        <span
                          className={`rounded-full px-3 py-1 text-[11px] font-mono ${
                            fileCharCount > CHAR_COUNT_WARNING_THRESHOLD
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                              : 'bg-slate-100 text-slate-500 dark:bg-slate-800/60 dark:text-slate-300'
                          }`}
                        >
                          {fileCharCount.toLocaleString()} chars
                          {fileCharCount > CHAR_COUNT_WARNING_THRESHOLD && ' — متن خیلی طولانی است'}
                        </span>
                      </div>
                      <button
                        onClick={handleClearFiles}
                        className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 transition-colors duration-200 hover:bg-slate-200 dark:bg-slate-800/70 dark:text-slate-200 dark:hover:bg-slate-700"
                      >
                        <XCircleIcon /> پاک کردن همه
                      </button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {attachedFiles.map((file, index) => (
                        <span
                          key={index}
                          className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200"
                        >
                          {file.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-3xl border border-slate-200/70 bg-white/80 p-4 shadow-lg shadow-slate-900/5 backdrop-blur dark:border-slate-800/60 dark:bg-slate-900/70 dark:shadow-black/20 sm:flex-row sm:items-end">
                  <div className="flex items-center gap-3">
                    <label
                      htmlFor="file-upload"
                      className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200/70 bg-slate-100 text-slate-500 transition-colors duration-200 hover:border-indigo-300 hover:text-indigo-500 dark:border-slate-700/70 dark:bg-slate-900/50 dark:text-slate-300 dark:hover:border-indigo-400 dark:hover:text-indigo-200"
                    >
                      <PaperclipIcon />
                    </label>
                    <input
                      id="file-upload"
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFileChange}
                      disabled={isLoading}
                    />
                  </div>
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="سوالت را اینجا بنویس..."
                    className="min-h-[64px] flex-1 resize-none rounded-2xl border border-slate-200/60 bg-white/80 px-4 py-3 text-sm leading-relaxed text-slate-700 shadow-inner focus:border-indigo-300 focus:outline-none focus:ring-0 dark:border-slate-700/70 dark:bg-slate-900/60 dark:text-slate-100"
                    rows={1}
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={isLoading || (!input.trim() && attachedFiles.length === 0)}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500 px-6 text-sm font-semibold text-white shadow-lg shadow-indigo-500/40 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-400 disabled:translate-y-0 disabled:bg-slate-400 disabled:shadow-none disabled:hover:shadow-none disabled:focus-visible:ring-0 dark:disabled:bg-slate-600"
                  >
                    <SendIcon />
                    ارسال
                  </button>
                </form>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
