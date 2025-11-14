// ============================================================================
// FILE: src/components/ScoreDisplay.js
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { COLORS, FONT_SIZES, SPACING, LARGE } from '../utils/constants';
import { formatScore } from '../utils/helpers';

/**
 * Reusable Score Display Component
 * Can be used in any game
 */
export const ScoreDisplay = ({
  score,
  label = 'SCORE',
  lastPoints = 0,
  showLastPoints = true,
  animated = false,
  animationValue,
  customStyles = {}
}) => {
  const displayScore = formatScore(score);

  const containerStyle = animated && animationValue
    ? [styles.container, customStyles.container, { transform: [{ scale: animationValue }] }]
    : [styles.container, customStyles.container];

  return (
    <Animated.View style={containerStyle}>
      <Text style={[styles.label, customStyles.label]}>
        {label}
      </Text>
      <Text style={[styles.value, customStyles.value]}>
        {displayScore}
      </Text>
      {showLastPoints && lastPoints > 0 && (
        <Text style={[styles.lastPoints, customStyles.lastPoints]}>
          +{lastPoints}
        </Text>
      )}
    </Animated.View>
  );
};

/**
 * Compact Score Display (for smaller spaces)
 */
export const CompactScoreDisplay = ({ score, icon = '⭐', customStyles = {} }) => {
  return (
    <View style={[styles.compactContainer, customStyles.container]}>
      <Text style={[styles.compactIcon, customStyles.icon]}>
        {icon}
      </Text>
      <Text style={[styles.compactValue, customStyles.value]}>
        {formatScore(score)}
      </Text>
    </View>
  );
};

/**
 * Level Badge Component
 */
export const LevelBadge = ({ level, customStyles = {} }) => {
  return (
    <View style={[styles.levelBadge, customStyles.badge]}>
      <Text style={[styles.levelText, customStyles.text]}>
        LEVEL {level}
      </Text>
    </View>
  );
};

/**
 * Multiplier Display Component
 */
export const MultiplierDisplay = ({ multiplier, customStyles = {} }) => {
  if (multiplier <= 1) return null;

  return (
    <View style={[styles.multiplierContainer, customStyles.container]}>
      <Text style={[styles.multiplierText, customStyles.text]}>
        ×{multiplier.toFixed(1)}
      </Text>
    </View>
  );
};

/**
 * Combo Display Component
 */
export const ComboDisplay = ({ combo, customStyles = {} }) => {
  if (combo === 0) return null;

  return (
    <View style={[styles.comboContainer, customStyles.container]}>
      <Text style={[styles.comboText, customStyles.text]}>
        {combo} COMBO! 🔥
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
  },
  label: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: FONT_SIZES.TINY,
    fontWeight: '600',
    letterSpacing: 1,
  },
  value: {
    color: COLORS.TEXT_GOLD,
    fontSize: FONT_SIZES.XXLARGE,
    fontWeight: '900',
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  lastPoints: {
    color: COLORS.SUCCESS,
    fontSize: FONT_SIZES.SMALL,
    fontWeight: '700',
    marginTop: -4,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: SPACING.MEDIUM,
    paddingVertical: SPACING.SMALL,
    borderRadius: 20,
  },
  compactIcon: {
    fontSize: FONT_SIZES.MEDIUM,
    marginRight: SPACING.SMALL,
  },
  compactValue: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: FONT_SIZES.MEDIUM,
    fontWeight: '700',
  },
  levelBadge: {
    backgroundColor: COLORS.DANGER,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    shadowColor: COLORS.DANGER,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  levelText: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: FONT_SIZES.MEDIUM,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  multiplierContainer: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: SPACING.MEDIUM,
    paddingVertical: SPACING.SMALL,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: COLORS.TEXT_GOLD,
  },
  multiplierText: {
    color: COLORS.TEXT_GOLD,
    fontSize: FONT_SIZES.LARGE,
    fontWeight: '900',
  },
  comboContainer: {
    position: 'absolute',
    top: '20%',
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: SPACING.XLARGE,
    paddingVertical: SPACING.MEDIUM,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.WARNING,
  },
  comboText: {
    color: COLORS.WARNING,
    fontSize: FONT_SIZES.LARGE,
    fontWeight: '900',
  },
});