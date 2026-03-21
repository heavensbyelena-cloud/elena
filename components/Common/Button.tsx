import { type ButtonHTMLAttributes } from 'react';
import { clsx } from 'clsx';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-heavens-noir text-white hover:bg-accent',
  secondary: 'bg-transparent border border-heavens-noir text-heavens-noir hover:bg-heavens-noir hover:text-white',
  ghost: 'bg-transparent text-heavens-noir hover:text-accent',
  danger: 'bg-red-600 text-white hover:bg-red-700',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-xs tracking-widest',
  md: 'px-8 py-3 text-xs tracking-widest',
  lg: 'px-10 py-4 text-sm tracking-widest',
};

/**
 * Bouton réutilisable — respecte le design Heaven's
 * Variants: primary (noir→turquoise), secondary, ghost, danger
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'uppercase transition-all duration-300 font-inter font-light tracking-widest',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        (disabled || loading) && 'opacity-60 cursor-not-allowed',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? 'Chargement...' : children}
    </button>
  );
}
