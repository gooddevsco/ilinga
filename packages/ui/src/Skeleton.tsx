import { cn } from './cn.js';

export interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: 'sm' | 'md' | 'lg' | 'full';
}

export const Skeleton = ({
  className,
  width,
  height = 16,
  rounded = 'md',
}: SkeletonProps): JSX.Element => (
  <div
    aria-hidden="true"
    style={{
      width: typeof width === 'number' ? `${width}px` : width,
      height: typeof height === 'number' ? `${height}px` : height,
    }}
    className={cn(
      'animate-pulse bg-[color:var(--color-accent-soft)]',
      rounded === 'sm' && 'rounded-sm',
      rounded === 'md' && 'rounded-md',
      rounded === 'lg' && 'rounded-lg',
      rounded === 'full' && 'rounded-full',
      className,
    )}
  />
);
