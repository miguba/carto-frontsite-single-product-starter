import classNames from 'classnames';

type IconProps = { className?: string };

export const SpinIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path fill="currentColor" d="M12 2a10 10 0 1 0 10 10h-2a8 8 0 1 1-8-8V2Z" />
  </svg>
);

export const RadioIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={classNames(className)} aria-hidden="true">
    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

export const YesIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path fill="currentColor" d="m9.2 16.6-4.4-4.4 1.4-1.4 3 3 8.6-8.6 1.4 1.4-10 10Z" />
  </svg>
);
