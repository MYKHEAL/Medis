'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/ui-utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'glass' | 'gradient';
  className?: string;
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'default',
  className,
  text
}) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };

  const variants = {
    default: 'border-gray-300 border-t-blue-600',
    glass: 'border-white/30 border-t-white',
    gradient: 'border-transparent bg-gradient-to-r from-blue-500 to-purple-500',
  };

  const spinnerClass = variant === 'gradient' 
    ? cn(
        'rounded-full animate-spin',
        sizes[size],
        'bg-gradient-to-r from-blue-500 to-purple-500',
        'relative overflow-hidden'
      )
    : cn(
        'animate-spin rounded-full border-2',
        sizes[size],
        variants[variant]
      );

  return (
    <div className={cn('flex flex-col items-center justify-center space-y-3', className)}>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {variant === 'gradient' ? (
          <div className={spinnerClass}>
            <div className="absolute inset-1 bg-slate-900 rounded-full" />
          </div>
        ) : (
          <div className={spinnerClass} />
        )}
      </motion.div>
      
      {text && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={cn(
            'font-medium',
            textSizes[size],
            variant === 'glass' ? 'text-white/80' : 'text-gray-600'
          )}
        >
          {text}
        </motion.p>
      )}
    </div>
  );
};

export { LoadingSpinner };
export type { LoadingSpinnerProps };