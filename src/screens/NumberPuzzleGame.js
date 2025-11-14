// ============================================================================
// FILE: src/screens/NumberPuzzleGame.js
// ============================================================================

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Animated, Text } from 'react-native';

// Import custom hook
import { useGameController } from '../hooks/useGameController';

// Import components
import { GameHeader } from '../components/GameHeader';
import { GameControls } from '../components/GameControls';
import { GameGrid } from '../components/GameGrid';
import { ActionButton, ActionButtonsRow } from '../components/ActionButtons';
import { GameOverModal, LevelUpOverlay, NumberPickerModal } from '../components/GameModals';

// Import constants and helpers
import { GAME_CONFIG, COLORS, ICONS } from '../utils/constants';
import { getCellColor, getCellKey } from '../utils/helpers';

/**
 * Main Number Puzzle Game Screen
 * Uses the modular GameController system
 */
export default function NumberPuzzleGame() {
  // Initialize game controller with config
  const { gameState, actions, controller } = useGameController({
    initialTime: GAME_CONFIG.INITIAL_TIME,
    initialRows: GAME_CONFIG.INITIAL_ROWS,
    gridCols: GAME_CONFIG.GRID_COLS,
  });

  // Local UI state
  const [showGameOver, setShowGameOver] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showNumberPicker, setShowNumberPicker] = useState(false);
  const [selectedCellForChange, setSelectedCellForChange] = useState(null);
  const [invalidCell, setInvalidCell] = useState(null);

  // Animations
  const [scoreAnim] = useState(new Animated.Value(1));
  const [levelAnim] = useState(new Animated.Value(0));
  const [hintAnim] = useState(new Animated.Value(1));
  const [shakeAnim] = useState(new Animated.Value(0));

  // Subscribe to game events
  useEffect(() => {
    if (!controller) return;

    const unsubscribe = controller.subscribe((event, data) => {
      handleGameEvent(event, data);
    });

    return () => unsubscribe();
  }, [controller]);

  /**
   * Handle game events
   */
  const handleGameEvent = (event, data) => {
    switch (event) {
      case 'gameOver':
        setShowGameOver(true);
        break;

      case 'levelUp':
        setShowLevelUp(true);
        animateLevelUp();
        setTimeout(() => setShowLevelUp(false), 2000);
        break;

      case 'matchSuccess':
        animateScore();
        break;

      case 'matchFailed':
        if (data.reason === 'noValidPath') {
          setInvalidCell(data);
          animateShake();
          setTimeout(() => setInvalidCell(null), 300);
        }
        break;

      case 'hintShown':
        animateHintPulse();
        break;

      case 'changeModeSelect':
        setSelectedCellForChange(data);
        setShowNumberPicker(true);
        break;

      case 'actionFailed':
        handleActionFailed(data);
        break;

      default:
        break;
    }
  };

  /**
   * Handle action failures
   */
  const handleActionFailed = (data) => {
    const { action, reason } = data;

    if (reason === 'noResources') {
      Alert.alert('Limit Reached', `You've used all your ${action} actions!`);
    } else if (reason === 'noMovesAvailable') {
      Alert.alert('No Moves', 'No valid moves available! Use Add or Change actions.');
    }
  };

  /**
   * Animations
   */
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

  const animateLevelUp = () => {
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
    ]).start();
  };

  const animateHintPulse = () => {
    Animated.loop(
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
      ]),
      { iterations: 3 }
    ).start();
  };

  const animateShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  /**
   * Handle play/pause toggle
   */
  const handlePlayPause = () => {
    if (gameState.isPlaying) {
      actions.pauseGame();
    } else {
      actions.startGame();
    }
  };

  /**
   * Handle reset with confirmation
   */
  const handleReset = () => {
    Alert.alert(
      'Reset Game',
      'Are you sure you want to restart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            actions.resetGame();
            setShowGameOver(false);
          }
        }
      ]
    );
  };

  /**
   * Handle number change confirmation
   */
  const handleNumberChange = (newNumber) => {
    if (selectedCellForChange) {
      const { row, col } = selectedCellForChange;
      actions.changeCellValue(row, col, newNumber);
    }
    setShowNumberPicker(false);
    setSelectedCellForChange(null);
  };

  /**
   * Get cell style based on state
   */
  const getCellStyle = (row, col) => {
    const cellKey = getCellKey(row, col);
    const isMatched = gameState.matchedCells.some(
      cell => cell.row === row && cell.col === col
    );
    const isSelected = gameState.selectedCell?.row === row && 
                       gameState.selectedCell?.col === col;
    const isHint = gameState.hintCells.some(
      cell => cell.row === row && cell.col === col
    );
    const isInvalid = invalidCell?.row2 === row && invalidCell?.col2 === col;
    const isSelectedForChange = selectedCellForChange?.row === row && 
                                selectedCellForChange?.col === col;

    if (isMatched) {
      return { opacity: 0.2 };
    }

    if (isSelected) {
      return {
        opacity: 1,
        backgroundColor: COLORS.SELECTED,
        shadowColor: COLORS.TEXT_GOLD,
        shadowOpacity: 0.8,
      };
    }

    if (isHint) {
      return {
        opacity: 1,
        backgroundColor: COLORS.HINT,
        shadowColor: COLORS.SUCCESS,
        shadowOpacity: 0.6,
        transform: [{ scale: hintAnim }],
      };
    }

    if (isInvalid) {
      return {
        opacity: 1,
        backgroundColor: COLORS.INVALID,
        shadowColor: '#ff0000',
        shadowOpacity: 0.8,
      };
    }

    if (isSelectedForChange) {
      return {
        opacity: 1,
        backgroundColor: 'rgba(157, 78, 221, 0.4)',
        shadowColor: COLORS.PRIMARY,
        shadowOpacity: 0.8,
      };
    }

    return { opacity: 1 };
  };

  /**
   * Check if resource can be used (has remaining uses)
   */
  const canUseResource = (resourceName) => {
    // Resource system stores CURRENT available count
    // We can use if current > 0
    return gameState.resources[resourceName] > 0;
  };

  return (
    <Animated.View 
      style={[
        styles.container,
        { transform: [{ translateX: shakeAnim }] }
      ]}
    >
      {/* Header */}
      <GameHeader
        level={gameState.level}
        score={gameState.score}
        scoreAnim={scoreAnim}
      />

      {/* Level Up Overlay */}
      <LevelUpOverlay
        visible={showLevelUp}
        level={gameState.level}
      />

      {/* Game Over Modal */}
      <GameOverModal
        visible={showGameOver}
        score={gameState.score}
        level={gameState.level}
        highScore={gameState.score}
        onRestart={() => {
          setShowGameOver(false);
          actions.resetGame();
        }}
        onClose={() => setShowGameOver(false)}
      />

      {/* Number Picker Modal */}
      <NumberPickerModal
        visible={showNumberPicker}
        onClose={() => {
          setShowNumberPicker(false);
          setSelectedCellForChange(null);
          actions.cancelChangeMode();
        }}
        onSelectNumber={handleNumberChange}
      />

      {/* Main Content */}
      <View style={styles.content}>
        {/* Game Controls */}
        <GameControls
          isPlaying={gameState.isPlaying}
          isPaused={gameState.isPaused}
          onPlayPause={handlePlayPause}
          onReset={handleReset}
          timeLeft={gameState.timeLeft}
        />

        {/* Game Grid */}
        <GameGrid
          grid={gameState.grid}
          onCellPress={actions.handleCellPress}
          getCellStyle={getCellStyle}
          getCellColor={getCellColor}
          cellSize={35}
          hintCells={gameState.hintCells}
          invalidCell={invalidCell}
          cellAnim={hintAnim}
        />

        {/* Action Buttons */}
        <ActionButtonsRow>
          <ActionButton
            onPress={actions.useAddMoves}
            label="Add"
            icon={ICONS.ADD}
            count={GAME_CONFIG.MAX_ACTIONS - (gameState.resources.addMoves || 0)}
            maxCount={GAME_CONFIG.MAX_ACTIONS}
            disabled={!gameState.isPlaying || !canUseResource('addMoves')}
            backgroundColor={COLORS.PRIMARY}
          />

          <ActionButton
            onPress={actions.useHint}
            label="Hint"
            icon={ICONS.HINT}
            count={GAME_CONFIG.MAX_ACTIONS - (gameState.resources.hints || 0)}
            maxCount={GAME_CONFIG.MAX_ACTIONS}
            disabled={!gameState.isPlaying || !canUseResource('hints')}
            backgroundColor={COLORS.SUCCESS}
          />

          <ActionButton
            onPress={actions.startChangeMode}
            label="Change"
            icon={ICONS.CHANGE}
            count={GAME_CONFIG.MAX_ACTIONS - (gameState.resources.changes || 0)}
            maxCount={GAME_CONFIG.MAX_ACTIONS}
            disabled={!gameState.isPlaying || !canUseResource('changes')}
            backgroundColor={COLORS.WARNING}
          />
        </ActionButtonsRow>

        {/* Change Mode Indicator */}
        {gameState.isChangeMode && (
          <View style={styles.changeModeIndicator}>
            <Text style={styles.changeModeText}>
              {ICONS.CHANGE} Tap any cell to change its value
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  changeModeIndicator: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
  },
  changeModeText: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    color: COLORS.TEXT_PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    fontSize: 16,
    fontWeight: '700',
    borderWidth: 2,
    borderColor: COLORS.WARNING,
  },
});