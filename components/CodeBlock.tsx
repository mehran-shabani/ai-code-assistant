
import React, { useState } from 'react';
import { CopyIcon, CheckIcon } from './IconComponents';

interface CodeBlockProps {
  language: string;
  code: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, code }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  return (
    <div className="bg-gray-950 rounded-lg my-4 relative">
      <div className="flex justify-between items-center px-4 py-2 bg-gray-800 rounded-t-lg">
        <span className="text-gray-400 text-sm font-mono">{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="text-gray-400 hover:text-white transition-colors duration-200 flex items-center gap-1.5 text-sm"
        >
          {isCopied ? <CheckIcon /> : <CopyIcon />}
          {isCopied ? 'Copied!' : 'Copy code'}
        </button>
      </div>
      <pre className="p-4 text-sm overflow-x-auto">
        <code className={`language-${language}`}>
          {code}
        </code>
      </pre>
    </div>
  );
};

export default CodeBlock;
