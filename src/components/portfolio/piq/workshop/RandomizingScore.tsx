import React, { useState, useEffect } from 'react';

interface RandomizingScoreProps {
  score: number;
  isAnalyzing: boolean;
  className?: string;
}

export const RandomizingScore: React.FC<RandomizingScoreProps> = ({
  score,
  isAnalyzing,
  className = "text-3xl font-bold"
}) => {
  const [displayScore, setDisplayScore] = useState(score);

  useEffect(() => {
    if (!isAnalyzing) {
      setDisplayScore(score);
      return;
    }

    // Slot machine effect
    const interval = setInterval(() => {
      // Generate a random number between 0 and 99
      const randomScore = Math.floor(Math.random() * 100);
      setDisplayScore(randomScore);
    }, 80); // Update every 80ms for rapid movement

    return () => clearInterval(interval);
  }, [isAnalyzing, score]);

  return (
    <span className={`${className} transition-all duration-100`}>
      {displayScore}
    </span>
  );
};

