// ============================================================================
// FILE: src/components/GameControls.js
// ============================================================================

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, FONT_SIZES, SPACING, RADIUS, LARGE, ICONS } from '../utils/constants';
import { formatTime } from '../utils/helpers';

/**
 * Reusable Game Controls Component
 * Works for any game with play/pause/reset functionality
 */
export const GameControls = ({
  isPlaying = false,
  isPaused = false,
  onPlayPause,
  onReset,
  timeLeft,
  showTimer = true,
  showPlayPause = true,
  showReset = true,
  customStyles = {},
  additionalControls = null,
  timerWarningThreshold = 60,
  timerDangerThreshold = 30,
}) => {
  const isTimerWarning = timeLeft <= timerWarningThreshold && timeLeft > timerDangerThreshold;
  const isTimerDanger = timeLeft <= timerDangerThreshold;

  const timerColor = isTimerDanger
    ? COLORS.DANGER
    : isTimerWarning
    ? COLORS.WARNING
    : COLORS.TEXT_PRIMARY;

  const playPauseIcon = isPlaying ? ICONS.PAUSE : ICONS.PLAY;
  const playPauseLabel = isPlaying ? 'Pause' : isPaused ? 'Resume' : 'Play';

  return (
    <View style={[styles.container, customStyles.container]}>
      {/* Timer Display */}
      {showTimer && (
        <View style={[styles.timerContainer, customStyles.timerContainer]}>
          <Text style={[styles.timerIcon, customStyles.timerIcon]}>
            {ICONS.TIMER}
          </Text>
          <Text
            style={[
              styles.timerText,
              { color: timerColor },
              customStyles.timerText,
            ]}
          >
            {formatTime(timeLeft)}
          </Text>
        </View>
      )}

      {/* Control Buttons */}
      <View style={[styles.buttonsContainer, customStyles.buttonsContainer]}>
        {/* Play/Pause Button */}
        {showPlayPause && (
          <ControlButton
            onPress={onPlayPause}
            icon={playPauseIcon}
            label={playPauseLabel}
            backgroundColor={isPlaying ? COLORS.WARNING : COLORS.SUCCESS}
            customStyles={customStyles.playPauseButton}
          />
        )}

        {/* Reset Button */}
        {showReset && (
          <ControlButton
            onPress={onReset}
            icon={ICONS.RESET}
            label="Reset"
            backgroundColor={COLORS.DANGER}
            customStyles={customStyles.resetButton}
          />
        )}

        {/* Additional Controls (if provided) */}
        {additionalControls}
      </View>
    </View>
  );
};

/**
 * Individual Control Button Component
 */
export const ControlButton = ({
  onPress,
  icon,
  label,
  backgroundColor = COLORS.PRIMARY,
  disabled = false,
  size = 'medium',
  customStyles = {},
}) => {
  const buttonSize = size === 'large' ? styles.buttonLarge : styles.button;
  const textSize = size === 'large' ? styles.buttonTextLarge : styles.buttonText;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        buttonSize,
        {
          backgroundColor: disabled ? COLORS.DISABLED : backgroundColor,
          shadowColor: backgroundColor,
        },
        customStyles.button,
      ]}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={[styles.buttonIcon, customStyles.icon]}>
        {icon}
      </Text>
      <Text style={[textSize, customStyles.text]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

/**
 * Compact Timer Display (for smaller layouts)
 */
export const CompactTimer = ({
  timeLeft,
  warningThreshold = 60,
  dangerThreshold = 30,
  customStyles = {},
}) => {
  const isWarning = timeLeft <= warningThreshold && timeLeft > dangerThreshold;
  const isDanger = timeLeft <= dangerThreshold;

  const timerColor = isDanger
    ? COLORS.DANGER
    : isWarning
    ? COLORS.WARNING
    : COLORS.TEXT_PRIMARY;

  return (
    <View style={[styles.compactTimerContainer, customStyles.container]}>
      <Text style={[styles.compactTimerIcon, customStyles.icon]}>
        {ICONS.TIMER}
      </Text>
      <Text
        style={[
          styles.compactTimerText,
          { color: timerColor },
          customStyles.text,
        ]}
      >
        {formatTime(timeLeft)}
      </Text>
    </View>
  );
};

/**
 * Timer Progress Bar Component
 */
export const TimerProgressBar = ({
  timeLeft,
  totalTime,
  warningThreshold = 60,
  dangerThreshold = 30,
  customStyles = {},
}) => {
  const percentage = (timeLeft / totalTime) * 100;
  const isWarning = timeLeft <= warningThreshold && timeLeft > dangerThreshold;
  const isDanger = timeLeft <= dangerThreshold;

  const barColor = isDanger
    ? COLORS.DANGER
    : isWarning
    ? COLORS.WARNING
    : COLORS.SUCCESS;

  return (
    <View style={[styles.progressBarContainer, customStyles.container]}>
      <View
        style={[
          styles.progressBar,
          {
            width: `${percentage}%`,
            backgroundColor: barColor,
          },
          customStyles.progressBar,
        ]}
      />
      <Text style={[styles.progressBarText, customStyles.text]}>
        {formatTime(timeLeft)}
      </Text>
    </View>
  );
};

/**
 * Control Button Row (for organizing multiple buttons)
 */
export const ControlButtonRow = ({ children, customStyles = {} }) => {
  return (
    <View style={[styles.controlButtonRow, customStyles.row]}>
      {children}
    </View>
  );
};

/**
 * Icon-Only Control Button (minimal design)
 */
export const IconControlButton = ({
  onPress,
  icon,
  size = 50,
  backgroundColor = COLORS.PRIMARY,
  disabled = false,
  customStyles = {},
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.iconOnlyButton,
        {
          width: size,
          height: size,
          backgroundColor: disabled ? COLORS.DISABLED : backgroundColor,
          shadowColor: backgroundColor,
        },
        customStyles.button,
      ]}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.iconOnlyButtonText,
          { fontSize: size * 0.5 },
          customStyles.icon,
        ]}
      >
        {icon}
      </Text>
    </TouchableOpacity>
  );
};

