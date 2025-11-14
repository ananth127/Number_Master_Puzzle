// ============================================================================
// FILE: src/components/GameModals.js
// ============================================================================

import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { COLORS, FONT_SIZES, SPACING, RADIUS,LARGE, DIMENSIONS } from '../utils/constants';
import { getCellColor, formatScore } from '../utils/helpers';

/**
 * Game Over Modal
 */
export const GameOverModal = ({
  visible,
  score,
  level,
  highScore,
  onRestart,
  onClose,
  customStyles = {}
}) => {
  const isNewHighScore = score >= highScore;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[styles.modalOverlay, customStyles.overlay]}>
        <View style={[styles.modalContainer, customStyles.container]}>
          <Text style={[styles.modalTitle, customStyles.title]}>
            Game Over!
          </Text>

          {isNewHighScore && (
            <Text style={[styles.highScoreText, customStyles.highScore]}>
              🏆 New High Score! 🏆
            </Text>
          )}

          <View style={styles.statsContainer}>
            <StatRow label="Final Score" value={formatScore(score)} />
            <StatRow label="Level Reached" value={level} />
            <StatRow label="High Score" value={formatScore(highScore)} />
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, customStyles.button]}
            onPress={onRestart}
          >
            <Text style={[styles.buttonText, customStyles.buttonText]}>
              Play Again
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, customStyles.secondaryButton]}
            onPress={onClose}
          >
            <Text style={[styles.secondaryButtonText, customStyles.secondaryText]}>
              Close
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

/**
 * Level Up Overlay
 */
export const LevelUpOverlay = ({
  visible,
  level,
  customStyles = {}
}) => {
  if (!visible) return null;

  return (
    <View style={[styles.overlayContainer, customStyles.overlay]}>
      <Text style={[styles.levelUpText, customStyles.text]}>
        🎉 LEVEL {level} 🎉
      </Text>
    </View>
  );
};

/**
 * Number Picker Modal
 */
export const NumberPickerModal = ({
  visible,
  onClose,
  onSelectNumber,
  title = "Choose a Number",
  customStyles = {}
}) => {
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[styles.modalOverlay, customStyles.overlay]}>
        <View style={[styles.pickerContainer, customStyles.container]}>
          <Text style={[styles.pickerTitle, customStyles.title]}>
            {title}
          </Text>

          <View style={[styles.numberGrid, customStyles.grid]}>
            {numbers.map(num => (
              <TouchableOpacity
                key={num}
                style={[
                  styles.numberButton,
                  { backgroundColor: getCellColor(num) },
                  customStyles.numberButton
                ]}
                onPress={() => onSelectNumber(num)}
              >
                <Text style={[styles.numberButtonText, customStyles.numberText]}>
                  {num}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.cancelButton, customStyles.cancelButton]}
            onPress={onClose}
          >
            <Text style={[styles.cancelButtonText, customStyles.cancelText]}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

/**
 * Pause Menu Modal
 */
export const PauseMenuModal = ({
  visible,
  onResume,
  onRestart,
  onClose,
  customStyles = {}
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[styles.modalOverlay, customStyles.overlay]}>
        <View style={[styles.modalContainer, customStyles.container]}>
          <Text style={[styles.modalTitle, customStyles.title]}>
            Game Paused
          </Text>

          <TouchableOpacity
            style={[styles.primaryButton, customStyles.button]}
            onPress={onResume}
          >
            <Text style={[styles.buttonText, customStyles.buttonText]}>
              Resume
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, customStyles.secondaryButton]}
            onPress={onRestart}
          >
            <Text style={[styles.secondaryButtonText, customStyles.secondaryText]}>
              Restart Game
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, customStyles.secondaryButton]}
            onPress={onClose}
          >
            <Text style={[styles.secondaryButtonText, customStyles.secondaryText]}>
              Quit to Menu
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

/**
 * Info/Help Modal
 */
