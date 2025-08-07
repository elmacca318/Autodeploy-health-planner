
import React, { useState } from 'react';
import { SparklesIcon } from './icons';

interface ApiKeyModalProps {
  onApiKeySubmit: (apiKey: string) => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onApiKeySubmit }) => {
  const [key, setKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (key.trim()) {
      onApiKeySubmit(key.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8">
        <div className="text-center">
            <SparklesIcon className="w-12 h-12 mx-auto text-blue-600 dark:text-blue-400 mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            กรุณาใส่ Gemini API Key
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
            แอปพลิเคชันนี้ต้องใช้ Gemini API Key เพื่อสร้างแผนสุขภาพ
            </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label htmlFor="apiKey" className="sr-only">Gemini API Key</label>
          <input
            id="apiKey"
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="block w-full rounded-lg border border-slate-300 bg-white py-2.5 px-4 text-slate-900 shadow-sm transition-all duration-200 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:placeholder:text-slate-500"
            placeholder="วาง API Key ของคุณที่นี่"
          />
          <button
            type="submit"
            disabled={!key.trim()}
            className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-semibold rounded-lg shadow-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-400 disabled:cursor-not-allowed dark:disabled:bg-slate-600 transition-colors"
          >
            ยืนยันและเริ่มใช้งาน
          </button>
        </form>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-4 text-center">
            API Key ของคุณจะถูกบันทึกไว้ในเบราว์เซอร์ของคุณเท่านั้น
        </p>
      </div>
    </div>
  );
};

export default ApiKeyModal;
    