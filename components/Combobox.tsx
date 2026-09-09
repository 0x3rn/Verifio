import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, CheckIcon } from '@/components/Icons';

interface ComboboxProps {
  label: string;
  items: { id: string; name: string; code?: string }[];
  selectedId: string;
  onSelect: (id: string) => void;
  placeholder?: string;
  loading?: boolean;
  showFlags?: boolean;
}

export function Combobox({ label, items, selectedId, onSelect, placeholder, loading, showFlags = false }: ComboboxProps) {
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

  const renderFlag = (item: { id: string; name: string; code?: string }) => {
    if (!showFlags || !item.code) return null;

    return <i className={`fi fi-${item.code.toLowerCase()} combobox-country-flag`} aria-hidden="true" />;
  };

  return (
    <div className="dash-selector" ref={containerRef}>
      <label className="dash-label">{label}</label>
      
      <div className="combobox-container">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={`combobox-btn ${open ? 'combobox-btn--open' : ''}`}
        >
          <span className={`combobox-value ${selectedItem ? 'combobox-value--selected' : ''}`}>
            {selectedItem ? <>{renderFlag(selectedItem)}{selectedItem.name}</> : (placeholder || 'Select...')}
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
                    type="button"
                    key={item.id}
                    onClick={() => {
                      onSelect(item.id);
                      setOpen(false);
                      setSearch('');
                    }}
                    className={`combobox-item ${selectedId === item.id ? 'combobox-item--active' : ''}`}
                  >
                    <span className="combobox-item__content">{renderFlag(item)}<span>{item.name}</span></span>
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
