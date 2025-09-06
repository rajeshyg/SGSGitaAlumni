import { useTheme } from '../../lib/theme/hooks';
import { ThemedButton } from './ThemedButton';
import { cn } from '../../lib/utils';

export function ThemeToggle() {
  const { currentTheme, setTheme, availableThemes } = useTheme();
  
  const getNextTheme = () => {
    const currentIndex = availableThemes.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % availableThemes.length;
    return availableThemes[nextIndex];
  };
  
  const handleThemeToggle = () => {
    const nextTheme = getNextTheme();
    setTheme(nextTheme);
  };
  
  const getThemeIcon = (theme: string) => {
    switch (theme) {
      case 'dark':
        return '🌙';
      case 'gita':
        return '🕉️';
      case 'professional':
        return '💼';
      default:
        return '☀️';
    }
  };
  
  const getThemeLabel = (theme: string) => {
    switch (theme) {
      case 'dark':
        return 'Dark';
      case 'gita':
        return 'Gita';
      case 'professional':
        return 'Professional';
      default:
        return 'Default';
    }
  };
  
  return (
    <div className="flex items-center gap-2">
      <ThemedButton
        onClick={handleThemeToggle}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <span className="text-lg">{getThemeIcon(currentTheme)}</span>
        <span>{getThemeLabel(currentTheme)}</span>
      </ThemedButton>
      
      <div className="flex gap-1">
        {availableThemes.map((theme) => (
          <button
            key={theme}
            type="button"
            onClick={() => setTheme(theme)}
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all duration-200',
              currentTheme === theme
                ? 'bg-accent-color text-white'
                : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'
            )}
            title={`Switch to ${getThemeLabel(theme)} theme`}
          >
            {getThemeIcon(theme)}
          </button>
        ))}
      </div>
    </div>
  );
}