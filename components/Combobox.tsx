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
    <div className="dash-selector" ref={containerRef}>
      <label className="dash-label">{label}</label>
      
      <div className="combobox-container">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={`combobox-btn ${open ? 'combobox-btn--open' : ''}`}
        >
          <span style={{ color: selectedItem ? 'var(--foreground)' : 'var(--muted)', fontWeight: selectedItem ? 500 : 400 }}>
            {selectedItem ? selectedItem.name : (placeholder || 'Select...')}
          </span>
          <span style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: 'var(--muted)', display: 'flex' }}>
            <ChevronDownIcon className="icon-sm" />
          </span>
        </button>

        {open && (
          <div className="combobox-dropdown">
            <div className="combobox-search-wrap">
              <input
                type="text"
                autoFocus
                className="combobox-search"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <div className="combobox-list">
              {loading ? (
                <div style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--muted)', fontSize: '0.8125rem' }}>Loading...</div>
              ) : filteredItems.length === 0 ? (
                <div style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--muted)', fontSize: '0.8125rem' }}>No results found</div>
              ) : (
                filteredItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelect(item.id);
                      setOpen(false);
                      setSearch('');
                    }}
                    className={`combobox-item ${selectedId === item.id ? 'combobox-item--active' : ''}`}
                  >
                    <span>{item.name}</span>
                    {selectedId === item.id && <CheckIcon className="icon-sm" />}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
