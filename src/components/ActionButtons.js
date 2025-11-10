import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Single Action Button Component
 */
export const ActionButton = ({
  onPress,
  label,
  icon,
  count,
  maxCount,
  disabled = false,
  backgroundColor = '#9d4edd',
  disabledColor = '#475569',
  highlight = false,
  highlightColor = '#e94560',
  animValue,
  customStyles = {},
}) => {
  const buttonColor = disabled ? disabledColor : (highlight ? highlightColor : backgroundColor);

  const ButtonContent = (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.actionButton,
        { backgroundColor: buttonColor, shadowColor: buttonColor },
        customStyles.button
      ]}
      disabled={disabled}
    >
      <Text style={[styles.actionButtonText, customStyles.text]}>
        {icon && `${icon} `}
        {label}
        {count !== undefined && maxCount !== undefined && ` (${maxCount - count})`}
      </Text>
    </TouchableOpacity>
  );

  if (animValue) {
    return (
      <Animated.View style={[
        styles.actionButtonWrapper,
        { transform: [{ scale: animValue }] },
        customStyles.wrapper
      ]}>
        {ButtonContent}
      </Animated.View>
    );
  }

  return (
    <View style={[styles.actionButtonWrapper, customStyles.wrapper]}>
      {ButtonContent}
    </View>
  );
};

/**
 * Action Buttons Row Component
 */
export const ActionButtonsRow = ({ children, customStyles = {} }) => {
  return (
    <View style={[styles.buttonRow, customStyles.buttonRow]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginVertical: 12,
    paddingHorizontal: 5,
  },
  actionButtonWrapper: {
    flex: 1,
  },
  actionButton: {
    paddingVertical: SCREEN_HEIGHT * 0.015,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: SCREEN_WIDTH * 0.04,
    fontWeight: '900',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});