export const HelpModal = ({
  visible,
  onClose,
  customStyles = {}
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[styles.modalOverlay, customStyles.overlay]}>
        <View style={[styles.modalContainer, customStyles.container]}>
          <Text style={[styles.modalTitle, customStyles.title]}>
            How to Play
          </Text>

          <View style={styles.helpContent}>
            <HelpItem icon="🎯" text="Match same numbers or numbers that sum to 10" />
            <HelpItem icon="🔗" text="Connect cells using valid paths" />
            <HelpItem icon="⭐" text="Complete rows for bonus points" />
            <HelpItem icon="➕" text="Use Add to get new numbers" />
            <HelpItem icon="💡" text="Use Hint to find valid moves" />
            <HelpItem icon="🔄" text="Use Change to modify any number" />
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, customStyles.button]}
            onPress={onClose}
          >
            <Text style={[styles.buttonText, customStyles.buttonText]}>
              Got It!
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

/**
 * Helper Components
 */
const StatRow = ({ label, value }) => (
  <View style={styles.statRow}>
    <Text style={styles.statLabel}>{label}:</Text>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

const HelpItem = ({ icon, text }) => (
  <View style={styles.helpItem}>
    <Text style={styles.helpIcon}>{icon}</Text>
    <Text style={styles.helpText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: RADIUS.LARGE,
    padding: SPACING.XLARGE,
    width: DIMENSIONS.SCREEN_WIDTH * 0.85,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.BORDER_MEDIUM,
  },
  modalTitle: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: FONT_SIZES.HUGE,
    fontWeight: '900',
    marginBottom: SPACING.LARGE,
    letterSpacing: 1,
  },
  highScoreText: {
    color: COLORS.TEXT_GOLD,
    fontSize: FONT_SIZES.MEDIUM,
    fontWeight: '700',
    marginBottom: SPACING.MEDIUM,
  },
  statsContainer: {
    width: '100%',
    marginVertical: SPACING.LARGE,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.SMALL,
  },
  statLabel: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: FONT_SIZES.MEDIUM,
    fontWeight: '600',
  },
  statValue: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: FONT_SIZES.MEDIUM,
    fontWeight: '900',
  },
  primaryButton: {
    backgroundColor: COLORS.SUCCESS,
    paddingHorizontal: SPACING.XXLARGE,
    paddingVertical: SPACING.MEDIUM,
    borderRadius: RADIUS.MEDIUM,
    marginTop: SPACING.MEDIUM,
    width: '100%',
    elevation: 4,
  },
  buttonText: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: FONT_SIZES.MEDIUM,
    fontWeight: '800',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: SPACING.XLARGE,
    paddingVertical: SPACING.MEDIUM,
    borderRadius: RADIUS.MEDIUM,
    marginTop: SPACING.MEDIUM,
    width: '100%',
  },
  secondaryButtonText: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: FONT_SIZES.MEDIUM,
    fontWeight: '700',
    textAlign: 'center',
  },
  overlayContainer: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    zIndex: 999,
    alignItems: 'center',
  },
  levelUpText: {
    fontSize: FONT_SIZES.HUGE,
    fontWeight: '900',
    color: COLORS.TEXT_GOLD,
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 15,
  },
  pickerContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: RADIUS.LARGE,
    padding: SPACING.XLARGE,
    width: DIMENSIONS.SCREEN_WIDTH * 0.85,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.BORDER_MEDIUM,
  },
  pickerTitle: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: FONT_SIZES.LARGE,
    fontWeight: '900',
    marginBottom: SPACING.LARGE,
    letterSpacing: 1,
  },
  numberGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.MEDIUM,
    marginBottom: SPACING.LARGE,
  },
  numberButton: {
    width: DIMENSIONS.SCREEN_WIDTH * 0.22,
    height: DIMENSIONS.SCREEN_WIDTH * 0.22,
    borderRadius: RADIUS.MEDIUM,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
  },
  numberButtonText: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: FONT_SIZES.XXLARGE,
    fontWeight: '900',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  cancelButton: {
    backgroundColor: COLORS.DANGER,
    paddingHorizontal: SPACING.XXLARGE,
    paddingVertical: SPACING.MEDIUM,
    borderRadius: RADIUS.MEDIUM,
    elevation: 4,
  },
  cancelButtonText: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: FONT_SIZES.MEDIUM,
    fontWeight: '800',
  },
  helpContent: {
    width: '100%',
    marginVertical: SPACING.LARGE,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.SMALL,
  },
  helpIcon: {
    fontSize: FONT_SIZES.XLARGE,
    marginRight: SPACING.MEDIUM,
  },
  helpText: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: FONT_SIZES.SMALL,
    flex: 1,
  },
});