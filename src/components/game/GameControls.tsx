import { Minus, Plus, Volume2, VolumeX, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface GameControlsProps {
  speed: number;
  isMuted: boolean;
  showUsedCards: boolean;
  onSpeedChange: (delta: number) => void;
  onMuteToggle: () => void;
  onUsedCardsToggle: () => void;
  className?: string;
}

export function GameControls({
  speed,
  isMuted,
  showUsedCards,
  onSpeedChange,
  onMuteToggle,
  onUsedCardsToggle,
  className,
}: GameControlsProps) {
  return (
    <div className={cn('flex items-center justify-center gap-4', className)}>
      <div className="flex items-center gap-2 bg-card/80 rounded-full px-4 py-2 border border-border">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8"
          onClick={() => onSpeedChange(-0.25)}
          disabled={speed <= 0.5}
        >
          <Minus className="w-4 h-4" />
        </Button>
        <span className="text-sm font-medium min-w-[60px] text-center">
          Speed: {speed.toFixed(2)}x
        </span>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8"
          onClick={() => onSpeedChange(0.25)}
          disabled={speed >= 2}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      
      <Button
        variant={showUsedCards ? 'default' : 'outline'}
        size="sm"
        onClick={onUsedCardsToggle}
        className="gap-2"
      >
        <Archive className="w-4 h-4" />
        Used Cards
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={onMuteToggle}
      >
        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </Button>
    </div>
  );
}
