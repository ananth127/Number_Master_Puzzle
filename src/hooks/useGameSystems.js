// ============================================================================
// FILE: src/hooks/useGameSystems.js
// ============================================================================

import { useRef, useEffect, useCallback, useState } from 'react';
import { ScoreSystem } from '../core/ScoreSystem';
import { TimerSystem } from '../core/TimerSystem';
import { LevelSystem } from '../core/LevelSystem';
import { ResourceSystem } from '../core/ResourceSystem';
import { StateMachine } from '../core/StateMachine';

/**
 * Custom hook to manage all game systems
 * Provides easy access to core game functionality
 */
export const useGameSystems = (config = {}) => {
  const systemsRef = useRef(null);
  const [systemsState, setSystemsState] = useState({
    score: 0,
    highScore: 0,
    level: 1,
    timeLeft: config.initialTime || 420,
    isPlaying: false,
    resources: {},
    initialized: false
  });

  // Initialize systems on mount
  useEffect(() => {
    if (!systemsRef.current) {
      initializeSystems();
    }

    return () => {
      // Cleanup
      if (systemsRef.current?.timerSystem) {
        systemsRef.current.timerSystem.stop();
      }
    };
  }, []);

  /**
   * Initialize all game systems
   */
  const initializeSystems = useCallback(() => {
    const systems = {};

    // Score System
    systems.scoreSystem = new ScoreSystem({
      initialScore: config.initialScore || 0,
      baseMultiplier: config.baseMultiplier || 1
    });

    // Timer System
    systems.timerSystem = new TimerSystem({
      duration: config.initialTime || 420,
      mode: config.timerMode || 'countdown',
      onComplete: config.onTimeUp || (() => {})
    });

    // Level System
    systems.levelSystem = new LevelSystem({
      startLevel: config.startLevel || 1,
      baseExpRequired: config.baseExpRequired || 100,
      expCurveType: config.expCurveType || 'linear',
      onLevelUp: config.onLevelUp || (() => {})
    });

    // Resource System
    systems.resourceSystem = new ResourceSystem({
      resources: config.resources || {
        addMoves: { initial: 0, max: 5 },
        hints: { initial: 0, max: 5 },
        changes: { initial: 0, max: 5 }
      }
    });

    // State Machine
    systems.stateMachine = new StateMachine('idle', {
      maxHistorySize: 10
    });

    // Setup state machine states
    setupStateMachine(systems.stateMachine, systems.timerSystem);

    // Subscribe to system events
    subscribeToSystems(systems);

    systemsRef.current = systems;

    setSystemsState(prev => ({
      ...prev,
      score: systems.scoreSystem.getScore(),
      highScore: systems.scoreSystem.getHighScore(),
      level: systems.levelSystem.getLevel(),
      timeLeft: systems.timerSystem.getTime(),
      initialized: true,
      resources: systems.resourceSystem.getAllResources()
    }));
  }, [config]);

  /**
   * Setup state machine states
   */
  const setupStateMachine = (stateMachine, timerSystem) => {
    stateMachine.addState('idle', {
      onEnter: () => {},
      allowedTransitions: ['playing']
    });

    stateMachine.addState('playing', {
      onEnter: () => timerSystem.start(),
      onExit: () => timerSystem.pause(),
      allowedTransitions: ['paused', 'gameOver']
    });

    stateMachine.addState('paused', {
      onEnter: () => {},
      allowedTransitions: ['playing', 'gameOver']
    });

    stateMachine.addState('gameOver', {
      onEnter: () => timerSystem.stop(),
      allowedTransitions: ['idle']
    });
  };

  /**
   * Subscribe to all system events
   */
  const subscribeToSystems = (systems) => {
    // Score updates
    systems.scoreSystem.subscribe((event, data) => {
      if (event === 'scoreAdded') {
        updateSystemsState();
      }
    });

    // Timer updates
    systems.timerSystem.subscribe((event, data) => {
      if (event === 'tick') {
        setSystemsState(prev => ({ ...prev, timeLeft: data }));
      }
    });

    // Level updates
    systems.levelSystem.subscribe((event, data) => {
      if (event === 'levelUp') {
        updateSystemsState();
      }
    });

    // Resource updates
    systems.resourceSystem.subscribe((event, data) => {
      updateSystemsState();
    });

    // State changes
    systems.stateMachine.subscribe((event, data) => {
      if (event === 'stateChanged') {
        updateSystemsState();
      }
    });
  };

  /**
   * Update systems state
   */
  const updateSystemsState = useCallback(() => {
    if (!systemsRef.current) return;

    const { scoreSystem, levelSystem, timerSystem, resourceSystem, stateMachine } = systemsRef.current;

    setSystemsState({
      score: scoreSystem.getScore(),
      highScore: scoreSystem.getHighScore(),
      level: levelSystem.getLevel(),
      timeLeft: timerSystem.getTime(),
      isPlaying: stateMachine.is('playing'),
      isPaused: stateMachine.is('paused'),
      isGameOver: stateMachine.is('gameOver'),
      resources: resourceSystem.getAllResources(),
      combo: scoreSystem.getCombo(),
      multiplier: scoreSystem.getMultiplier(),
      initialized: true
    });
  }, []);

  // System actions
  const actions = {
    // Score actions
    addScore: useCallback((points, metadata) => {
      systemsRef.current?.scoreSystem.addScore(points, metadata);
      updateSystemsState();
    }, [updateSystemsState]),

    incrementCombo: useCallback(() => {
      systemsRef.current?.scoreSystem.incrementCombo();
      updateSystemsState();
    }, [updateSystemsState]),

    resetCombo: useCallback(() => {
      systemsRef.current?.scoreSystem.resetCombo();
      updateSystemsState();
    }, [updateSystemsState]),

    // Level actions
    addExperience: useCallback((exp) => {
      systemsRef.current?.levelSystem.addExperience(exp);
      updateSystemsState();
    }, [updateSystemsState]),

    // Timer actions
    startTimer: useCallback(() => {
      systemsRef.current?.timerSystem.start();
      updateSystemsState();
    }, [updateSystemsState]),

    pauseTimer: useCallback(() => {
      systemsRef.current?.timerSystem.pause();
      updateSystemsState();
    }, [updateSystemsState]),

    resetTimer: useCallback((newTime) => {
      systemsRef.current?.timerSystem.reset(newTime);
      updateSystemsState();
    }, [updateSystemsState]),

    addTime: useCallback((seconds) => {
      systemsRef.current?.timerSystem.addTime(seconds);
      updateSystemsState();
    }, [updateSystemsState]),

    // Resource actions
    useResource: useCallback((resourceName, amount = 1) => {
      const success = systemsRef.current?.resourceSystem.use(resourceName, amount);
      updateSystemsState();
      return success;
    }, [updateSystemsState]),

    addResource: useCallback((resourceName, amount = 1) => {
      systemsRef.current?.resourceSystem.add(resourceName, amount);
      updateSystemsState();
    }, [updateSystemsState]),

    canUseResource: useCallback((resourceName, amount = 1) => {
      return systemsRef.current?.resourceSystem.canUse(resourceName, amount) || false;
    }, []),

    // State actions
    transitionToPlaying: useCallback(() => {
      systemsRef.current?.stateMachine.transition('playing');
      updateSystemsState();
    }, [updateSystemsState]),

    transitionToPaused: useCallback(() => {
      systemsRef.current?.stateMachine.transition('paused');
      updateSystemsState();
    }, [updateSystemsState]),

    transitionToGameOver: useCallback(() => {
      systemsRef.current?.stateMachine.transition('gameOver');
      updateSystemsState();
    }, [updateSystemsState]),

    transitionToIdle: useCallback(() => {
      systemsRef.current?.stateMachine.transition('idle');
      updateSystemsState();
    }, [updateSystemsState]),

    // Reset all systems
    resetAllSystems: useCallback(() => {
      if (!systemsRef.current) return;

      systemsRef.current.scoreSystem.reset();
      systemsRef.current.timerSystem.reset();
      systemsRef.current.levelSystem.reset();
      systemsRef.current.resourceSystem.reset();
      systemsRef.current.stateMachine.reset();

      updateSystemsState();
    }, [updateSystemsState]),
  };

  // Getters
  const getters = {
    getScore: useCallback(() => systemsRef.current?.scoreSystem.getScore() || 0, []),
    getLevel: useCallback(() => systemsRef.current?.levelSystem.getLevel() || 1, []),
    getTimeLeft: useCallback(() => systemsRef.current?.timerSystem.getTime() || 0, []),
    getResource: useCallback((name) => systemsRef.current?.resourceSystem.get(name) || 0, []),
    getState: useCallback(() => systemsRef.current?.stateMachine.getState() || 'idle', []),
    getSystems: useCallback(() => systemsRef.current, []),
  };

  return {
    // State
    ...systemsState,
    
    // Actions
    ...actions,
    
    // Getters
    ...getters,
    
    // Direct system access (for advanced usage)
    systems: systemsRef.current
  };
};