import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const gradients = {
  primary: 'bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600',
  secondary: 'bg-gradient-to-r from-emerald-500 to-teal-600',
  accent: 'bg-gradient-to-r from-pink-500 to-rose-500',
  medical: 'bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500',
  admin: 'bg-gradient-to-r from-indigo-600 to-purple-600',
  hospital: 'bg-gradient-to-r from-emerald-500 to-green-600',
  patient: 'bg-gradient-to-r from-purple-500 to-pink-500',
};

export const animations = {
  fadeIn: 'animate-in fade-in duration-500',
  slideUp: 'animate-in slide-in-from-bottom-4 duration-500',
  slideDown: 'animate-in slide-in-from-top-4 duration-500',
  slideLeft: 'animate-in slide-in-from-right-4 duration-500',
  slideRight: 'animate-in slide-in-from-left-4 duration-500',
  scaleIn: 'animate-in zoom-in-95 duration-300',
  bounceIn: 'animate-bounce',
  pulse: 'animate-pulse',
  spin: 'animate-spin',
};

export const shadows = {
  soft: 'shadow-lg shadow-black/5',
  medium: 'shadow-xl shadow-black/10',
  strong: 'shadow-2xl shadow-black/20',
  colored: 'shadow-lg shadow-blue-500/20',
  glow: 'shadow-2xl shadow-purple-500/25',
};

export const glassMorphism = {
  light: 'backdrop-blur-sm bg-white/10 border border-white/20',
  medium: 'backdrop-blur-md bg-white/20 border border-white/30',
  strong: 'backdrop-blur-lg bg-white/30 border border-white/40',
};

export const responsiveBreakpoints = {
  mobile: 'max-w-sm mx-auto px-4',
  tablet: 'max-w-2xl mx-auto px-6',
  desktop: 'max-w-7xl mx-auto px-8',
  wide: 'max-w-screen-2xl mx-auto px-12',
};

// Micro-interaction utilities
export const microInteractions = {
  hoverScale: 'hover:scale-105 transition-transform duration-200',
  hoverGlow: 'hover:shadow-lg hover:shadow-blue-500/25 transition-shadow duration-300',
  clickScale: 'active:scale-95 transition-transform duration-150',
  fadeInUp: 'opacity-0 translate-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500',
  staggerChildren: 'stagger-in-100',
};