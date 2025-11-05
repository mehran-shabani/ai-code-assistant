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
    <div className={`flex items-start gap-4 py-6 ${isModel ? '' : 'bg-gray-800/50'}`}>
        <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-white ${isModel ? 'bg-indigo-500' : 'bg-teal-500'}`}>
            {isModel ? 'A' : 'Y'}
        </div>
        <div className="flex-1 overflow-x-auto">
            <div className="prose prose-invert max-w-none text-gray-200">
              <ReactMarkdown
                children={message.content}
                remarkPlugins={[remarkGfm]}
                components={{
                  code(props) {
                    const {children, className, ...rest} = props;
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
                  }
                }}
              />
            </div>
            {message.sources && message.sources.length > 0 && (
                <div className="mt-4">
                    <h4 className="text-sm font-semibold text-gray-400 mb-2">Sources:</h4>
                    <div className="flex flex-wrap gap-2">
                        {message.sources.map((source, index) => (
                            <a 
                                href={source.uri} 
                                key={index} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs bg-gray-700 hover:bg-gray-600 text-indigo-300 px-3 py-1 rounded-full transition-colors duration-200 truncate"
                                title={source.title}
                            >
                                {source.title || new URL(source.uri).hostname}
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default ChatMessage;