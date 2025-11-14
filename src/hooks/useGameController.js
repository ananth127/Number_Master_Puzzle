// ============================================================================
// FILE: src/hooks/useGameController.js
// ============================================================================

import { useState, useEffect, useRef } from 'react';
import { GameController } from '../controllers/GameController';

/**
 * Custom hook to manage GameController
 * Provides easy access to all game functions and state
 */
export const useGameController = (config = {}) => {
  const controllerRef = useRef(null);
  const [gameState, setGameState] = useState({
    score: 0,
    level: 1,
    timeLeft: config.initialTime || 420,
    grid: [],
    matchedCells: [],
    selectedCell: null,
    hintCells: [],
    isPlaying: false,
    isPaused: false,
    isGameOver: false,
    isChangeMode: false,
    resources: {
      addMoves: 0,
      hints: 3,
      changes: 0
    }
  });

  // Initialize controller
  useEffect(() => {
    controllerRef.current = new GameController(config);
    
    // Subscribe to all game events
    const unsubscribe = controllerRef.current.subscribe((event, data) => {
      handleGameEvent(event, data);
    });

    // Initialize grid
    controllerRef.current.gridSystem.generateGrid();
    updateGameState();

    return () => {
      unsubscribe();
    };
  }, []);

  /**
   * Handle game events and update state
   */
  const handleGameEvent = (event, data) => {
    switch (event) {
      case 'stateChanged':
        updateGameState();
        break;
      case 'scoreChanged':
        updateGameState();
        break;
      case 'timerTick':
        setGameState(prev => ({ ...prev, timeLeft: data }));
        break;
      case 'levelUp':
        updateGameState();
        break;
      case 'matchSuccess':
      case 'cellSelected':
      case 'hintShown':
      case 'changeModeStarted':
      case 'changeModeCancelled':
      case 'cellChanged':
        updateGameState();
        break;
      default:
        break;
    }
  };

  /**
   * Update complete game state from controller
   */
  const updateGameState = () => {
    if (!controllerRef.current) return;

    const controller = controllerRef.current;
    
    setGameState({
      score: controller.getScore(),
      level: controller.getLevel(),
      timeLeft: controller.getTimeLeft(),
      grid: controller.getGrid(),
      matchedCells: controller.getMatchedCells(),
      selectedCell: controller.getSelectedCell(),
      hintCells: controller.getHintCells(),
      isPlaying: controller.isPlaying(),
      isPaused: controller.getState() === 'paused',
      isGameOver: controller.getState() === 'gameOver',
      isChangeMode: controller.isInChangeMode(),
      resources: {
        addMoves: controller.getResource('addMoves'),
        hints: controller.getResource('hints'),
        changes: controller.getResource('changes')
      }
    });
  };

  /**
   * Game actions
   */
  const actions = {
    startGame: () => {
      controllerRef.current?.startGame();
      updateGameState();
    },

    pauseGame: () => {
      controllerRef.current?.pauseGame();
      updateGameState();
    },

    resumeGame: () => {
      controllerRef.current?.resumeGame();
      updateGameState();
    },

    resetGame: () => {
      controllerRef.current?.resetGame();
      updateGameState();
    },

    handleCellPress: (row, col) => {
      controllerRef.current?.handleCellPress(row, col);
      updateGameState();
    },

    useAddMoves: () => {
      const success = controllerRef.current?.useAddMoves();
      updateGameState();
      return success;
    },

    useHint: () => {
      const success = controllerRef.current?.useHint();
      updateGameState();
      return success;
    },

    startChangeMode: () => {
      const success = controllerRef.current?.startChangeMode();
      updateGameState();
      return success;
    },

    changeCellValue: (row, col, newValue) => {
      controllerRef.current?.changeCellValue(row, col, newValue);
      updateGameState();
    },

    cancelChangeMode: () => {
      controllerRef.current?.cancelChangeMode();
      updateGameState();
    }
  };

  return {
    gameState,
    actions,
    controller: controllerRef.current
  };
};