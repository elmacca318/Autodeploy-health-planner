
import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <svg
            className="animate-spin h-12 w-12 text-blue-600 dark:text-blue-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
        >
            <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            ></circle>
            <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
        </svg>
        <h3 className="mt-4 text-lg font-semibold text-slate-700 dark:text-slate-300">AI กำลังสร้างแผนอาหาร...</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">โปรดรอสักครู่ นักโภชนาการ AI กำลังทำงานอย่างหนัก</p>
    </div>
  );
};

export default LoadingSpinner;
