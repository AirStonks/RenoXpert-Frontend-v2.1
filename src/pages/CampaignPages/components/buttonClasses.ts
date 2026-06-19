export type ButtonVariant = 'primary' | 'secondary';
export type ButtonSize = 'md' | 'lg';

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-campaign text-white hover:bg-campaign-600 active:bg-campaign-700 shadow-[0_8px_24px_rgba(215,30,66,0.25)]',
  secondary: 'bg-white text-slate-900 border border-slate-200 hover:bg-slate-50',
};

const SIZES: Record<ButtonSize, string> = {
  md: 'text-sm px-5 py-2.5',
  lg: 'text-base px-6 py-3.5',
};

export function buttonClasses(opts: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
} = {}): string {
  const { variant = 'primary', size = 'md', fullWidth = false, className = '' } = opts;
  return [
    'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-colors',
    'disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-campaign/40',
    VARIANTS[variant],
    SIZES[size],
    fullWidth ? 'w-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
}
