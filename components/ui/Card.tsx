'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/ui-utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outline' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  gradient?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ 
    className, 
    variant = 'default', 
    padding = 'md',
    hover = false,
    gradient = false,
    children,
    ...props 
  }, ref) => {
    const baseStyles = 'rounded-2xl transition-all duration-200';
    
    const variants = {
      default: 'bg-white shadow-lg border border-gray-100 dark:bg-gray-900 dark:border-gray-800',
      elevated: 'bg-white shadow-2xl shadow-black/10 border-0 dark:bg-gray-900',
      outline: 'bg-transparent border-2 border-gray-200 dark:border-gray-700',
      glass: 'bg-white/80 backdrop-blur-xl border border-white/20 shadow-xl dark:bg-gray-900/80',
    };

    const paddings = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
      xl: 'p-10',
    };

    const gradientStyle = gradient 
      ? 'bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800'
      : '';

    const motionProps = hover ? {
      initial: { y: 0 },
      whileHover: { y: -4, transition: { duration: 0.2 } }
    } : {};

    return (
      <motion.div
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          paddings[padding],
          gradientStyle,
          hover && 'hover:shadow-2xl hover:shadow-black/20 hover:-translate-y-1',
          className
        )}
        {...motionProps}
        {...(props as any)}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5 pb-6", className)}
      {...props}
    />
  )
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-2xl font-bold leading-none tracking-tight", className)}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm text-gray-600 dark:text-gray-400", className)}
      {...props}
    />
  )
);
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("pt-0", className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center pt-6", className)}
      {...props}
    />
  )
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };