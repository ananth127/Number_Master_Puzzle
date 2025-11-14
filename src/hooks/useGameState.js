// ============================================================================
// FILE: src/hooks/useGameState.js
// ============================================================================

import { useState, useCallback } from 'react';

/**
 * Custom hook for managing game state
 * Provides controlled state management with callbacks
 */
export const useGameState = (initialState = {}) => {
  const [state, setState] = useState({
    score: initialState.score || 0,
    level: initialState.level || 1,
    timeLeft: initialState.timeLeft || 420,
    isPlaying: initialState.isPlaying || false,
    isPaused: initialState.isPaused || false,
    isGameOver: initialState.isGameOver || false,
    lastPoints: initialState.lastPoints || 0,
    combo: initialState.combo || 0,
    multiplier: initialState.multiplier || 1,
    ...initialState
  });

  // Score management
  const setScore = useCallback((score) => {
    setState(prev => ({ ...prev, score }));
  }, []);

  const addScore = useCallback((points) => {
    setState(prev => ({
      ...prev,
      score: prev.score + points,
      lastPoints: points
    }));
  }, []);

  const setLastPoints = useCallback((points) => {
    setState(prev => ({ ...prev, lastPoints: points }));
  }, []);

  // Level management
  const setLevel = useCallback((level) => {
    setState(prev => ({ ...prev, level }));
  }, []);

  const incrementLevel = useCallback(() => {
    setState(prev => ({ ...prev, level: prev.level + 1 }));
  }, []);

  // Timer management
  const setTimeLeft = useCallback((time) => {
    setState(prev => ({ ...prev, timeLeft: time }));
  }, []);

  const decrementTime = useCallback(() => {
    setState(prev => ({ ...prev, timeLeft: Math.max(0, prev.timeLeft - 1) }));
  }, []);

  // Game state management
  const setIsPlaying = useCallback((playing) => {
    setState(prev => ({ ...prev, isPlaying: playing, isPaused: false }));
  }, []);

  const setIsPaused = useCallback((paused) => {
    setState(prev => ({ ...prev, isPaused: paused, isPlaying: !paused }));
  }, []);

  const setIsGameOver = useCallback((gameOver) => {
    setState(prev => ({ ...prev, isGameOver: gameOver, isPlaying: false }));
  }, []);

  // Combo management
  const setCombo = useCallback((combo) => {
    setState(prev => ({ ...prev, combo }));
  }, []);

  const incrementCombo = useCallback(() => {
    setState(prev => ({ ...prev, combo: prev.combo + 1 }));
  }, []);

  const resetCombo = useCallback(() => {
    setState(prev => ({ ...prev, combo: 0 }));
  }, []);

  // Multiplier management
  const setMultiplier = useCallback((multiplier) => {
    setState(prev => ({ ...prev, multiplier }));
  }, []);

  // Batch updates
  const updateState = useCallback((updates) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Reset all state
  const resetState = useCallback(() => {
    setState({
      score: 0,
      level: 1,
      timeLeft: 420,
      isPlaying: false,
      isPaused: false,
      isGameOver: false,
      lastPoints: 0,
      combo: 0,
      multiplier: 1,
      ...initialState
    });
  }, [initialState]);

  return {
    // State values
    ...state,
    
    // Setters
    setScore,
    addScore,
    setLastPoints,
    setLevel,
    incrementLevel,
    setTimeLeft,
    decrementTime,
    setIsPlaying,
    setIsPaused,
    setIsGameOver,
    setCombo,
    incrementCombo,
    resetCombo,
    setMultiplier,
    updateState,
    resetState,
  };
};