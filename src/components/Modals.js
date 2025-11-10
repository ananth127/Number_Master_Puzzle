import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Dimensions, Animated } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Level Up Overlay Component
 */
export const LevelUpOverlay = ({ visible, level, animValue, customStyles = {} }) => {
  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.levelUpOverlay,
        customStyles.overlay,
        {
          opacity: animValue,
          transform: [{
            scale: animValue.interpolate({
              inputRange: [0, 1],
              outputRange: [0.5, 1],
            })
          }]
        }
      ]}
    >
      <Text style={[styles.levelUpText, customStyles.text]}>
        🎉 LEVEL {level} 🎉
      </Text>
    </Animated.View>
  );
};

/**
 * Number Picker Modal Component
 */
export const NumberPickerModal = ({
  visible,
  onClose,
  onSelectNumber,
  numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9],
  getNumberColor,
  title = "Choose a Number",
  customStyles = {},
}) => {
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
                  { backgroundColor: getNumberColor ? getNumberColor(num) : '#3b82f6' },
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
 * Mode Overlay Component (for special modes like "change mode")
 */
export const ModeOverlay = ({
  visible,
  message,
  icon,
  onCancel,
  position = 'center',
  customStyles = {},
}) => {
  if (!visible) return null;

  const positionStyles = {
    top: { top: '20%' },
    center: { top: '40%' },
    bottom: { top: '60%' },
  };

  return (
    <View style={[
      styles.modeOverlay,
      positionStyles[position],
      customStyles.overlay
    ]}>
      <View style={[styles.modeBox, customStyles.box]}>
        <Text style={[styles.modeText, customStyles.text]}>
          {icon && `${icon} `}{message}
        </Text>
        {onCancel && (
          <TouchableOpacity
            onPress={onCancel}
            style={[styles.modeCancelButton, customStyles.cancelButton]}
          >
            <Text style={[styles.modeCancelText, customStyles.cancelText]}>
              Cancel
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  levelUpOverlay: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    zIndex: 999,
    alignItems: 'center',
  },
  levelUpText: {
    fontSize: SCREEN_WIDTH * 0.12,
    fontWeight: '900',
    color: '#ffd700',
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 24,
    width: SCREEN_WIDTH * 0.85,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  pickerTitle: {
    color: '#fff',
    fontSize: SCREEN_WIDTH * 0.055,
    fontWeight: '900',
    marginBottom: 20,
    letterSpacing: 1,
  },
  numberGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  numberButton: {
    width: SCREEN_WIDTH * 0.22,
    height: SCREEN_WIDTH * 0.22,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  numberButtonText: {
    color: '#fff',
    fontSize: SCREEN_WIDTH * 0.08,
    fontWeight: '900',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  cancelButton: {
    backgroundColor: '#e94560',
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 4,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: SCREEN_WIDTH * 0.04,
    fontWeight: '800',
  },
  modeOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 998,
    alignItems: 'center',
  },
  modeBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 15,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  modeText: {
    color: '#fff',
    fontSize: SCREEN_WIDTH * 0.045,
    fontWeight: '800',
    marginBottom: 12,
  },
  modeCancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 10,
  },
  modeCancelText: {
    color: '#fff',
    fontSize: SCREEN_WIDTH * 0.035,
    fontWeight: '700',
  },
});