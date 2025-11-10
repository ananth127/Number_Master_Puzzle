import React from 'react';
import { View, Text, StyleSheet, Dimensions, Animated } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Reusable Game Header Component
 * @param {number} level - Current game level
 * @param {number} score - Current total score
 * @param {number} lastPoints - Last points earned (optional, for animation)
 * @param {Animated.Value} scoreAnim - Animation value for score scaling
 * @param {object} customStyles - Custom style overrides
 */
export const GameHeader = ({
  level,
  score,
  lastPoints = 0,
  scoreAnim,
  customStyles = {}
}) => {
  return (
    <View style={[styles.header, customStyles.header]}>
      <View style={[styles.levelBadge, customStyles.levelBadge]}>
        <Text style={[styles.levelText, customStyles.levelText]}>
          LEVELL {level}
        </Text>
      </View>

      <Animated.View
        style={[
          styles.scoreContainer,
          customStyles.scoreContainer,
          scoreAnim && { transform: [{ scale: scoreAnim }] }
        ]}
      >
        <Text style={[styles.scoreLabel, customStyles.scoreLabel]}>
          SCORE
        </Text>
        <Text style={[styles.scoreValue, customStyles.scoreValue]}>
          {score}
        </Text>
        {lastPoints > 0 && (
          <Text style={[styles.pointsAdded, customStyles.pointsAdded]}>
            +{lastPoints}
          </Text>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: 'rgba(20, 20, 20, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  levelBadge: {
    backgroundColor: '#e94560',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    shadowColor: '#e94560',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  levelText: {
    color: '#fff',
    fontSize: SCREEN_WIDTH * 0.04,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  scoreLabel: {
    color: '#94a3b8',
    fontSize: SCREEN_WIDTH * 0.03,
    fontWeight: '600',
    letterSpacing: 1,
  },
  scoreValue: {
    color: '#ffd700',
    fontSize: SCREEN_WIDTH * 0.08,
    fontWeight: '900',
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  pointsAdded: {
    color: '#00ff88',
    fontSize: SCREEN_WIDTH * 0.035,
    fontWeight: '700',
    marginTop: -4,
  },
});