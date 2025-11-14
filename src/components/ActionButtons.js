// ============================================================================
// FILE: src/components/ActionButtons.js
// ============================================================================

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { COLORS, FONT_SIZES, SPACING, RADIUS, DIMENSIONS } from '../utils/constants';

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
  backgroundColor = COLORS.PRIMARY,
  disabledColor = COLORS.DISABLED,
  highlight = false,
  highlightColor = COLORS.DANGER,
  animValue,
  customStyles = {},
}) => {
  const buttonColor = disabled ? disabledColor : (highlight ? highlightColor : backgroundColor);
  const remaining = maxCount !== undefined && count !== undefined ? maxCount - count : null;

  const ButtonContent = (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.actionButton,
        { backgroundColor: buttonColor, shadowColor: buttonColor },
        customStyles.button
      ]}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={[styles.actionButtonText, customStyles.text]}>
        {icon && `${icon} `}
        {label}
        {remaining !== null && ` (${remaining})`}
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

/**
 * Icon Button Component (for small actions)
 */
export const IconButton = ({
  onPress,
  icon,
  size = 44,
  color = COLORS.TEXT_PRIMARY,
  backgroundColor = 'rgba(255, 255, 255, 0.1)',
  disabled = false,
  customStyles = {}
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.iconButton,
        { width: size, height: size, backgroundColor },
        disabled && styles.iconButtonDisabled,
        customStyles.button
      ]}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={[styles.iconButtonText, { fontSize: size * 0.5, color }, customStyles.text]}>
        {icon}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.MEDIUM,
    marginVertical: SPACING.MEDIUM,
    paddingHorizontal: SPACING.SMALL,
  },
  actionButtonWrapper: {
    flex: 1,
  },
  actionButton: {
    paddingVertical: DIMENSIONS.SCREEN_HEIGHT * 0.015,
    borderRadius: RADIUS.MEDIUM,
    alignItems: 'center',
    elevation: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  actionButtonText: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: FONT_SIZES.MEDIUM,
    fontWeight: '900',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  iconButton: {
    borderRadius: RADIUS.ROUND,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  iconButtonText: {
    fontWeight: '700',
  },
  iconButtonDisabled: {
    opacity: 0.5,
  },
});
