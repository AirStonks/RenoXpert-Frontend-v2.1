import React from 'react';
import { buttonClasses, type ButtonVariant, type ButtonSize } from './buttonClasses';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
};

export function Button({ variant, size, fullWidth, className, children, ...rest }: ButtonProps) {
  return (
    <button className={buttonClasses({ variant, size, fullWidth, className })} {...rest}>
      {children}
    </button>
  );
}
