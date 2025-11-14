
// ============================================================================
// FILE: src/components/GameGrid.js
// ============================================================================


import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated } from 'react-native';
import { COLORS, SPACING, RADIUS, LARGE, DIMENSIONS } from '../utils/constants';

/**
 * Reusable Game Grid Component
 */
export const GameGrid = ({
  grid,
  onCellPress,
  getCellStyle,
  getCellColor,
  renderCellContent,
  cellSize = 30,
  gridHeight = DIMENSIONS.SCREEN_HEIGHT * 0.55,
  customStyles = {},
  hintCells = [],
  invalidCell = null,
  cellAnim = null,
}) => {
  const defaultRenderCell = (value, row, col) => {
    if (value === null) return null;

    const cellColor = getCellColor ? getCellColor(value) : COLORS.SECONDARY;

    return (
      <Text style={[
        gridStyles.cellText,
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
      gridStyles.gridContainer,
      { height: gridHeight },
      customStyles.gridContainer
    ]}>
      <ScrollView
        style={gridStyles.gridScroll}
        showsVerticalScrollIndicator={false}
      >
        {grid.map((row, rIdx) => (
          <View key={rIdx} style={[gridStyles.row, customStyles.row]}>
            {row.map((value, cIdx) => {
              const dynamicStyle = getCellStyle ? getCellStyle(rIdx, cIdx) : {};
              const isHint = hintCells.some(cell => cell.row === rIdx && cell.col === cIdx);
              const isInvalid = invalidCell && invalidCell.row === rIdx && invalidCell.col === cIdx;

              const CellWrapper = (isHint || isInvalid) && cellAnim ? Animated.View : View;
              const animationStyle = (isHint || isInvalid) && cellAnim
                ? { transform: [{ scale: cellAnim }] }
                : {};

              return (
                <CellWrapper
                  key={`${rIdx}-${cIdx}`}
                  style={[dynamicStyle, animationStyle]}
                >
                  <TouchableOpacity
                    style={[
                      gridStyles.cell,
                      { width: cellSize, height: cellSize },
                      customStyles.cell
                    ]}
                    onPress={() => onCellPress(rIdx, cIdx)}
                    activeOpacity={0.7}
                  >
                    {renderCell(value, rIdx, cIdx)}
                  </TouchableOpacity>
                </CellWrapper>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const gridStyles = StyleSheet.create({
  gridContainer: {
    backgroundColor: 'rgba(20, 20, 20, 0.5)',
    borderRadius: RADIUS.LARGE,
    padding: SPACING.SMALL,
    marginBottom: SPACING.MEDIUM,
    borderWidth: 2,
    borderColor: COLORS.BORDER_LIGHT,
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
    borderRadius: RADIUS.SMALL,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.BORDER_LIGHT,
  },
  cellText: {
    fontWeight: '900',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});

