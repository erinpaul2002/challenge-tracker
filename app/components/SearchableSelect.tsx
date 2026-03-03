'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';

interface SearchableSelectProps {
  options: { id: string; name: string; channel_name?: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = '-- SELECT OPTION --',
  label,
  required = false,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter options based on search term (search by name or channel_name)
  const filteredOptions = options.filter((option) => {
    const searchLower = searchTerm.toLowerCase();
    const nameMatch = option.name.toLowerCase().includes(searchLower);
    const channelMatch = option.channel_name?.toLowerCase().includes(searchLower);
    return nameMatch || channelMatch;
  });

  // Get selected option
  const selectedOption = options.find((opt) => opt.id === value);

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (optionId: string) => {
    onChange(optionId);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
  };

  return (
    <div className="space-y-1" ref={containerRef}>
      {label && (
        <label className="text-[10px] text-tactical font-bold uppercase tracking-widest ml-1">
          {label}
          {required && ' *'}
        </label>
      )}
      
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="input-tactical w-full appearance-none cursor-pointer flex items-center justify-between px-3 py-2 text-left"
        >
          <span className={selectedOption ? 'text-hud' : 'text-dimmed'}>
            {selectedOption ? `${selectedOption.name.toUpperCase()}${selectedOption.channel_name ? ` [${selectedOption.channel_name.toUpperCase()}]` : ''}` : placeholder}
          </span>
          <div className="flex items-center gap-2">
            {selectedOption && (
              <X size={14} onClick={handleClear} className="text-dimmed hover:text-tactical transition-colors" />
            )}
            <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-panel border border-gunmetal z-50 shadow-lg backdrop-blur-sm">
            {/* Search Input */}
            <div className="p-2 border-b border-gunmetal">
              <input
                ref={inputRef}
                type="text"
                placeholder="Search streamer or channel..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-tactical w-full text-sm"
              />
            </div>

            {/* Options List */}
            <div className="max-h-48 overflow-y-auto">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleSelect(option.id)}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                      value === option.id
                        ? 'bg-tactical text-void font-bold'
                        : 'text-hud hover:bg-gunmetal/30'
                    }`}
                  >
                    <div className="font-bold">{option.name.toUpperCase()}</div>
                    {option.channel_name && (
                      <div className="text-xs text-dimmed">{option.channel_name}</div>
                    )}
                  </button>
                ))
              ) : (
                <div className="px-3 py-4 text-center text-dimmed text-sm">
                  No streamers found
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
