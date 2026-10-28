import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'purple';
  size?: 'sm' | 'md';
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
  dot = false,
}) => {
  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs font-medium px-2.5 py-0.5',
  };

  const variantClasses = {
    primary: 'bg-[#e8edf5] text-[#204079] border-[#c8d7eb]',
    success: 'bg-[#e8f5f0] text-[#1f6b4e] border-[#b8dfd0]',
    warning: 'bg-[#fef3eb] text-[#c95908] border-[#fcd5b8]',
    danger: 'bg-[#fcedea] text-[#ab2b1a] border-[#f7c2bb]',
    neutral: 'bg-[#f0ebe1] text-[#17223a] border-[#dfdcd7]',
    purple: 'bg-[#f0eaf8] text-[#5e3592] border-[#dcceef]',
  };

  const dotClasses = {
    primary: 'bg-[#204079]',
    success: 'bg-[#1f6b4e]',
    warning: 'bg-[#c95908]',
    danger: 'bg-[#ab2b1a]',
    neutral: 'bg-[#6c747f]',
    purple: 'bg-[#5e3592]',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClasses[variant]}`} />}
      <span>{children}</span>
    </span>
  );
};
