
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
    <div className="relative my-4 overflow-hidden rounded-2xl border border-slate-200/70 bg-slate-900/95 text-slate-100 shadow-lg shadow-slate-900/40 dark:border-slate-700/70 dark:bg-slate-900/80">
      <div className="flex items-center justify-between border-b border-slate-200/10 bg-slate-900/40 px-4 py-2 text-xs uppercase tracking-wide text-slate-300">
        <span className="font-mono">{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1 rounded-full bg-slate-800/80 px-3 py-1 text-[11px] font-medium text-slate-200 transition-colors duration-200 hover:bg-slate-700"
        >
          {isCopied ? <CheckIcon /> : <CopyIcon />}
          {isCopied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="max-h-[500px] overflow-x-auto overflow-y-auto p-4 text-sm leading-relaxed">
        <code className={`language-${language}`}>
          {code}
        </code>
      </pre>
    </div>
  );
};

export default CodeBlock;
