'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/ui-utils';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'default' | 'glass';
  options: SelectOption[];
  placeholder?: string;
  loading?: boolean;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ 
    className, 
    label,
    error,
    helperText,
    variant = 'default',
    options,
    placeholder = 'Select an option...',
    loading = false,
    disabled,
    ...props 
  }, ref) => {
    const baseStyles = 'w-full px-4 py-3 pr-10 rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer';
    
    const variants = {
      default: cn(
        'bg-white border-gray-300 text-gray-900',
        'focus:border-blue-500 focus:ring-blue-500',
        error && 'border-red-500 focus:border-red-500 focus:ring-red-500'
      ),
      glass: cn(
        'bg-white/10 backdrop-blur-sm border-white/20 text-white',
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
          <select
            ref={ref}
            className={cn(
              baseStyles,
              variants[variant],
              className
            )}
            disabled={disabled || loading}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option 
                key={option.value} 
                value={option.value}
                disabled={option.disabled}
                className={variant === 'glass' ? 'bg-slate-800 text-white' : 'bg-white text-gray-900'}
              >
                {option.label}
              </option>
            ))}
          </select>
          
          <div className={cn(
            'absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none flex items-center space-x-1',
            variant === 'glass' ? 'text-white/60' : 'text-gray-400'
          )}>
            {loading ? (
              <div className={cn(
                'animate-spin rounded-full h-4 w-4 border-2',
                variant === 'glass' 
                  ? 'border-white/30 border-t-white' 
                  : 'border-gray-300 border-t-gray-600'
              )} />
            ) : error ? (
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              >
                <ExclamationCircleIcon className={cn(
                  'h-5 w-5',
                  variant === 'glass' ? 'text-red-400' : 'text-red-500'
                )} />
              </motion.div>
            ) : (
              <ChevronDownIcon className="h-5 w-5" />
            )}
          </div>
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

Select.displayName = 'Select';

export { Select };
export type { SelectProps, SelectOption };