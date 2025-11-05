import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from '../types';
import CodeBlock from './CodeBlock';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isModel = message.role === 'model';

  return (
    <div className={`flex w-full ${isModel ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`flex max-w-2xl flex-1 gap-4 py-3 ${
          isModel ? 'flex-row' : 'flex-row-reverse'
        }`}
      >
        <div
          className={`mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl font-semibold shadow-md transition-transform duration-200 ${
            isModel
              ? 'bg-gradient-to-br from-indigo-500 via-purple-500 to-rose-500 text-white shadow-indigo-500/40'
              : 'bg-gradient-to-br from-slate-200 via-slate-100 to-white text-slate-700 shadow-slate-300 dark:from-slate-700/60 dark:via-slate-800/80 dark:to-slate-900/70 dark:text-slate-100 dark:shadow-black/30'
          }`}
        >
          {isModel ? 'A' : 'You'}
        </div>
        <div
          className={`relative flex-1 rounded-3xl border px-6 py-5 shadow-sm transition-all duration-200 backdrop-blur ${
            isModel
              ? 'border-slate-200/70 bg-surface text-slate-700 shadow-floating hover:shadow-lg hover:shadow-slate-900/10 dark:border-slate-700/60 dark:bg-surface-dark dark:text-slate-100 dark:shadow-floating-dark'
              : 'border-transparent bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 text-indigo-50 shadow-lg shadow-indigo-500/30'
          }`}
        >
          <div
            className={`prose max-w-none text-sm leading-relaxed ${
              isModel
                ? 'prose-slate dark:prose-invert'
                : 'prose-invert'
            }`}
          >
            <ReactMarkdown
              children={message.content}
              remarkPlugins={[remarkGfm]}
              components={{
                code(props) {
                  const { children, className, ...rest } = props;
                  const match = /language-(\w+)/.exec(className || '');
                  return match ? (
                    <CodeBlock
                      language={match[1]}
                      code={String(children).replace(/\n$/, '')}
                    />
                  ) : (
                    <code {...rest} className={className}>
                      {children}
                    </code>
                  );
                },
              }}
            />
          </div>
          {message.sources && message.sources.length > 0 && (
            <div className="mt-4">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300/80">
                Sources
              </h4>
              <div className="mt-2 flex flex-wrap gap-2">
                {message.sources.map((source, index) => (
                  <a
                    href={source.uri}
                    key={index}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-indigo-200/60 bg-white/60 px-3 py-1 text-xs font-medium text-indigo-600 transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-indigo-50 dark:border-indigo-400/40 dark:bg-indigo-500/10 dark:text-indigo-200 dark:hover:border-indigo-300/60 dark:hover:bg-indigo-500/20"
                    title={source.title}
                  >
                    <span className="truncate">
                      {source.title || new URL(source.uri).hostname}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;