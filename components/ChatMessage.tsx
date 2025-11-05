
import React from 'react';
import { Message } from '../types';
import CodeBlock from './CodeBlock';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isModel = message.role === 'model';

  const renderContent = (content: string) => {
    const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
    const parts = content.split(codeBlockRegex);
    
    return parts.map((part, index) => {
      if (index % 3 === 2) { // This is the code content
        const language = parts[index - 1] || '';
        return <CodeBlock key={index} language={language} code={part.trim()} />;
      } else if (index % 3 === 0) { // This is regular text
        return part.split('\n').map((line, i) => (
          <p key={`${index}-${i}`} className="whitespace-pre-wrap">{line}</p>
        ));
      }
      return null;
    });
  };

  return (
    <div className={`flex items-start gap-4 py-6 ${isModel ? '' : 'bg-gray-800/50'}`}>
        <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-white ${isModel ? 'bg-indigo-500' : 'bg-teal-500'}`}>
            {isModel ? 'A' : 'Y'}
        </div>
        <div className="flex-1">
            <div className="prose prose-invert max-w-none text-gray-200">
              {renderContent(message.content)}
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
