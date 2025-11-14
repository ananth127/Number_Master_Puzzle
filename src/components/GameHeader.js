// ============================================================================
// FILE: src/components/GameHeader.js
// ============================================================================

/**
 * Reusable Game Header Component
 */

import { View, Text, StyleSheet, Animated } from 'react-native';
import { COLORS, FONT_SIZES, SPACING, RADIUS, LARGE, ICONS } from '../utils/constants';
export const GameHeader = ({
  level,
  score,
  lastPoints = 0,
  scoreAnim,
  showLastPoints = true,
  customStyles = {}
}) => {
  return (
    <View style={[headerStyles.header, customStyles.header]}>
      <View style={[headerStyles.levelBadge, customStyles.levelBadge]}>
        <Text style={[headerStyles.levelText, customStyles.levelText]}>
          LEVEL {level}
        </Text>
      </View>

      <Animated.View
        style={[
          headerStyles.scoreContainer,
          customStyles.scoreContainer,
          scoreAnim && { transform: [{ scale: scoreAnim }] }
        ]}
      >
        <Text style={[headerStyles.scoreLabel, customStyles.scoreLabel]}>
          SCORE
        </Text>
        <Text style={[headerStyles.scoreValue, customStyles.scoreValue]}>
          {score.toLocaleString()}
        </Text>
        {showLastPoints && lastPoints > 0 && (
          <Text style={[headerStyles.pointsAdded, customStyles.pointsAdded]}>
            +{lastPoints}
          </Text>
        )}
      </Animated.View>
    </View>
  );
};

/**
 * Compact Header (for small screens)
 */
export const CompactGameHeader = ({
  level,
  score,
  customStyles = {}
}) => {
  return (
    <View style={[headerStyles.compactHeader, customStyles.header]}>
      <View style={headerStyles.compactItem}>
        <Text style={headerStyles.compactLabel}>LVL</Text>
        <Text style={headerStyles.compactValue}>{level}</Text>
      </View>
      
      <View style={headerStyles.compactItem}>
        <Text style={headerStyles.compactLabel}>SCORE</Text>
        <Text style={headerStyles.compactValue}>{score.toLocaleString()}</Text>
      </View>
    </View>
  );
};

const headerStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.LARGE,
    paddingTop: 50,
    paddingBottom: SPACING.LARGE,
    backgroundColor: COLORS.HEADER_BG,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_LIGHT,
  },
  levelBadge: {
    backgroundColor: COLORS.DANGER,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: RADIUS.XLARGE,
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
  scoreContainer: {
    alignItems: 'flex-end',
  },
  scoreLabel: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: FONT_SIZES.TINY,
    fontWeight: '600',
    letterSpacing: 1,
  },
  scoreValue: {
    color: COLORS.TEXT_GOLD,
    fontSize: FONT_SIZES.XXLARGE,
    fontWeight: '900',
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  pointsAdded: {
    color: COLORS.SUCCESS,
    fontSize: FONT_SIZES.SMALL,
    fontWeight: '700',
    marginTop: -4,
  },
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: SPACING.MEDIUM,
    paddingVertical: SPACING.MEDIUM,
    backgroundColor: COLORS.HEADER_BG,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_LIGHT,
  },
  compactItem: {
    alignItems: 'center',
  },
  compactLabel: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: FONT_SIZES.TINY,
    fontWeight: '600',
  },
  compactValue: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: FONT_SIZES.LARGE,
    fontWeight: '900',
  },
});