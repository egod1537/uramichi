import type { ReactNode } from 'react';

interface IconButtonProps {
  ariaLabel: string;
  className?: string;
  disabled?: boolean;
  title?: string;
  onClick?: () => void;
  children: ReactNode;
}

export default function IconButton({
  ariaLabel,
  className = '',
  disabled = false,
  title,
  onClick,
  children,
}: IconButtonProps) {
  return (
    <button
      type="button"
      className={className}
      aria-label={ariaLabel}
      title={title ?? ariaLabel}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
