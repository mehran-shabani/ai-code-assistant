
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
    <label htmlFor={id} className="flex items-center cursor-pointer gap-3 text-sm text-gray-300">
      <div className="relative">
        <input id={id} type="checkbox" className="sr-only" checked={isOn} onChange={onToggle} />
        <div className={`block w-10 h-6 rounded-full transition-colors ${isOn ? 'bg-indigo-500' : 'bg-gray-600'}`}></div>
        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isOn ? 'transform translate-x-4' : ''}`}></div>
      </div>
      <div className="flex items-center gap-1.5">
          {icon}
          <span>{label}</span>
      </div>
    </label>
  );
};

export default ModeToggle;
