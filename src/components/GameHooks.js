import { useState, useEffect, useRef } from 'react';
import { Animated } from 'react-native';

/**
 * Game Timer Hook
 * @param {number} initialTime - Initial time in seconds
 * @param {boolean} isActive - Whether timer is active
 * @param {function} onTimeUp - Callback when time reaches 0
 */

export const useGameTimer = (initialTime, gameLevel, isActive, onTimeUp) => {
  console.log('useGameTimer called with initialTime:', initialTime, 'gameLevel:', gameLevel, 'isActive:', isActive);
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const intervalRef = useRef(null);
  const isActiveRef = useRef(isActive);

  // Keep track of isActive in a ref to avoid stale closures
  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  // Update timeLeft when initialTime or gameLevel changes
  useEffect(() => {
    console.log('Setting timeLeft to:', initialTime, 'for level:', gameLevel);
    setTimeLeft(initialTime);
  }, [initialTime, gameLevel]);

  // Main timer effect
  useEffect(() => {
    // Clear any existing interval first
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (isActive) {
      console.log('Timer started for level:', gameLevel, 'with time:', timeLeft);

      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          console.log('Timer tick, prev:', prev);
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            if (onTimeUp) onTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      console.log('Timer stopped/paused');
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, gameLevel]); // When either changes, restart the interval

  const resetTimer = (newTime) => {
    console.log('resetTimer called with:', newTime);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    const timeToSet = newTime || initialTime;
    setTimeLeft(timeToSet);

    // If the game is active, restart the interval with the new time
    if (isActiveRef.current) {
      console.log('Restarting timer after reset with time:', timeToSet);
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            if (onTimeUp) onTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  return { timeLeft, resetTimer };
};

/**
 * Animation Hook for various game animations
 */
export const useGameAnimations = () => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const scoreAnim = useRef(new Animated.Value(1)).current;
  const levelAnim = useRef(new Animated.Value(0)).current;
  const hintAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const animateScale = (targetValue = 1.1, duration = 200) => {
    return Animated.spring(scaleAnim, {
      toValue: targetValue,
      useNativeDriver: true,
    });
  };

  const animateScore = () => {
    Animated.sequence([
      Animated.timing(scoreAnim, {
        toValue: 1.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scoreAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateLevelUp = (onComplete) => {
    Animated.sequence([
      Animated.timing(levelAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(1500),
      Animated.timing(levelAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(onComplete);
  };

  const startHintPulse = () => {
    return Animated.loop(
      Animated.sequence([
        Animated.timing(hintAnim, {
          toValue: 1.2,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(hintAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );
  };

  const startButtonPulse = () => {
    return Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ])
    );
  };

  const animateShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const resetAnimations = () => {
    scaleAnim.setValue(1);
    scoreAnim.setValue(1);
    levelAnim.setValue(0);
    hintAnim.setValue(1);
    pulseAnim.setValue(1);
    shakeAnim.setValue(0);
  };

  return {
    scaleAnim,
    scoreAnim,
    levelAnim,
    hintAnim,
    pulseAnim,
    shakeAnim,
    animateScale,
    animateScore,
    animateLevelUp,
    startHintPulse,
    startButtonPulse,
    animateShake,
    resetAnimations,
  };
};

/**
 * Game State Hook
 * @param {object} initialState - Initial game state
 */
export const useGameState = (initialState = {}) => {
  const [level, setLevel] = useState(initialState.level || 1);
  const [score, setScore] = useState(initialState.score || 0);
  const [isPlaying, setIsPlaying] = useState(initialState.isPlaying || false);
  const [lastPoints, setLastPoints] = useState(0);

  const addPoints = (points, multiplier = 1) => {
    const finalPoints = points * multiplier;
    setScore(prev => prev + finalPoints);
    setLastPoints(finalPoints);
  };

  const incrementLevel = () => {
    setLevel(prev => prev + 1);
  };

  const resetGame = () => {
    setLevel(initialState.level || 1);
    setScore(initialState.score || 0);
    setIsPlaying(false);
    setLastPoints(0);
  };

  return {
    level,
    score,
    isPlaying,
    lastPoints,
    setLevel,
    setScore,
    setIsPlaying,
    setLastPoints,
    addPoints,
    incrementLevel,
    resetGame,
  };
};

/**
 * Resource Counter Hook (for limited resources like hints, adds, etc.)
 */
export const useResourceCounter = (maxCount = 5) => {
  const [count, setCount] = useState(0);
  const [isExhausted, setIsExhausted] = useState(false);

  useEffect(() => {
    setIsExhausted(count >= maxCount);
  }, [count, maxCount]);

  const increment = () => {
    if (count < maxCount) {
      setCount(prev => prev + 1);
    }
  };

  const decrement = () => {
    if (count > 0) {
      setCount(prev => prev - 1);
    }
  };

  const reset = () => {
    setCount(0);
    setIsExhausted(false);
  };

  const canUse = count < maxCount;
  const remaining = maxCount - count;

  return {
    count,
    remaining,
    canUse,
    isExhausted,
    increment,
    decrement,
    reset,
    setCount,
  };
};