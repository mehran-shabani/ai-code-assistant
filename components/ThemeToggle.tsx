import React from 'react';
import { MoonIcon, SunIcon } from './IconComponents';

type Theme = 'light' | 'dark';

interface ThemeToggleProps {
  theme: Theme;
  onToggle: () => void;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, onToggle }) => {
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={onToggle}
      className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/80 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-slate-900/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 dark:border-slate-700/60 dark:bg-slate-800/80 dark:text-slate-100 dark:hover:shadow-black/20"
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
          isDark
            ? 'bg-indigo-500/20 text-indigo-200'
            : 'bg-amber-100 text-amber-500'
        }`}
      >
        {isDark ? <MoonIcon /> : <SunIcon />}
      </span>
      <span className="font-semibold capitalize tracking-wide">
        {isDark ? 'Dark mode' : 'Light mode'}
      </span>
    </button>
  );
};

export default ThemeToggle;
