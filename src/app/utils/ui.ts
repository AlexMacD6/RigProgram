/**
 * Common UI utilities
 */

import { twMerge } from 'tailwind-merge';
import { clsx } from 'clsx';

/**
 * Combines tailwind classes with proper merging of conflicting classes
 * This is used across components for consistent class name handling
 */
export const cn = (...inputs: any[]) => {
  return twMerge(clsx(inputs));
}; 