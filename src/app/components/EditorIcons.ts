// This file centralizes Lucide icons to reduce the number of individual imports
// Only the most commonly used icons are loaded immediately
import { 
  Bold, 
  Italic, 
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Star,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  FileSpreadsheet,
  ExternalLink
} from 'lucide-react';

// Core icons that are used in the main UI
export const CoreIcons = {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Star,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  FileSpreadsheet,
  ExternalLink
};

// Lazily load less frequently used icons
export const loadExtendedIcons = async () => {
  const [
    List,
    ListOrdered,
    CheckSquare,
    Link,
    Image,
    Table,
    Heading1,
    Heading2
  ] = await Promise.all([
    import('lucide-react').then(m => m.List),
    import('lucide-react').then(m => m.ListOrdered),
    import('lucide-react').then(m => m.CheckSquare),
    import('lucide-react').then(m => m.Link),
    import('lucide-react').then(m => m.Image),
    import('lucide-react').then(m => m.Table),
    import('lucide-react').then(m => m.Heading1),
    import('lucide-react').then(m => m.Heading2)
  ]);

  return {
    List,
    ListOrdered,
    CheckSquare,
    Link,
    Image,
    Table,
    Heading1,
    Heading2
  };
}; 