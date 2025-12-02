import { Sun, Moon } from 'lucide-react';
import { Button } from './ui/button';
import { useTheme } from '@/context/ThemeContext';

export function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="h-9 w-9 rounded-md transition-colors"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <Sun className="h-5 w-5 text-yellow-400 transition-transform hover:rotate-12" />
      ) : (
        <Moon className="h-5 w-5 text-slate-700 transition-transform hover:-rotate-12" />
      )}
    </Button>
  );
}

