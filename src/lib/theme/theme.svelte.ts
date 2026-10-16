export type ThemeMode = 'dark' | 'light' | 'auto';

export type ThemeColor =
  | 'indigo'
  | 'slate'
  | 'blue'
  | 'cyan'
  | 'jade'
  | 'pumpkin'
  | 'amber'
  | 'violet'
  | 'red'
  | 'zinc';

export interface ThemeOption {
  id: ThemeColor;
  label: string;
  preview: string;
}

export const THEME_COLORS: ThemeOption[] = [
  { id: 'indigo', label: 'Indigo', preview: '#655cd6' },
  { id: 'slate', label: 'Slate', preview: '#5d6b89' },
  { id: 'blue', label: 'Azure', preview: '#2060df' },
  { id: 'cyan', label: 'Cyan', preview: '#047878' },
  { id: 'jade', label: 'Jade', preview: '#007a50' },
  { id: 'pumpkin', label: 'Pumpkin', preview: '#9c5900' },
  { id: 'amber', label: 'Amber', preview: '#876400' },
  { id: 'violet', label: 'Violet', preview: '#8352c5' },
  { id: 'red', label: 'Red', preview: '#c52f21' },
  { id: 'zinc', label: 'Zinc', preview: '#646b79' }
];

class ThemeService {
  public mode = $state<ThemeMode>('dark');
  public color = $state<ThemeColor>('indigo');

  init() {
    if (typeof window === 'undefined') return;

    const savedMode = localStorage.getItem('vxml_theme_mode') as ThemeMode | null;
    const savedColor = localStorage.getItem('vxml_theme_color') as ThemeColor | null;

    if (savedMode && ['dark', 'light', 'auto'].includes(savedMode)) {
      this.mode = savedMode;
    } else {
      this.mode = 'dark';
    }

    if (savedColor && THEME_COLORS.some((c) => c.id === savedColor)) {
      this.color = savedColor;
    } else {
      this.color = 'indigo';
    }

    this.apply();

    // Listen to OS theme changes if mode is auto
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (this.mode === 'auto') {
        this.apply();
      }
    });
  }

  setMode(newMode: ThemeMode) {
    this.mode = newMode;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('vxml_theme_mode', newMode);
    }
    this.apply();
  }

  setColor(newColor: ThemeColor) {
    this.color = newColor;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('vxml_theme_color', newColor);
    }
    this.apply();
  }

  toggleMode() {
    this.setMode(this.mode === 'dark' ? 'light' : 'dark');
  }

  private apply() {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    let effectiveTheme = this.mode;
    if (this.mode === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      effectiveTheme = prefersDark ? 'dark' : 'light';
    }

    root.setAttribute('data-theme', effectiveTheme);
    root.setAttribute('data-pico-color', this.color);
  }
}

export const theme = new ThemeService();
