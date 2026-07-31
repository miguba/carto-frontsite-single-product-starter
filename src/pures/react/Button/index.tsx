import type { FC } from 'react';
import classNames from 'classnames';
import { SpinIcon } from '../Icons';
import { Button as ButtonUI, buttonVariants } from '@/components/ui/button';
import type { VariantProps } from 'class-variance-authority';

type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading?: boolean;
  };

const Button: FC<ButtonProps> = ({
  children,
  disabled,
  loading,
  className,
  ...rest
}) => {
  return (
    <ButtonUI
      className={classNames([`rounded-none bg-btn`, className])}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && (
        <span className="mr-1">
          <SpinIcon className="animate-spin w-4 h-4" />
        </span>
      )}
      {children}
    </ButtonUI>
  );
};

export default Button;