/**
 * Game Status Text Component
 */
export const GameStatusText = ({
  isPlaying,
  isPaused,
  isGameOver,
  customStyles = {},
}) => {
  let statusText = 'Ready to Play';
  let statusColor = COLORS.TEXT_SECONDARY;

  if (isGameOver) {
    statusText = 'Game Over';
    statusColor = COLORS.DANGER;
  } else if (isPaused) {
    statusText = 'Paused';
    statusColor = COLORS.WARNING;
  } else if (isPlaying) {
    statusText = 'Playing';
    statusColor = COLORS.SUCCESS;
  }

  return (
    <View style={[styles.statusContainer, customStyles.container]}>
      <View
        style={[
          styles.statusIndicator,
          { backgroundColor: statusColor },
          customStyles.indicator,
        ]}
      />
      <Text
        style={[
          styles.statusText,
          { color: statusColor },
          customStyles.text,
        ]}
      >
        {statusText}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.MEDIUM,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingVertical: SPACING.MEDIUM,
    paddingHorizontal: SPACING.LARGE,
    borderRadius: RADIUS.LARGE,
    marginBottom: SPACING.MEDIUM,
    borderWidth: 2,
    borderColor: COLORS.BORDER_LIGHT,
  },
  timerIcon: {
    fontSize: FONT_SIZES.LARGE,
    marginRight: SPACING.SMALL,
  },
  timerText: {
    fontSize: FONT_SIZES.XXLARGE,
    fontWeight: '900',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.MEDIUM,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.MEDIUM,
    paddingHorizontal: SPACING.LARGE,
    borderRadius: RADIUS.MEDIUM,
    minWidth: 120,
    elevation: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  buttonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.LARGE,
    paddingHorizontal: SPACING.XLARGE,
    borderRadius: RADIUS.MEDIUM,
    minWidth: 150,
    elevation: 8,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
  },
  buttonIcon: {
    fontSize: FONT_SIZES.LARGE,
    marginRight: SPACING.SMALL,
  },
  buttonText: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: FONT_SIZES.MEDIUM,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  buttonTextLarge: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: FONT_SIZES.LARGE,
    fontWeight: '900',
    letterSpacing: 1,
  },
  compactTimerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: SPACING.MEDIUM,
    paddingVertical: SPACING.SMALL,
    borderRadius: RADIUS.MEDIUM,
  },
  compactTimerIcon: {
    fontSize: FONT_SIZES.MEDIUM,
    marginRight: SPACING.SMALL,
  },
  compactTimerText: {
    fontSize: FONT_SIZES.MEDIUM,
    fontWeight: '700',
  },
  progressBarContainer: {
    height: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: RADIUS.MEDIUM,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
    borderColor: COLORS.BORDER_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: RADIUS.MEDIUM,
  },
  progressBarText: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: FONT_SIZES.MEDIUM,
    fontWeight: '900',
    zIndex: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  controlButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.MEDIUM,
  },
  iconOnlyButton: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: RADIUS.ROUND,
    elevation: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  iconOnlyButtonText: {
    fontWeight: '700',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.SMALL,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: SPACING.SMALL,
  },
  statusText: {
    fontSize: FONT_SIZES.SMALL,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});