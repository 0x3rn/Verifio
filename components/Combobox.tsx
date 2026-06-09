import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, CheckIcon } from '@/components/Icons';

interface ComboboxProps {
  label: string;
  items: { id: string; name: string }[];
  selectedId: string;
  onSelect: (id: string) => void;
  placeholder?: string;
  loading?: boolean;
}

export function Combobox({ label, items, selectedId, onSelect, placeholder, loading }: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  
  const selectedItem = items.find(i => i.id === selectedId);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const filteredItems = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col gap-1.5 w-full relative" ref={containerRef}>
      <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
        {label}
      </label>
      
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex items-center justify-between w-full px-4 py-2.5 text-left bg-white dark:bg-[#1e293b] border ${open ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-gray-200 dark:border-gray-700'} rounded-lg shadow-sm transition-all focus:outline-none`}
      >
        <span className={`block truncate ${!selectedItem ? 'text-gray-400' : 'text-gray-900 dark:text-gray-100 font-medium'}`}>
          {selectedItem ? selectedItem.name : (placeholder || 'Select...')}
        </span>
        <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-[#1e293b] border border-gray-100 dark:border-gray-700 rounded-lg shadow-xl top-full overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="p-2 border-b border-gray-100 dark:border-gray-700">
            <input
              type="text"
              autoFocus
              className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-gray-900 dark:text-white placeholder-gray-400"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="max-h-56 overflow-y-auto p-1 custom-scrollbar">
            {loading ? (
              <div className="p-3 text-sm text-center text-gray-500">Loading...</div>
            ) : filteredItems.length === 0 ? (
              <div className="p-3 text-sm text-center text-gray-500">No results found</div>
            ) : (
              filteredItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelect(item.id);
                    setOpen(false);
                    setSearch('');
                  }}
                  className={`w-full text-left px-3 py-2 text-sm rounded-md flex items-center justify-between transition-colors ${selectedId === item.id ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-medium' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                >
                  {item.name}
                  {selectedId === item.id && <CheckIcon className="w-4 h-4" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
