
import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string; // Tailwind color class e.g. text-blue-500
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', color = 'text-sky-400' }) => {
  let dimension = 'h-8 w-8';
  if (size === 'sm') dimension = 'h-5 w-5';
  if (size === 'lg') dimension = 'h-12 w-12';

  return (
    <div className={`animate-spin rounded-full ${dimension} border-t-2 border-b-2 border-transparent ${color.replace('text-', 'border-')}`} 
         style={{borderColor: 'currentColor', borderTopColor: 'transparent', borderBottomColor: 'transparent'}}>
    </div>
  );
};
