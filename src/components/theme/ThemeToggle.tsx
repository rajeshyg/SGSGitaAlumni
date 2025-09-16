import { useTheme } from '../../lib/theme/hooks';
import { ThemedButton } from './ThemedButton';
import { cn } from '../../lib/utils';
import type { ThemeName } from '../../lib/theme/types';

const THEME_CONFIG = {
  dark: { icon: '🌙', label: 'Dark' },
  gita: { icon: '🕉️', label: 'Gita' },
  professional: { icon: '💼', label: 'Professional' },
  default: { icon: '☀️', label: 'Default' }
} as const;

function getThemeIcon(theme: ThemeName) {
  return THEME_CONFIG[theme]?.icon || THEME_CONFIG.default.icon;
}

function getThemeLabel(theme: ThemeName) {
  return THEME_CONFIG[theme]?.label || THEME_CONFIG.default.label;
}

function getNextTheme(currentTheme: ThemeName, availableThemes: ThemeName[]) {
  const currentIndex = availableThemes.indexOf(currentTheme);
  const nextIndex = (currentIndex + 1) % availableThemes.length;
  return availableThemes[nextIndex];
}

function ThemeSelector({ currentTheme, availableThemes, onThemeChange }: {
  currentTheme: ThemeName
  availableThemes: ThemeName[]
  onThemeChange: (theme: ThemeName) => void
}) {
  return (
    <div className="flex gap-1">
      {availableThemes.map((theme) => (
        <button
          key={theme}
          type="button"
          onClick={() => onThemeChange(theme)}
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
  );
}

export function ThemeToggle() {
  const { currentTheme, setTheme, availableThemes } = useTheme();

  const handleThemeToggle = () => {
    const nextTheme = getNextTheme(currentTheme, availableThemes);
    setTheme(nextTheme);
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

      <ThemeSelector
        currentTheme={currentTheme}
        availableThemes={availableThemes}
        onThemeChange={setTheme}
      />
    </div>
  );
}