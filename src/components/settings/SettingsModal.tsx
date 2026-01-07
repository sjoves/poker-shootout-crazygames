// Settings modal
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTheme, ThemeName, THEMES } from '@/contexts/ThemeContext';
import { useAudio } from '@/contexts/AudioContext';
import { cn } from '@/lib/utils';
import { CheckIcon } from '@heroicons/react/24/solid';
import { SpeakerWaveIcon, SpeakerXMarkIcon, MusicalNoteIcon } from '@heroicons/react/24/outline';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { theme, setTheme, themes } = useTheme();

  const audio = useAudio();
  const { masterVolume, setMasterVolume, isMuted, toggleMute } = audio;


  const handleSfxToggle = (enabled: boolean) => {
    audio.setSfxEnabled(enabled);
    if (enabled) {
      setTimeout(() => audio.playSound('buttonClick'), 50);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border-border max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-display">Settings</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Audio Settings */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Audio</h3>
            
            {/* Master Volume */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={toggleMute}
                  className="flex items-center gap-2"
                >
                  {!isMuted ? (
                    <SpeakerWaveIcon className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <SpeakerXMarkIcon className="w-5 h-5 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium">Master Volume</span>
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground w-12 text-right">
                    {Math.round(masterVolume * 100)}%
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={toggleMute}
                  >
                    {!isMuted ? (
                      <SpeakerWaveIcon className="w-4 h-4" />
                    ) : (
                      <SpeakerXMarkIcon className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
              <Slider
                value={[masterVolume * 100]}
                onValueChange={([value]) => {
                  // Real-time updates while dragging
                  setMasterVolume(value / 100);
                }}
                max={100}
                step={5}
                className="w-full"
              />
            </div>

            {/* Sound Effects */}
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {audio.sfxEnabled ? (
                    <SpeakerWaveIcon className="w-5 h-5 text-primary" />
                  ) : (
                    <SpeakerXMarkIcon className="w-5 h-5 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium">Sound Effects</span>
                </div>
                <Switch
                  checked={audio.sfxEnabled}
                  onCheckedChange={handleSfxToggle}
                />
              </div>
              {audio.sfxEnabled && (
                <div className="pl-7">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">Volume</span>
                    <span className="text-xs text-muted-foreground">
                      {Math.round(audio.sfxVolume * 100)}%
                    </span>
                  </div>
                  <Slider
                    value={[audio.sfxVolume * 100]}
                    onValueChange={([value]) => {
                      audio.setSfxVolume(value / 100);
                    }}
                    onValueCommit={() => audio.playSound('buttonClick')}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>
              )}
            </div>

            {/* Music */}
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MusicalNoteIcon className={cn("w-5 h-5", audio.musicEnabled ? "text-primary" : "text-muted-foreground")} />
                  <span className="text-sm font-medium">Music</span>
                </div>
                <Switch
                  checked={audio.musicEnabled}
                  onCheckedChange={audio.setMusicEnabled}
                />
              </div>
              {audio.musicEnabled && (
                <div className="pl-7">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">Volume</span>
                    <span className="text-xs text-muted-foreground">
                      {Math.round(audio.musicVolume * 100)}%
                    </span>
                  </div>
                  <Slider
                    value={[audio.musicVolume * 100]}
                    onValueChange={([value]) => audio.setMusicVolume(value / 100)}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-border" />

          {/* Theme Selection */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Theme</h3>
            <div className="grid grid-cols-2 gap-3">
              {themes.map((t) => (
                <button
                  key={t.id}
                    onClick={() => {
                      setTheme(t.id);
                      audio.playSound('buttonClick');
                    }}
                  className={cn(
                    "flex items-center justify-center gap-2 p-3 rounded-lg border transition-all",
                    theme === t.id
                      ? "border-primary bg-primary/10"
                      : "border-border bg-secondary/50 hover:bg-secondary"
                  )}
                >
                  <p className="font-medium text-sm text-foreground">{t.name}</p>
                  {theme === t.id && (
                    <CheckIcon className="w-4 h-4 text-primary" />
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
