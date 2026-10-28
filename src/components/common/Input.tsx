import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-[#17223a] uppercase tracking-wider mb-1.5">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full px-3.5 py-2 bg-white/95 border rounded-lg text-[#17223a] text-sm shadow-2xs transition-all duration-150
          focus:outline-none focus:ring-2 focus:ring-offset-0 placeholder:text-[#9e9689]
          ${
            error
              ? 'border-[#f7c2bb] focus:border-[#ab2b1a] focus:ring-rose-200'
              : 'border-[#dfdcd7] focus:border-[#204079] focus:ring-[#204079]/20 hover:border-[#cac4bb]'
          }
          disabled:bg-[#f0ebe1]/60 disabled:text-[#6c747f] disabled:cursor-not-allowed
          ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-[#ab2b1a] font-medium">{error}</p>}
      {!error && helperText && <p className="mt-1 text-xs text-[#6c747f]">{helperText}</p>}
    </div>
  );
};
