'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon,
  ClockIcon 
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/ui-utils';

interface StatusIndicatorProps {
  status: 'success' | 'warning' | 'error' | 'pending' | 'info';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  children?: React.ReactNode;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  size = 'md',
  animated = true,
  children
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'success':
        return {
          icon: CheckCircleIcon,
          className: 'text-emerald-600 bg-emerald-50 border-emerald-200',
          dotClassName: 'bg-emerald-500',
        };
      case 'warning':
        return {
          icon: ExclamationTriangleIcon,
          className: 'text-yellow-600 bg-yellow-50 border-yellow-200',
          dotClassName: 'bg-yellow-500',
        };
      case 'error':
        return {
          icon: ExclamationTriangleIcon,
          className: 'text-red-600 bg-red-50 border-red-200',
          dotClassName: 'bg-red-500',
        };
      case 'pending':
        return {
          icon: ClockIcon,
          className: 'text-blue-600 bg-blue-50 border-blue-200',
          dotClassName: 'bg-blue-500',
        };
      case 'info':
        return {
          icon: InformationCircleIcon,
          className: 'text-gray-600 bg-gray-50 border-gray-200',
          dotClassName: 'bg-gray-500',
        };
    }
  };

  const getSizeConfig = () => {
    switch (size) {
      case 'sm':
        return {
          containerSize: 'h-6 w-6',
          iconSize: 'h-4 w-4',
          dotSize: 'h-2 w-2',
        };
      case 'md':
        return {
          containerSize: 'h-8 w-8',
          iconSize: 'h-5 w-5',
          dotSize: 'h-3 w-3',
        };
      case 'lg':
        return {
          containerSize: 'h-10 w-10',
          iconSize: 'h-6 w-6',
          dotSize: 'h-4 w-4',
        };
    }
  };

  const { icon: Icon, className, dotClassName } = getStatusConfig();
  const { containerSize, iconSize, dotSize } = getSizeConfig();

  const pulseAnimation = {
    scale: [1, 1.2, 1],
    opacity: [1, 0.8, 1],
  };

  return (
    <div className="inline-flex items-center space-x-2">
      <motion.div
        className={cn(
          'inline-flex items-center justify-center rounded-full border',
          containerSize,
          className
        )}
        animate={animated && status === 'pending' ? pulseAnimation : undefined}
        transition={{ 
          duration: 2, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
      >
        <Icon className={cn(iconSize)} />
      </motion.div>
      
      {children && (
        <span className="text-sm font-medium text-gray-900">
          {children}
        </span>
      )}
    </div>
  );
};

export { StatusIndicator };