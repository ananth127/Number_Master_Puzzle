import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Reusable Game Controls Component
 * @param {boolean} isPlaying - Game play state
 * @param {function} onPlayPause - Play/Pause button handler
 * @param {function} onReset - Reset button handler
 * @param {number} timeLeft - Time remaining in seconds
 * @param {object} customStyles - Custom style overrides
 * @param {boolean} showTimer - Whether to show timer (default: true)
 */
export const GameControls = ({
  isPlaying,
  onPlayPause,
  onReset,
  timeLeft,
  customStyles = {},
  showTimer = true,
}) => {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={[styles.controls, customStyles.controls]}>
      <TouchableOpacity
        onPress={onPlayPause}
        style={[styles.button, styles.buttonPlay, customStyles.playButton]}
      >
        <Text style={[styles.buttonText, customStyles.buttonText]}>
          {isPlaying ? '⏸' : '▶'}
        </Text>
      </TouchableOpacity>

      {showTimer && (
        <View style={[styles.timerContainer, customStyles.timerContainer]}>
          <Text style={[styles.timerText, customStyles.timerText]}>
            {formatTime(timeLeft)}
          </Text>
        </View>
      )}

      <TouchableOpacity
        onPress={onReset}
        style={[styles.button, styles.buttonReset, customStyles.resetButton]}
      >
        <Text style={[styles.buttonText, customStyles.buttonText]}>
          ↻
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 16,
  },
  button: {
    width: SCREEN_WIDTH * 0.14,
    height: SCREEN_WIDTH * 0.14,
    borderRadius: SCREEN_WIDTH * 0.07,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  buttonPlay: {
    backgroundColor: '#00ff88',
    shadowColor: '#00ff88',
  },
  buttonReset: {
    backgroundColor: '#e94560',
    shadowColor: '#e94560',
  },
  buttonText: {
    color: '#fff',
    fontSize: SCREEN_WIDTH * 0.07,
    fontWeight: '700',
  },
  timerContainer: {
    backgroundColor: 'rgba(20, 20, 20, 0.8)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  timerText: {
    color: '#fff',
    fontSize: SCREEN_WIDTH * 0.065,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
});