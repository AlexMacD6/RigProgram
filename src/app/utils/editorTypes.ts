/**
 * Shared editor type definitions
 * This file centralizes common types used across editor components
 */

/**
 * Base editor properties interface shared by all editor components
 */
export interface BaseEditorProps {
  initialContent: string;
  onChange: (html: string) => void;
  readOnly?: boolean;
  className?: string;
}

/**
 * Toolbar button props
 */
export interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  title?: string;
  children: React.ReactNode;
} 