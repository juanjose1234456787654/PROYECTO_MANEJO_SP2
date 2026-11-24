'use client';

import React, { useState, useRef, useEffect, useId } from 'react';

export interface ComboBoxOption {
  label: string;
  value: string;
  description?: string;
}

export interface ComboBoxProps {
  label?: string;
  placeholder?: string;
  options: (string | ComboBoxOption)[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  className?: string;
  helperText?: string;
}

export function ComboBox({
  label,
  placeholder = 'Seleccione o escriba...',
  options,
  value,
  onChange,
  disabled = false,
  required = false,
  error,
  className = '',
  helperText,
}: ComboBoxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);
  const id = useId();

  // Normalizar opciones
  const normalizedOptions: ComboBoxOption[] = options.map((opt) =>
    typeof opt === 'string' ? { label: opt, value: opt } : opt
  );

  // Sincronizar texto cuando cambia la prop value
  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  // Filtrar opciones según el texto ingresado
  const filteredOptions = normalizedOptions.filter((opt) =>
    opt.label.toLowerCase().includes((searchTerm || '').toLowerCase())
  );

  // Cerrar dropdown al hacer click afuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    onChange(val);
    setIsOpen(true);
  };

  const handleSelectOption = (optValue: string) => {
    setSearchTerm(optValue);
    onChange(optValue);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative space-y-1 ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-bold text-neutral-700 uppercase tracking-wider"
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          id={id}
          type="text"
          disabled={disabled}
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          className={`w-full text-sm border rounded-xl px-3 py-2 pr-9 bg-white transition-all focus:outline-none focus:ring-2 ${
            error
              ? 'border-red-400 focus:ring-red-200 text-red-900'
              : 'border-neutral-300 focus:border-brand-600 focus:ring-brand-100 text-neutral-900'
          } ${disabled ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed' : ''}`}
        />

        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={() => setIsOpen((prev) => !prev)}
          className="absolute inset-y-0 right-0 flex items-center px-2.5 text-neutral-400 hover:text-neutral-600 focus:outline-none"
        >
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {isOpen && !disabled && (
        <ul className="absolute z-50 w-full mt-1 max-h-56 overflow-auto bg-white border border-neutral-200 rounded-2xl shadow-xl py-1 text-xs divide-y divide-neutral-50 animate-in fade-in duration-100">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => (
              <li
                key={opt.value}
                onClick={() => handleSelectOption(opt.value)}
                className={`px-3 py-2.5 cursor-pointer flex flex-col transition-colors ${
                  opt.value.toLowerCase() === value.toLowerCase()
                    ? 'bg-brand-50 text-brand-900 font-black'
                    : 'hover:bg-neutral-50 text-neutral-800'
                }`}
              >
                <span className="font-semibold">{opt.label}</span>
                {opt.description && (
                  <span className="text-[10px] text-neutral-500">{opt.description}</span>
                )}
              </li>
            ))
          ) : (
            <li className="px-3 py-2.5 text-neutral-400 italic">
              No se encontraron coincidencias. Puede escribir una opción personalizada.
            </li>
          )}
        </ul>
      )}

      {error ? (
        <p className="text-[11px] text-red-600 font-semibold">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-neutral-400">{helperText}</p>
      ) : null}
    </div>
  );
}
