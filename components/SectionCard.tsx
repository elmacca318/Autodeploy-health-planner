
import React from 'react';

interface SectionCardProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const SectionCard: React.FC<SectionCardProps> = ({ title, icon, children }) => {
  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="flex items-center p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
        {icon && <div className="mr-3 text-blue-600 dark:text-blue-400">{icon}</div>}
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">{title}</h3>
      </div>
      <div className="p-5 text-slate-600 dark:text-slate-300">
        {children}
      </div>
    </div>
  );
};

export default SectionCard;
