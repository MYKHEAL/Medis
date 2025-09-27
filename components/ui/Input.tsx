'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/ui-utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'default' | 'glass';
  icon?: React.ReactNode;
  loading?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    label,
    error,
    helperText,
    variant = 'default',
    icon,
    loading = false,
    disabled,
    ...props 
  }, ref) => {
    const baseStyles = 'w-full px-4 py-3 rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variants = {
      default: cn(
        'bg-white border-gray-300 text-gray-900 placeholder-gray-400',
        'focus:border-blue-500 focus:ring-blue-500',
        error && 'border-red-500 focus:border-red-500 focus:ring-red-500'
      ),
      glass: cn(
        'bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder-white/60',
        'focus:border-white/40 focus:ring-white/30 focus:bg-white/20',
        error && 'border-red-400/60 focus:border-red-400 focus:ring-red-400/50'
      ),
    };

    return (
      <div className="space-y-2">
        {label && (
          <motion.label 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'block text-sm font-medium',
              variant === 'glass' ? 'text-white' : 'text-gray-700'
            )}
          >
            {label}
          </motion.label>
        )}
        
        <div className="relative">
          {icon && (
            <div className={cn(
              'absolute left-3 top-1/2 transform -translate-y-1/2 z-10',
              variant === 'glass' ? 'text-white/60' : 'text-gray-400'
            )}>
              {icon}
            </div>
          )}
          
          <motion.div
            whileFocus={{ scale: 1.01 }}
            transition={{ type: "spring" as const, stiffness: 300, damping: 20 }}
          >
            <input
              ref={ref}
              className={cn(
                baseStyles,
                variants[variant],
                icon && 'pl-10',
                error && 'pr-10',
                className
              )}
              disabled={disabled || loading}
              {...props}
            />
          </motion.div>
          
          {loading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className={cn(
                'animate-spin rounded-full h-4 w-4 border-2',
                variant === 'glass' 
                  ? 'border-white/30 border-t-white' 
                  : 'border-gray-300 border-t-gray-600'
              )} />
            </div>
          )}
          
          {error && !loading && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
            >
              <ExclamationCircleIcon className={cn(
                'h-5 w-5',
                variant === 'glass' ? 'text-red-400' : 'text-red-500'
              )} />
            </motion.div>
          )}
        </div>
        
        <AnimatePresence>
          {(error || helperText) && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className={cn(
                'text-sm flex items-center space-x-1',
                error 
                  ? (variant === 'glass' ? 'text-red-300' : 'text-red-600')
                  : (variant === 'glass' ? 'text-white/70' : 'text-gray-600')
              )}
            >
              {error ? (
                <>
                  <ExclamationCircleIcon className="h-4 w-4" />
                  <span>{error}</span>
                </>
              ) : (
                <span>{helperText}</span>
              )}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
export type { InputProps };