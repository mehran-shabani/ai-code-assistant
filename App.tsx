import React, { useState, useRef, useEffect } from 'react';
import type { Message } from './types';
import { generateResponse } from './services/geminiService';
import ChatMessage from './components/ChatMessage';
import { SendIcon, BrainCircuitIcon, SearchIcon, PaperclipIcon, XCircleIcon } from './components/IconComponents';
import ModeToggle from './components/ModeToggle';

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const files = Array.from(e.target.files);
    const filePromises = files.map(file => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

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
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(errorMessage);
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: `Error: ${errorMessage}`
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
      handleClearFiles(); // Clear files after submission
    }
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
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100 font-sans">
      <header className="p-4 border-b border-gray-700 shadow-md">
        <h1 className="text-xl font-bold text-center text-indigo-400">AI Code Assistant</h1>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4">
          {messages.length === 0 && !isLoading && (
              <div className="text-center text-gray-400 mt-20">
                  <h2 className="text-2xl font-semibold mb-2">Welcome!</h2>
                  <p>Ask me anything about code, or use a special mode for advanced queries.</p>
              </div>
          )}
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          {isLoading && (
             <div className="flex items-start gap-4 py-6">
                <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-white bg-indigo-500">A</div>
                <div className="flex-1 mt-1">
                    <div className="animate-pulse flex space-x-2">
                        <div className="h-3 w-3 bg-gray-500 rounded-full"></div>
                        <div className="h-3 w-3 bg-gray-500 rounded-full"></div>
                        <div className="h-3 w-3 bg-gray-500 rounded-full"></div>
                    </div>
                </div>
            </div>
          )}
          {error && <div className="text-red-400 text-center py-4">{error}</div>}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="bg-gray-800/70 backdrop-blur-sm p-4 border-t border-gray-700">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center items-center gap-6 mb-4">
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
          </div>
          <div className="bg-gray-900 border border-gray-600 rounded-xl">
            {attachedFiles.length > 0 && (
              <div className="px-3 pt-2 pb-2 border-b border-gray-700">
                  <div className="flex justify-between items-center mb-2">
                      <div className="flex items-baseline gap-3">
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Attached Files</h4>
                        <span className={`text-xs font-mono ${fileCharCount > CHAR_COUNT_WARNING_THRESHOLD ? 'text-yellow-400' : 'text-gray-500'}`}>
                          {fileCharCount.toLocaleString()} chars
                          {fileCharCount > CHAR_COUNT_WARNING_THRESHOLD && ` (warning: context is very long)`}
                        </span>
                      </div>
                      <button onClick={handleClearFiles} className="text-gray-400 hover:text-white transition-colors">
                          <XCircleIcon />
                      </button>
                  </div>
                  <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                      {attachedFiles.map((file, index) => (
                          <div key={index} className="bg-gray-700 text-gray-200 text-xs px-2 py-1 rounded">
                              {file.name}
                          </div>
                      ))}
                  </div>
              </div>
            )}
            <form onSubmit={handleSubmit} className="flex items-end gap-2 p-2">
              <label htmlFor="file-upload" className="p-2 text-gray-400 hover:text-white cursor-pointer transition-colors rounded-lg hover:bg-gray-700">
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
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="Ask a coding question..."
                className="flex-1 bg-transparent resize-none focus:outline-none p-2 max-h-48"
                rows={1}
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || (!input.trim() && attachedFiles.length === 0)}
                className="bg-indigo-600 text-white rounded-lg p-2 disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-indigo-500 transition-colors"
              >
                <SendIcon />
              </button>
            </form>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
