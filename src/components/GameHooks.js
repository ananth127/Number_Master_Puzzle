import { useState, useEffect, useRef } from 'react';
import { Animated } from 'react-native';

// ============================================================================
// STRATEGY PATTERN - Timer Strategies
// ============================================================================

/**
 * Abstract Timer Strategy
 */
class TimerStrategy {
  start(callback) {
    throw new Error('start() must be implemented');
  }

  stop() {
    throw new Error('stop() must be implemented');
  }

  reset() {
    throw new Error('reset() must be implemented');
  }
}

/**
 * Standard Timer Strategy - counts down every second
 */
class StandardTimerStrategy extends TimerStrategy {
  constructor() {
    super();
    this.intervalId = null;
  }

  start(callback) {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.intervalId = setInterval(callback, 1000);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  reset() {
    this.stop();
  }
}

/**
 * Timer Context - manages timer behavior using strategies
 */
class TimerContext {
  constructor(strategy = new StandardTimerStrategy()) {
    this.strategy = strategy;
  }

  setStrategy(strategy) {
    this.strategy.stop();
    this.strategy = strategy;
  }

  start(callback) {
    this.strategy.start(callback);
  }

  stop() {
    this.strategy.stop();
  }

  reset() {
    this.strategy.reset();
  }
}

// ============================================================================
// STATE PATTERN - Game States
// ============================================================================

/**
 * Abstract Game State
 */
class GameState {
  constructor(context) {
    this.context = context;
  }

  handleStart() {
    throw new Error('handleStart() must be implemented');
  }

  handlePause() {
    throw new Error('handlePause() must be implemented');
  }

  handleResume() {
    throw new Error('handleResume() must be implemented');
  }

  handleStop() {
    throw new Error('handleStop() must be implemented');
  }

  getName() {
    throw new Error('getName() must be implemented');
  }
}

/**
 * Idle State - game not started
 */
class IdleState extends GameState {
  handleStart() {
    console.log('Starting game from idle state');
    this.context.setState(new PlayingState(this.context));
    return true;
  }

  handlePause() {
    console.log('Cannot pause - game not started');
    return false;
  }

  handleResume() {
    console.log('Cannot resume - game not started');
    return false;
  }

  handleStop() {
    console.log('Already stopped');
    return false;
  }

  getName() {
    return 'idle';
  }
}

/**
 * Playing State - game actively running
 */
class PlayingState extends GameState {
  handleStart() {
    console.log('Game already playing');
    return false;
  }

  handlePause() {
    console.log('Pausing game');
    this.context.setState(new PausedState(this.context));
    return true;
  }

  handleResume() {
    console.log('Already playing');
    return false;
  }

  handleStop() {
    console.log('Stopping game');
    this.context.setState(new IdleState(this.context));
    return true;
  }

  getName() {
    return 'playing';
  }
}

/**
 * Paused State - game temporarily stopped
 */
class PausedState extends GameState {
  handleStart() {
    console.log('Cannot start - game is paused. Resume instead.');
    return false;
  }

  handlePause() {
    console.log('Already paused');
    return false;
  }

  handleResume() {
    console.log('Resuming game');
    this.context.setState(new PlayingState(this.context));
    return true;
  }

  handleStop() {
    console.log('Stopping from pause');
    this.context.setState(new IdleState(this.context));
    return true;
  }

  getName() {
    return 'paused';
  }
}

/**
 * Game State Context - manages game state transitions
 */
class GameStateContext {
  constructor() {
    this.state = new IdleState(this);
    this.listeners = [];
  }

  setState(state) {
    this.state = state;
    this.notifyListeners();
  }

  addListener(listener) {
    this.listeners.push(listener);
  }

  removeListener(listener) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  notifyListeners() {
    this.listeners.forEach(listener => listener(this.state.getName()));
  }

  start() {
    return this.state.handleStart();
  }

  pause() {
    return this.state.handlePause();
  }

  resume() {
    return this.state.handleResume();
  }

  stop() {
    return this.state.handleStop();
  }

  getStateName() {
    return this.state.getName();
  }

  isPlaying() {
    return this.state.getName() === 'playing';
  }

  isPaused() {
    return this.state.getName() === 'paused';
  }

  isIdle() {
    return this.state.getName() === 'idle';
  }
}

// ============================================================================
// OOP - Timer Manager Class
// ============================================================================

class TimerManager {
  constructor(initialTime, onTimeUp) {
    this.initialTime = initialTime;
    this.timeLeft = initialTime;
    this.onTimeUp = onTimeUp;
    this.timerContext = new TimerContext();
    this.isActive = false;
  }

  tick() {
    this.timeLeft -= 1;
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.stop();
      if (this.onTimeUp) {
        this.onTimeUp();
      }
    }
    return this.timeLeft;
  }

