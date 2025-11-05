
import React from 'react';

interface ModeToggleProps {
  id: string;
  label: string;
  isOn: boolean;
  onToggle: () => void;
  icon: React.ReactNode;
}

const ModeToggle: React.FC<ModeToggleProps> = ({ id, label, isOn, onToggle, icon }) => {
  return (
    <label
      htmlFor={id}
      className="group inline-flex cursor-pointer items-center gap-3 rounded-full border border-slate-200/70 bg-white/80 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-slate-900/10 dark:border-slate-700/60 dark:bg-slate-800/80 dark:text-slate-100 dark:hover:shadow-black/20"
    >
      <input id={id} type="checkbox" className="sr-only" checked={isOn} onChange={onToggle} />
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-full border transition-colors ${
          isOn
            ? 'border-indigo-200 bg-indigo-500/20 text-indigo-500 dark:border-indigo-400/40 dark:text-indigo-200'
            : 'border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-700/70 dark:bg-slate-900/40 dark:text-slate-300'
        }`}
      >
        {icon}
      </span>
      <span className="tracking-wide">{label}</span>
      <span
        aria-hidden
        className={`relative ml-1 inline-flex h-6 w-11 items-center rounded-full border border-transparent bg-slate-200 transition-colors duration-200 group-hover:bg-slate-300/80 dark:bg-slate-700 dark:group-hover:bg-slate-600 ${
          isOn ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500' : ''
        }`}
      >
        <span
          className={`absolute left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 dark:bg-slate-900 ${
            isOn ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </span>
    </label>
  );
};

export default ModeToggle;
