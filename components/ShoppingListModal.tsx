import React, { useState, useEffect, useMemo } from 'react';
import { ShoppingListCategory, ShoppingListItem, dayOrder, dayLabels, HealthData } from '../types';
import { XIcon, ClipboardListIcon, CheckIcon } from './icons';

interface ShoppingListModalProps {
  isOpen: boolean;
  onClose: () => void;
  list: { shoppingList: ShoppingListCategory[] } | null;
  isLoading: boolean;
  healthData: HealthData; // To pass to the list for context if needed
}

const ShoppingListModal: React.FC<ShoppingListModalProps> = ({ isOpen, onClose, list, isLoading, healthData }) => {
  const [copied, setCopied] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  
  const allItems = useMemo(() => list?.shoppingList.flatMap(cat => cat.items) ?? [], [list]);
  
  useEffect(() => {
    // Reset checked state when the list changes or modal opens
    setCheckedItems({});
  }, [list, isOpen]);

  const handleToggleAll = (isChecked: boolean) => {
    const newCheckedItems: Record<string, boolean> = {};
    if (isChecked) {
      allItems.forEach(item => {
        newCheckedItems[item.name] = true;
      });
    }
    setCheckedItems(newCheckedItems);
  };

  const handleItemCheck = (itemName: string, isChecked: boolean) => {
    setCheckedItems(prev => ({ ...prev, [itemName]: isChecked }));
  };
  
  const allChecked = allItems.length > 0 && Object.keys(checkedItems).length === allItems.length && Object.values(checkedItems).every(Boolean);
  const isIndeterminate = !allChecked && Object.values(checkedItems).some(Boolean);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!list || !list.shoppingList) return;
    const textToCopy = list.shoppingList.map(cat => {
        const sortedItems = [...cat.items].sort((a, b) => dayOrder.indexOf(a.firstUsedOnDay as any) - dayOrder.indexOf(b.firstUsedOnDay as any));
        return `🛒 ${cat.category}\n${sortedItems.map(item => `  - ${item.name} (${item.quantity}, ${item.estimatedCost})`).join('\n')}`
    }).join('\n\n');

    navigator.clipboard.writeText(textToCopy).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="shopping-list-title">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
            <div className="flex items-center gap-3">
                <ClipboardListIcon className="w-6 h-6 text-blue-600 dark:text-blue-400"/>
                <h2 id="shopping-list-title" className="font-bold text-lg text-slate-800 dark:text-slate-100">รายการซื้อของสำหรับสัปดาห์นี้</h2>
            </div>
            <button onClick={onClose} className="p-1 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="Close">
                <XIcon className="w-5 h-5"/>
            </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <svg className="animate-spin h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="mt-4 font-semibold text-slate-700 dark:text-slate-300">AI กำลังรวบรวมวัตถุดิบ...</p>
            </div>
          ) : list && allItems.length > 0 ? (
            <div className="space-y-6">
               <div className="flex items-center p-2 border-b border-slate-200 dark:border-slate-700">
                    <input
                        type="checkbox"
                        className="w-5 h-5 mr-3 rounded border-2 border-slate-400 dark:border-slate-500 text-blue-600 focus:ring-blue-500"
                        checked={allChecked}
                        ref={el => { if (el) { el.indeterminate = isIndeterminate; } }}
                        onChange={(e) => handleToggleAll(e.target.checked)}
                    />
                    <label className="font-semibold text-slate-700 dark:text-slate-200" onClick={() => handleToggleAll(!allChecked)}>
                        เลือกทั้งหมด
                    </label>
                </div>
              {list.shoppingList.map((category) => {
                 const sortedItems = [...category.items].sort((a, b) => {
                    const dayAIndex = dayOrder.indexOf(a.firstUsedOnDay as any);
                    const dayBIndex = dayOrder.indexOf(b.firstUsedOnDay as any);
                    if (dayAIndex !== dayBIndex) {
                        return (dayAIndex === -1 ? 99 : dayAIndex) - (dayBIndex === -1 ? 99 : dayBIndex);
                    }
                    return a.name.localeCompare(b.name, 'th');
                 });

                 return (
                    <div key={category.category}>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 border-b-2 border-blue-500 dark:border-blue-400 pb-1.5 mb-3">
                        {category.category}
                      </h3>
                      <ul className="space-y-3 list-none pl-0">
                        {sortedItems.map((item) => (
                          <li key={item.name} className="flex flex-col">
                            <label className="flex items-start cursor-pointer w-full">
                               <input 
                                type="checkbox"
                                checked={!!checkedItems[item.name]}
                                onChange={(e) => handleItemCheck(item.name, e.target.checked)}
                                className="w-5 h-5 mr-3 mt-1 rounded border-2 border-slate-300 dark:border-slate-500 text-blue-600 focus:ring-blue-500 bg-transparent flex-shrink-0"
                               />
                               <div className="flex-grow">
                                    <span className={`text-slate-700 dark:text-slate-300 ${checkedItems[item.name] ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>{item.name}</span>
                                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                       <span>{item.quantity}</span>
                                       <span className="text-slate-300 dark:text-slate-600">|</span>
                                       <span className="font-semibold text-green-600 dark:text-green-500">{item.estimatedCost}</span>
                                    </div>
                               </div>
                            </label>
                             <div className="pl-8 pt-1 text-xs text-slate-500 dark:text-slate-400">
                                <strong>ใช้สำหรับ:</strong> {item.usage.map(u => `${u.meal}(${dayLabels[u.day].replace('วัน', '')})`).join(', ')}
                             </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                 )
              })}
            </div>
          ) : (
             <p className="text-center text-slate-500 dark:text-slate-400 py-10">ไม่สามารถสร้างรายการซื้อของได้ หรือไม่มีข้อมูลวัตถุดิบในแผน</p>
          )}
        </main>
        
        <footer className="p-4 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
            <button
                onClick={handleCopy}
                disabled={isLoading || !list || copied}
                className="w-full flex items-center justify-center px-6 py-2.5 border border-transparent text-base font-semibold rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-400 dark:disabled:bg-slate-600 transition-colors"
            >
              {copied ? (
                <>
                  <CheckIcon className="w-5 h-5 mr-2" />
                  คัดลอกแล้ว!
                </>
              ) : (
                <>
                  <ClipboardListIcon className="w-5 h-5 mr-2" />
                  คัดลอกรายการ
                </>
              )}
            </button>
        </footer>
      </div>
    </div>
  );
};

export default ShoppingListModal;