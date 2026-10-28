import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  title,
  subtitle,
  headerAction,
}) => {
  return (
    <div
      className={`bg-white/90 backdrop-blur-xs rounded-xl border border-[#dfdcd7] shadow-xs overflow-hidden transition-all duration-200 hover:border-[#204079]/30 ${className}`}
    >
      {(title || subtitle || headerAction) && (
        <div className="px-6 py-4 border-b border-[#dfdcd7] bg-[#faf6f0]/80 flex items-center justify-between">
          <div>
            {title && (
              <h3 className="font-serif font-semibold text-[#17223a] text-lg tracking-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-[#6c747f] mt-0.5 font-normal leading-normal">{subtitle}</p>
            )}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
};
