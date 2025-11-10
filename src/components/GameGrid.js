import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions, Animated } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Reusable Game Grid Component
 * @param {Array<Array>} grid - 2D array representing the grid
 * @param {function} onCellPress - Cell press handler (row, col)
 * @param {function} getCellStyle - Function to get dynamic cell styles
 * @param {function} getCellColor - Function to get cell color based on value
 * @param {function} renderCellContent - Custom cell content renderer (optional)
 * @param {number} cellSize - Size of each cell
 * @param {number} gridHeight - Height of the grid container
 * @param {object} customStyles - Custom style overrides
 * @param {Animated.Value} cellAnim - Animation value for cell effects (optional)
 */
export const GameGrid = ({
  grid,
  onCellPress,
  getCellStyle,
  getCellColor,
  renderCellContent,
  cellSize = 40,
  gridHeight = SCREEN_HEIGHT * 0.55,
  customStyles = {},
  hintCells = [],
  invalidCell = [],
  invalidCellAnim = null,
  cellAnim = null,
}) => {
  const defaultRenderCell = (value, row, col) => {
    if (value === null) return null;

    const cellColor = getCellColor ? getCellColor(value) : '#3b82f6';

    return (
      <Text style={[
        styles.cellText,
        { color: cellColor, fontSize: cellSize * 0.6 },
        customStyles.cellText
      ]}>
        {value}
      </Text>
    );
  };

  const renderCell = renderCellContent || defaultRenderCell;

  return (
    <View style={[
      styles.gridContainer,
      { height: gridHeight },
      customStyles.gridContainer
    ]}>
      <ScrollView
        style={styles.gridScroll}
        showsVerticalScrollIndicator={false}
      >
        {grid.map((row, rIdx) => (
          <View key={rIdx} style={[styles.row, customStyles.row]}>
            {row.map((value, cIdx) => {
              const dynamicStyle = getCellStyle(rIdx, cIdx);
              const isHint = hintCells.some(cell => cell.row === rIdx && cell.col === cIdx);
              const isInvalid = invalidCell && invalidCell.row === rIdx && invalidCell.col === cIdx;
              const animationStyle = isHint
                ? { transform: [{ scale: cellAnim || 1 }] }
                : isInvalid && invalidCellAnim
                  ? { transform: [{ scale: cellAnim }] }
                  : {};

              return (
                <Animated.View
                  key={`${rIdx}-${cIdx}`}
                  style={[
                    dynamicStyle,
                    animationStyle
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.cell,
                      { width: cellSize, height: cellSize },
                      customStyles.cell
                    ]}
                    onPress={() => onCellPress(rIdx, cIdx)}
                  >
                    {renderCell(value, rIdx, cIdx)}
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  gridContainer: {
    backgroundColor: 'rgba(20, 20, 20, 0.5)',
    borderRadius: 20,
    padding: 8,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  gridScroll: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    gap: 3,
    marginBottom: 3,
    justifyContent: 'center',
  },
  cell: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  cellText: {
    fontWeight: '900',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});