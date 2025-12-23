import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { GameState } from '@/types/game';
import { Star, Trophy } from 'lucide-react';

export default function GameOverScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const gameState = location.state?.gameState as GameState | undefined;

  if (!gameState) {
    navigate('/');
    return null;
  }

  const getStarRating = (score: number) => {
    if (score >= 5000) return 5;
    if (score >= 3000) return 4;
    if (score >= 1500) return 3;
    if (score >= 500) return 2;
    return 1;
  };

  const stars = getStarRating(gameState.score);
  const messages = [
    "Keep practicing, partner!",
    "Not bad for a greenhorn!",
    "You're getting the hang of it!",
    "Sharp shootin' there!",
    "Legendary gunslinger!"
  ];

  return (
    <div className="min-h-screen modern-bg flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="text-center"
      >
        <Trophy className="w-20 h-20 text-gold mx-auto mb-4" />
        <h1 className="text-4xl font-display text-primary mb-2">Game Over</h1>
        
        <div className="flex justify-center gap-1 my-4">
          {[1, 2, 3, 4, 5].map(i => (
            <Star
              key={i}
              className={`w-8 h-8 ${i <= stars ? 'text-gold fill-gold' : 'text-muted-foreground'}`}
            />
          ))}
        </div>
        
        <p className="text-lg text-muted-foreground mb-6">{messages[stars - 1]}</p>
        
        <div className="text-5xl font-display text-gold text-glow mb-8">
          {gameState.score.toLocaleString()}
        </div>

        <div className="bg-card/80 rounded-xl p-4 mb-6 text-left">
          <p className="text-sm text-muted-foreground">Hands Played: {gameState.handsPlayed}</p>
          {gameState.mode === 'ssc' && (
            <p className="text-sm text-muted-foreground">Level Reached: {gameState.sscLevel}</p>
          )}
        </div>

        <div className="flex flex-col gap-3 w-full max-w-xs mx-auto">
          <Button onClick={() => navigate('/leaderboard')} variant="outline" size="lg">
            🏅 View Leaderboard
          </Button>
          <Button onClick={() => navigate(`/play/${gameState.mode}`)} size="lg">
            🔄 Play Again
          </Button>
          <Button onClick={() => navigate('/')} variant="ghost">
            🏠 Back to Menu
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