  start() {
    if (this.isActive) return;
    this.isActive = true;
    this.timerContext.start(() => this.tick());
  }

  stop() {
    this.isActive = false;
    this.timerContext.stop();
  }

  reset(newTime = null) {
    this.stop();
    this.timeLeft = newTime !== null ? newTime : this.initialTime;
    this.initialTime = this.timeLeft;
  }

  getTimeLeft() {
    return this.timeLeft;
  }

  setTimeLeft(time) {
    this.timeLeft = time;
  }
}

// ============================================================================
// OOP - Animation Manager Class
// ============================================================================

class AnimationManager {
  constructor() {
    this.animations = {
      scale: new Animated.Value(1),
      score: new Animated.Value(1),
      level: new Animated.Value(0),
      hint: new Animated.Value(1),
      pulse: new Animated.Value(1),
      shake: new Animated.Value(0),
    };
    this.activeLoops = [];
  }

  getAnimation(name) {
    return this.animations[name];
  }

  animateScale(targetValue = 1.1) {
    return Animated.spring(this.animations.scale, {
      toValue: targetValue,
      useNativeDriver: true,
    });
  }

  animateScore() {
    Animated.sequence([
      Animated.timing(this.animations.score, {
        toValue: 1.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(this.animations.score, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }

  animateLevelUp(onComplete) {
    Animated.sequence([
      Animated.timing(this.animations.level, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(1500),
      Animated.timing(this.animations.level, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(onComplete);
  }

  startHintPulse() {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(this.animations.hint, {
          toValue: 1.2,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(this.animations.hint, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );
    this.activeLoops.push(loop);
    loop.start();
    return loop;
  }

  startButtonPulse() {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(this.animations.pulse, {
          toValue: 1.15,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(this.animations.pulse, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ])
    );
    this.activeLoops.push(loop);
    loop.start();
    return loop;
  }

  animateShake() {
    Animated.sequence([
      Animated.timing(this.animations.shake, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(this.animations.shake, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(this.animations.shake, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(this.animations.shake, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }

  stopAllLoops() {
    this.activeLoops.forEach(loop => loop.stop());
    this.activeLoops = [];
  }

  reset() {
    this.stopAllLoops();
    Object.values(this.animations).forEach((anim, index) => {
      const defaultValues = [1, 1, 0, 1, 1, 0];
      anim.setValue(defaultValues[index]);
    });
  }
}

// ============================================================================
// OOP - Score Manager Class
// ============================================================================

class ScoreManager {
  constructor(initialScore = 0) {
    this.score = initialScore;
    this.lastPoints = 0;
    this.multiplier = 1;
  }

  addPoints(points, customMultiplier = null) {
    const appliedMultiplier = customMultiplier !== null ? customMultiplier : this.multiplier;
    const finalPoints = points * appliedMultiplier;
    this.score += finalPoints;
    this.lastPoints = finalPoints;
    return this.score;
  }

  setMultiplier(multiplier) {
    this.multiplier = multiplier;
  }

  getScore() {
    return this.score;
  }

  getLastPoints() {
    return this.lastPoints;
  }

  reset() {
    this.score = 0;
    this.lastPoints = 0;
    this.multiplier = 1;
  }
}

// ============================================================================
// OOP - Resource Manager Class
// ============================================================================

class ResourceManager {
  constructor(maxCount = 5) {
    this.maxCount = maxCount;
    this.count = 0;
  }

  canUse() {
    return this.count < this.maxCount;
  }

  isExhausted() {
    return this.count >= this.maxCount;
  }

  getRemaining() {
    return this.maxCount - this.count;
  }

  increment() {
    if (this.canUse()) {
      this.count++;
      return true;
    }
    return false;
  }

  decrement() {
    if (this.count > 0) {
      this.count--;
      return true;
    }
    return false;
  }

  reset() {
    this.count = 0;
  }

  getCount() {
    return this.count;
  }

  setCount(count) {
    this.count = Math.max(0, Math.min(count, this.maxCount));
  }
}

// ============================================================================
// REACT HOOKS - Using OOP Classes
// ============================================================================

/**
 * Game Timer Hook with Strategy Pattern
 */
export const useGameTimer = (initialTime, gameLevel, isActive, onTimeUp) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const timerManagerRef = useRef(null);

  // Initialize timer manager
  useEffect(() => {
    timerManagerRef.current = new TimerManager(initialTime, onTimeUp);
    return () => {
      if (timerManagerRef.current) {
        timerManagerRef.current.stop();
      }
    };
  }, []);

  // Update time when level or initialTime changes
  useEffect(() => {
    if (timerManagerRef.current) {
      timerManagerRef.current.reset(initialTime);
      setTimeLeft(initialTime);
    }
  }, [initialTime, gameLevel]);

  // Handle active state changes
  useEffect(() => {
    const manager = timerManagerRef.current;
    if (!manager) return;

    if (isActive) {
      manager.start();
      const interval = setInterval(() => {
        setTimeLeft(manager.getTimeLeft());
      }, 100);
      return () => clearInterval(interval);
    } else {
      manager.stop();
    }
  }, [isActive]);

  const resetTimer = (newTime) => {
    if (timerManagerRef.current) {
      const resetValue = newTime !== undefined ? newTime : initialTime;
      timerManagerRef.current.reset(resetValue);
      setTimeLeft(resetValue);
      if (isActive) {
        timerManagerRef.current.start();
      }
    }
  };

  return { timeLeft, resetTimer };
};

/**
 * Game Animations Hook with Animation Manager
 */
export const useGameAnimations = () => {
  const managerRef = useRef(new AnimationManager());
  const manager = managerRef.current;

  useEffect(() => {
    return () => {
      manager.stopAllLoops();
    };
  }, []);

  return {
    scaleAnim: manager.getAnimation('scale'),
    scoreAnim: manager.getAnimation('score'),
    levelAnim: manager.getAnimation('level'),
    hintAnim: manager.getAnimation('hint'),
    pulseAnim: manager.getAnimation('pulse'),
    shakeAnim: manager.getAnimation('shake'),
    animateScale: (val) => manager.animateScale(val),
    animateScore: () => manager.animateScore(),
    animateLevelUp: (cb) => manager.animateLevelUp(cb),
    startHintPulse: () => manager.startHintPulse(),
    startButtonPulse: () => manager.startButtonPulse(),
    animateShake: () => manager.animateShake(),
    resetAnimations: () => manager.reset(),
  };
};

/**
 * Game State Hook with State Pattern
 */
export const useGameState = (initialState = {}) => {
  const [level, setLevel] = useState(initialState.level || 1);
  const scoreManagerRef = useRef(new ScoreManager(initialState.score || 0));
  const gameStateContextRef = useRef(new GameStateContext());
  const [stateName, setStateName] = useState('idle');
  const [score, setScore] = useState(initialState.score || 0);
  const [lastPoints, setLastPoints] = useState(0);

  useEffect(() => {
    const context = gameStateContextRef.current;
    context.addListener(setStateName);
    return () => context.removeListener(setStateName);
  }, []);

  const addPoints = (points, multiplier = 1) => {
    const manager = scoreManagerRef.current;
    manager.addPoints(points, multiplier);
    setScore(manager.getScore());
    setLastPoints(manager.getLastPoints());
  };

  const incrementLevel = () => {
    setLevel(prev => prev + 1);
  };

  const resetGame = () => {
    setLevel(initialState.level || 1);
    scoreManagerRef.current.reset();
    setScore(0);
    setLastPoints(0);
    gameStateContextRef.current.stop();
  };

  return {
    level,
    score,
    isPlaying: gameStateContextRef.current.isPlaying(),
    lastPoints,
    stateName,
    setLevel,
    setScore,
    setIsPlaying: (playing) => {
      if (playing) {
        gameStateContextRef.current.start();
      } else {
        gameStateContextRef.current.stop();
      }
    },
    setLastPoints,
    addPoints,
    incrementLevel,
    resetGame,
    gameStateContext: gameStateContextRef.current,
  };
};

/**
 * Resource Counter Hook with Resource Manager
 */
export const useResourceCounter = (maxCount = 5) => {
  const managerRef = useRef(new ResourceManager(maxCount));
  const [count, setCount] = useState(0);
  const [isExhausted, setIsExhausted] = useState(false);

  useEffect(() => {
    const manager = managerRef.current;
    setCount(manager.getCount());
    setIsExhausted(manager.isExhausted());
  }, []);

  const increment = () => {
    const manager = managerRef.current;
    if (manager.increment()) {
      setCount(manager.getCount());
      setIsExhausted(manager.isExhausted());
    }
  };

  const decrement = () => {
    const manager = managerRef.current;
    if (manager.decrement()) {
      setCount(manager.getCount());
      setIsExhausted(manager.isExhausted());
    }
  };

  const reset = () => {
    const manager = managerRef.current;
    manager.reset();
    setCount(0);
    setIsExhausted(false);
  };

  const updateCount = (newCount) => {
    const manager = managerRef.current;
    manager.setCount(newCount);
    setCount(manager.getCount());
    setIsExhausted(manager.isExhausted());
  };

  return {
    count,
    remaining: managerRef.current.getRemaining(),
    canUse: managerRef.current.canUse(),
    isExhausted,
    increment,
    decrement,
    reset,
    setCount: updateCount,
  };
};