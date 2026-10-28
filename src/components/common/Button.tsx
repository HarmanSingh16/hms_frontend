import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  leftIcon,
  rightIcon,
  className = '',
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed select-none tracking-normal cursor-pointer';

  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5 gap-1.5 font-medium',
    md: 'text-sm px-4 py-2 gap-2 font-medium',
    lg: 'text-base px-5 py-2.5 gap-2.5 font-semibold',
  };

  const variantClasses = {
    primary:
      'bg-[#204079] text-[#faf6f0] hover:bg-[#18315c] active:bg-[#122444] focus:ring-[#204079]/40 shadow-xs border border-[#1b3769]',
    secondary:
      'bg-[#f0ebe1] text-[#17223a] hover:bg-[#e6dfd1] active:bg-[#dbd2c2] border border-[#dfdcd7] focus:ring-[#204079]/20',
    danger:
      'bg-[#ab2b1a] text-white hover:bg-[#912415] active:bg-[#791e11] focus:ring-rose-500 shadow-xs border border-[#962516]',
    warning:
      'bg-[var(--accent-gap)] text-white hover:opacity-95 active:opacity-90 focus:ring-amber-500 shadow-xs border border-amber-600',
    outline:
      'border border-[#dfdcd7] bg-white/90 text-[#17223a] hover:bg-[#f0ebe1] hover:border-[#cac4bb] focus:ring-[#204079]/20 shadow-xs',
    ghost:
      'text-[#17223a] hover:bg-[#f0ebe1]/80 active:bg-[#e6dfd1] focus:ring-[#204079]/20',
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
    </button>
  );
};
