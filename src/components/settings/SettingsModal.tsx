import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTheme, ThemeName } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { CheckIcon } from '@heroicons/react/24/solid';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { theme, setTheme, themes } = useTheme();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-display">Settings</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Theme Selection */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Theme</h3>
            <div className="grid gap-3">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-lg border transition-all",
                    theme === t.id
                      ? "border-primary bg-primary/10"
                      : "border-border bg-secondary/50 hover:bg-secondary"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <ThemePreview themeId={t.id} />
                    <div className="text-left">
                      <p className="font-medium text-foreground">{t.name}</p>
                      <p className="text-sm text-muted-foreground">{t.description}</p>
                    </div>
                  </div>
                  {theme === t.id && (
                    <CheckIcon className="w-5 h-5 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ThemePreview({ themeId }: { themeId: ThemeName }) {
  const colors = themeId === 'lucky-green' 
    ? { bg: '#0d1a14', primary: '#1a9c6c', accent: '#4de6ac' }
    : { bg: '#141414', primary: '#a6a6a6', accent: '#bfbfbf' };

  return (
    <div 
      className="w-10 h-10 rounded-lg border border-border overflow-hidden flex items-center justify-center"
      style={{ backgroundColor: colors.bg }}
    >
      <div 
        className="w-4 h-4 rounded-full"
        style={{ 
          background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})` 
        }}
      />
    </div>
  );
}
