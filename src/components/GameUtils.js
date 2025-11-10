/**
 * Grid Generation Utilities with OOP and Design Patterns
 */

// ============================================================================
// STRATEGY PATTERN: Value Generation Strategies
// ============================================================================

/**
 * Abstract strategy interface for value generation
 */
class ValueGenerationStrategy {
  generate(targetCount, contextData) {
    throw new Error('Method generate() must be implemented');
  }
}

/**
 * Random value generation strategy
 */
class RandomValueStrategy extends ValueGenerationStrategy {
  constructor(minimumValue = 1, maximumValue = 9) {
    super();
    this.minimumValue = minimumValue;
    this.maximumValue = maximumValue;
  }

  generate(targetCount, contextData = {}) {
    const generatedValues = [];
    const valueRange = this.maximumValue - this.minimumValue + 1;

    for (let index = 0; index < targetCount; index++) {
      const randomValue = Math.floor(Math.random() * valueRange) + this.minimumValue;
      generatedValues.push(randomValue);
    }

    return generatedValues;
  }
}

/**
 * Smart value generation strategy (matches and complements)
 */
class SmartValueStrategy extends ValueGenerationStrategy {
  constructor(configuration = {}) {
    super();
    this.minimumValue = configuration.minimumValue ?? 1;
    this.maximumValue = configuration.maximumValue ?? 9;
    this.matchingProbability = configuration.matchingProbability ?? 0.4;
    this.complementProbability = configuration.complementProbability ?? 0.3;
    this.complementTargetSum = configuration.complementTargetSum ?? 10;
  }

  generate(targetCount, contextData = {}) {
    const { availablePlayableValues = [] } = contextData;
    const generatedValues = [];
    const randomThreshold = this.matchingProbability + this.complementProbability;

    for (let index = 0; index < targetCount; index++) {
      const randomFactor = Math.random();
      
      if (availablePlayableValues.length === 0) {
        generatedValues.push(this._generateRandomValue());
        continue;
      }

      if (randomFactor < this.matchingProbability) {
        generatedValues.push(this._generateMatchingValue(availablePlayableValues));
      } else if (randomFactor < randomThreshold) {
        generatedValues.push(this._generateComplementValue(availablePlayableValues));
      } else {
        generatedValues.push(this._generateRandomValue());
      }
    }

    return generatedValues;
  }

  _generateRandomValue() {
    const valueRange = this.maximumValue - this.minimumValue + 1;
    return Math.floor(Math.random() * valueRange) + this.minimumValue;
  }

  _generateMatchingValue(availableValues) {
    const randomIndex = Math.floor(Math.random() * availableValues.length);
    return availableValues[randomIndex];
  }

  _generateComplementValue(availableValues) {
    const randomIndex = Math.floor(Math.random() * availableValues.length);
    const baseValue = availableValues[randomIndex];
    const complementValue = this.complementTargetSum - baseValue;

    if (complementValue >= this.minimumValue && complementValue <= this.maximumValue) {
      return complementValue;
    }

    return this._generateRandomValue();
  }
}

// ============================================================================
// FACTORY: Grid Generator
// ============================================================================

/**
 * Grid generator using strategy pattern
 */
class GridGenerator {
  constructor(valueStrategy = null) {
    this.valueStrategy = valueStrategy || new RandomValueStrategy();
  }

  setStrategy(newStrategy) {
    this.valueStrategy = newStrategy;
  }

  generateGrid(rowCount, columnCount, contextData = {}) {
    console.log(`Generating grid: ${rowCount} rows × ${columnCount} columns`);
    
    const gridData = [];
    const totalCells = rowCount * columnCount;
    const cellValues = this.valueStrategy.generate(totalCells, contextData);
    
    let valueIndex = 0;
    for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
      const currentRow = [];
      for (let columnIndex = 0; columnIndex < columnCount; columnIndex++) {
        currentRow.push(cellValues[valueIndex++]);
      }
      gridData.push(currentRow);
    }

    return gridData;
  }

  generateRandomGrid(rowCount, columnCount, minimumValue = 1, maximumValue = 9) {
    this.setStrategy(new RandomValueStrategy(minimumValue, maximumValue));
    return this.generateGrid(rowCount, columnCount);
  }

  generateSmartValues(targetCount, availablePlayableValues = [], configuration = {}) {
    const smartStrategy = new SmartValueStrategy(configuration);
    return smartStrategy.generate(targetCount, { availablePlayableValues });
  }
}

// ============================================================================
// VALUE OBJECTS: Coordinates and Cell Data
// ============================================================================

/**
 * Immutable coordinate value object
 */
class GridCoordinate {
  constructor(rowIndex, columnIndex) {
    this._rowIndex = rowIndex;
    this._columnIndex = columnIndex;
    this._key = `${rowIndex},${columnIndex}`;
  }

  get rowIndex() {
    return this._rowIndex;
  }

  get columnIndex() {
    return this._columnIndex;
  }

  get key() {
    return this._key;
  }

  equals(otherCoordinate) {
    return this._rowIndex === otherCoordinate.rowIndex && 
           this._columnIndex === otherCoordinate.columnIndex;
  }

  static fromKey(coordinateKey) {
    const [rowIndex, columnIndex] = coordinateKey.split(',').map(Number);
    return new GridCoordinate(rowIndex, columnIndex);
  }
}

/**
 * Cell data value object
 */
class GridCell {
  constructor(coordinate, cellValue) {
    this.coordinate = coordinate;
    this.cellValue = cellValue;
  }

  get rowIndex() {
    return this.coordinate.rowIndex;
  }

  get columnIndex() {
    return this.coordinate.columnIndex;
  }

  get key() {
    return this.coordinate.key;
  }
}

// ============================================================================
// STRATEGY PATTERN: Path Validation Strategies
// ============================================================================

/**
 * Abstract path validator
 */
class PathValidator {
  isValid(startCoord, endCoord, gridState, blockedCellKeys) {
    throw new Error('Method isValid() must be implemented');
  }
}

/**
 * Adjacent cells validator
 */
class AdjacentPathValidator extends PathValidator {
  isValid(startCoord, endCoord, gridState, blockedCellKeys) {
    const rowDifference = Math.abs(startCoord.rowIndex - endCoord.rowIndex);
    const columnDifference = Math.abs(startCoord.columnIndex - endCoord.columnIndex);
    
    const isAdjacent = rowDifference <= 1 && columnDifference <= 1;
    const isNotSameCell = rowDifference !== 0 || columnDifference !== 0;
    
    return isAdjacent && isNotSameCell;
  }
}

/**
 * Straight line path validator
 */
class StraightLinePathValidator extends PathValidator {
  isValid(startCoord, endCoord, gridState, blockedCellKeys) {
    const isSameRow = startCoord.rowIndex === endCoord.rowIndex;
    const isSameColumn = startCoord.columnIndex === endCoord.columnIndex;

    if (!isSameRow && !isSameColumn) {
      return false;
    }

    if (isSameRow) {
      return this._isHorizontalPathClear(startCoord, endCoord, gridState, blockedCellKeys);
    } else {
      return this._isVerticalPathClear(startCoord, endCoord, gridState, blockedCellKeys);
    }
  }

  _isHorizontalPathClear(startCoord, endCoord, gridState, blockedCellKeys) {
    const minimumColumn = Math.min(startCoord.columnIndex, endCoord.columnIndex);
    const maximumColumn = Math.max(startCoord.columnIndex, endCoord.columnIndex);
    
    for (let columnIndex = minimumColumn + 1; columnIndex < maximumColumn; columnIndex++) {
      const cellKey = `${startCoord.rowIndex},${columnIndex}`;
      const hasObstacle = !blockedCellKeys.has(cellKey) && 
                         gridState[startCoord.rowIndex]?.[columnIndex] !== null;
      
      if (hasObstacle) {
        return false;
      }
    }
    
    return true;
  }

  _isVerticalPathClear(startCoord, endCoord, gridState, blockedCellKeys) {
    const minimumRow = Math.min(startCoord.rowIndex, endCoord.rowIndex);
    const maximumRow = Math.max(startCoord.rowIndex, endCoord.rowIndex);
    
    for (let rowIndex = minimumRow + 1; rowIndex < maximumRow; rowIndex++) {
      const cellKey = `${rowIndex},${startCoord.columnIndex}`;
      const hasObstacle = !blockedCellKeys.has(cellKey) && 
                         gridState[rowIndex]?.[startCoord.columnIndex] !== null;
      
      if (hasObstacle) {
        return false;
      }
    }
    
    return true;
  }
}

/**
 * Diagonal path validator
 */
class DiagonalPathValidator extends PathValidator {
  isValid(startCoord, endCoord, gridState, blockedCellKeys) {
    const rowDifference = endCoord.rowIndex - startCoord.rowIndex;
    const columnDifference = endCoord.columnIndex - startCoord.columnIndex;

    if (Math.abs(rowDifference) !== Math.abs(columnDifference)) {
      return false;
    }

    const rowDirection = rowDifference > 0 ? 1 : -1;
    const columnDirection = columnDifference > 0 ? 1 : -1;

    let currentRow = startCoord.rowIndex + rowDirection;
    let currentColumn = startCoord.columnIndex + columnDirection;

    while (currentRow !== endCoord.rowIndex && currentColumn !== endCoord.columnIndex) {
      const cellKey = `${currentRow},${currentColumn}`;
      const hasObstacle = !blockedCellKeys.has(cellKey) && 
                         gridState[currentRow]?.[currentColumn] !== null;
      
      if (hasObstacle) {
        return false;
      }
      
      currentRow += rowDirection;
      currentColumn += columnDirection;
    }

    return true;
  }
}

/**
 * Head-to-tail connection validator (wrapping around grid perimeter)
 */
class HeadToTailPathValidator extends PathValidator {
  constructor(gridColumnCount) {
    super();
    this.gridColumnCount = gridColumnCount;
  }

  isValid(startCoord, endCoord, gridState, blockedCellKeys) {
    const headCoordinate = this._findHeadPosition(gridState, blockedCellKeys);
    const tailCoordinate = this._findTailPosition(gridState, blockedCellKeys);

    if (!headCoordinate || !tailCoordinate) {
      return false;
    }

    const isHeadToTailConnection = 
      (startCoord.equals(headCoordinate) && endCoord.equals(tailCoordinate)) ||
      (startCoord.equals(tailCoordinate) && endCoord.equals(headCoordinate));

    if (!isHeadToTailConnection) {
      return false;
    }

    const headPosition = this._coordinateToPosition(headCoordinate);
    const tailPosition = this._coordinateToPosition(tailCoordinate);

    return this._isClockwisePathClear(headPosition, tailPosition, gridState, blockedCellKeys) ||
           this._isCounterClockwisePathClear(headPosition, tailPosition, gridState, blockedCellKeys);
  }

  _findHeadPosition(gridState, blockedCellKeys) {
    const totalCells = gridState.length * this.gridColumnCount;
    
    for (let position = 0; position < totalCells; position++) {
      const coordinate = this._positionToCoordinate(position);
      const cellKey = coordinate.key;
      
      if (gridState[coordinate.rowIndex]?.[coordinate.columnIndex] !== null && 
          !blockedCellKeys.has(cellKey)) {
        return coordinate;
      }
    }
    
    return null;
  }

  _findTailPosition(gridState, blockedCellKeys) {
    const totalCells = gridState.length * this.gridColumnCount;
    
    for (let position = totalCells - 1; position >= 0; position--) {
      const coordinate = this._positionToCoordinate(position);
      const cellKey = coordinate.key;
      
      if (gridState[coordinate.rowIndex]?.[coordinate.columnIndex] !== null && 
          !blockedCellKeys.has(cellKey)) {
        return coordinate;
      }
    }
    
    return null;
  }

  _coordinateToPosition(coordinate) {
    return coordinate.rowIndex * this.gridColumnCount + coordinate.columnIndex;
  }

  _positionToCoordinate(position) {
    const rowIndex = Math.floor(position / this.gridColumnCount);
    const columnIndex = position % this.gridColumnCount;
    return new GridCoordinate(rowIndex, columnIndex);
  }

  _isClockwisePathClear(headPosition, tailPosition, gridState, blockedCellKeys) {
    for (let position = headPosition + 1; position < tailPosition; position++) {
      const coordinate = this._positionToCoordinate(position);
      const cellKey = coordinate.key;
      
      if (gridState[coordinate.rowIndex]?.[coordinate.columnIndex] !== null && 
          !blockedCellKeys.has(cellKey)) {
        return false;
      }
    }
    
    return true;
  }

  _isCounterClockwisePathClear(headPosition, tailPosition, gridState, blockedCellKeys) {
    const totalCells = gridState.length * this.gridColumnCount;
    
    for (let position = tailPosition + 1; position < totalCells; position++) {
      const coordinate = this._positionToCoordinate(position);
      const cellKey = coordinate.key;
      
      if (gridState[coordinate.rowIndex]?.[coordinate.columnIndex] !== null && 
          !blockedCellKeys.has(cellKey)) {
        return false;
      }
    }

    for (let position = 0; position < headPosition; position++) {
      const coordinate = this._positionToCoordinate(position);
      const cellKey = coordinate.key;
      
      if (gridState[coordinate.rowIndex]?.[coordinate.columnIndex] !== null && 
          !blockedCellKeys.has(cellKey)) {
        return false;
      }
    }
    
    return true;
  }
}

/**
 * Snake wrap-around validator (row-to-row wrapping)
 */
class SnakeWrapPathValidator extends PathValidator {
  constructor(gridColumnCount) {
    super();
    this.gridColumnCount = gridColumnCount;
  }

  isValid(startCoord, endCoord, gridState, blockedCellKeys) {
    if (startCoord.rowIndex === endCoord.rowIndex) {
      return false;
    }

    return this._isRightWrapPathClear(startCoord, endCoord, gridState, blockedCellKeys) ||
           this._isLeftWrapPathClear(startCoord, endCoord, gridState, blockedCellKeys);
  }

  _isRightWrapPathClear(startCoord, endCoord, gridState, blockedCellKeys) {
    // Check right side of start row
    for (let columnIndex = startCoord.columnIndex + 1; columnIndex < this.gridColumnCount; columnIndex++) {
      const cellKey = `${startCoord.rowIndex},${columnIndex}`;
      if (!blockedCellKeys.has(cellKey) && gridState[startCoord.rowIndex]?.[columnIndex] !== null) {
        return false;
      }
    }

    // Check intermediate rows
    const minimumRow = Math.min(startCoord.rowIndex, endCoord.rowIndex);
    const maximumRow = Math.max(startCoord.rowIndex, endCoord.rowIndex);
    const intermediateStartRow = minimumRow + 1;

    for (let rowIndex = intermediateStartRow; rowIndex < maximumRow; rowIndex++) {
      for (let columnIndex = 0; columnIndex < this.gridColumnCount; columnIndex++) {
        const cellKey = `${rowIndex},${columnIndex}`;
        if (!blockedCellKeys.has(cellKey) && gridState[rowIndex]?.[columnIndex] !== null) {
          return false;
        }
      }
    }

    // Check left side of end row
    for (let columnIndex = 0; columnIndex < endCoord.columnIndex; columnIndex++) {
      const cellKey = `${endCoord.rowIndex},${columnIndex}`;
      if (!blockedCellKeys.has(cellKey) && gridState[endCoord.rowIndex]?.[columnIndex] !== null) {
        return false;
      }
    }

    return true;
  }

  _isLeftWrapPathClear(startCoord, endCoord, gridState, blockedCellKeys) {
    // Check left side of start row
    for (let columnIndex = startCoord.columnIndex - 1; columnIndex >= 0; columnIndex--) {
      const cellKey = `${startCoord.rowIndex},${columnIndex}`;
      if (!blockedCellKeys.has(cellKey) && gridState[startCoord.rowIndex]?.[columnIndex] !== null) {
        return false;
      }
    }

    // Check intermediate rows
    const minimumRow = Math.min(startCoord.rowIndex, endCoord.rowIndex);
    const maximumRow = Math.max(startCoord.rowIndex, endCoord.rowIndex);
    const intermediateStartRow = maximumRow - 1;

    for (let rowIndex = intermediateStartRow; rowIndex > minimumRow; rowIndex--) {
      for (let columnIndex = this.gridColumnCount - 1; columnIndex >= 0; columnIndex--) {
        const cellKey = `${rowIndex},${columnIndex}`;
        if (!blockedCellKeys.has(cellKey) && gridState[rowIndex]?.[columnIndex] !== null) {
          return false;
        }
      }
    }

    // Check right side of end row
    for (let columnIndex = this.gridColumnCount - 1; columnIndex > endCoord.columnIndex; columnIndex--) {
      const cellKey = `${endCoord.rowIndex},${columnIndex}`;
      if (!blockedCellKeys.has(cellKey) && gridState[endCoord.rowIndex]?.[columnIndex] !== null) {
        return false;
      }
    }

    return true;
  }
}

// ============================================================================
// FACADE: Path Validation Manager
// ============================================================================

/**
 * Manages multiple path validation strategies
 */
class PathValidationManager {
  constructor(gridColumnCount) {
    this.validators = {
      adjacent: new AdjacentPathValidator(),
      straightLine: new StraightLinePathValidator(),
      diagonal: new DiagonalPathValidator(),
      headToTail: new HeadToTailPathValidator(gridColumnCount),
      snakeWrap: new SnakeWrapPathValidator(gridColumnCount),
    };
  }

  validatePath(validationType, startCoord, endCoord, gridState, blockedCellKeys = new Set()) {
    const validator = this.validators[validationType];
    
    if (!validator) {
      throw new Error(`Unknown validation type: ${validationType}`);
    }

    return validator.isValid(startCoord, endCoord, gridState, blockedCellKeys);
  }

  isAdjacentPath(startRow, startCol, endRow, endCol) {
    const startCoord = new GridCoordinate(startRow, startCol);
    const endCoord = new GridCoordinate(endRow, endCol);
    return this.validatePath('adjacent', startCoord, endCoord, [], new Set());
  }
}

// ============================================================================
// SERVICE: Grid Analysis
// ============================================================================

/**
 * Analyzes grid state and provides insights
 */
class GridAnalysisService {
  getPlayableCells(gridState, blockedCellKeys = new Set()) {
    const playableCells = [];

    for (let rowIndex = 0; rowIndex < gridState.length; rowIndex++) {
      if (!gridState[rowIndex]) continue;

      for (let columnIndex = 0; columnIndex < gridState[rowIndex].length; columnIndex++) {
        const cellKey = `${rowIndex},${columnIndex}`;
        const cellValue = gridState[rowIndex][columnIndex];

        if (cellValue !== null && !blockedCellKeys.has(cellKey)) {
          const coordinate = new GridCoordinate(rowIndex, columnIndex);
          playableCells.push(new GridCell(coordinate, cellValue));
        }
      }
    }

    return playableCells;
  }

  countPlayableCells(gridState, blockedCellKeys = new Set()) {
    return this.getPlayableCells(gridState, blockedCellKeys).length;
  }

  isRowComplete(gridState, targetRowIndex, matchedCellKeys = new Set()) {
    const targetRow = gridState[targetRowIndex];
    
    if (!targetRow) {
      return false;
    }

    for (let columnIndex = 0; columnIndex < targetRow.length; columnIndex++) {
      const cellKey = `${targetRowIndex},${columnIndex}`;
      
      if (!matchedCellKeys.has(cellKey)) {
        return false;
      }
    }

    return true;
  }

  getCompleteRowIndices(gridState, matchedCellKeys = new Set()) {
    const completeRowIndices = [];

    for (let rowIndex = 0; rowIndex < gridState.length; rowIndex++) {
      if (this.isRowComplete(gridState, rowIndex, matchedCellKeys)) {
        completeRowIndices.push(rowIndex);
      }
    }

    return completeRowIndices;
  }

  removeCompletedRows(gridState, rowIndicesToRemove, matchedCellKeys = new Set()) {
    const sortedRowIndices = [...rowIndicesToRemove].sort((a, b) => b - a);
    const updatedGrid = [...gridState];

    // Remove rows in descending order
    for (const rowIndex of sortedRowIndices) {
      updatedGrid.splice(rowIndex, 1);
    }

    // Update matched cell coordinates
    const updatedMatchedKeys = new Set();

    matchedCellKeys.forEach(cellKey => {
      const [originalRowIndex, columnIndex] = cellKey.split(',').map(Number);

      // Skip cells from removed rows
      if (rowIndicesToRemove.includes(originalRowIndex)) {
        return;
      }

      // Calculate new row index after removals
      const removedRowsBeforeCurrent = rowIndicesToRemove.filter(
        removedRow => removedRow < originalRowIndex
      ).length;
      
      const adjustedRowIndex = originalRowIndex - removedRowsBeforeCurrent;

      if (adjustedRowIndex >= 0 && adjustedRowIndex < updatedGrid.length) {
        updatedMatchedKeys.add(`${adjustedRowIndex},${columnIndex}`);
      }
    });

    return {
      gridState: updatedGrid,
      matchedCellKeys: updatedMatchedKeys
    };
  }
}

// ============================================================================
// SERVICE: Color Management
// ============================================================================

/**
 * Manages cell color palette
 */
class ColorPaletteService {
  constructor(customPalette = null) {
    this.defaultPalette = {
      1: '#f33838ff',
      2: '#3be9ddff',
      3: '#e7c831ff',
      4: '#56be98ff',
      5: '#d04651ff',
      6: '#ef8f4fff',
      7: '#c9706bff',
      8: '#427fe8ff',
      9: '#fb4fe4ff',
    };
    
    this.activePalette = customPalette || this.defaultPalette;
    this.fallbackColor = '#3b82f6';
  }

  getColorForValue(cellValue) {
    return this.activePalette[cellValue] || this.fallbackColor;
  }

  setCustomPalette(newPalette) {
    this.activePalette = { ...this.defaultPalette, ...newPalette };
  }

  resetToDefaultPalette() {
    this.activePalette = this.defaultPalette;
  }
}

// ============================================================================
// UTILITY: Formatters
// ============================================================================

/**
 * Formatting utilities
 */
class FormatterService {
  formatTimeAsMinutesSeconds(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const paddedSeconds = seconds.toString().padStart(2, '0');
    return `${minutes}:${paddedSeconds}`;
  }

  formatScoreWithCommas(scoreValue) {
    return scoreValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
}

// ============================================================================
// EXPORTS: Backward Compatibility & New API
// ============================================================================

// Singleton instances for convenience
const gridGenerator = new GridGenerator();
const pathValidator = new PathValidationManager(10); // Default column count
const gridAnalyzer = new GridAnalysisService();
const colorManager = new ColorPaletteService();
const formatter = new FormatterService();

// Legacy function exports (backward compatible)
export const generateRandomGrid = (rows, cols, min = 1, max = 9) => {
  return gridGenerator.generateRandomGrid(rows, cols, min, max);
};

export const generateSmartValues = (count, playableValues = [], options = {}) => {
  return gridGenerator.generateSmartValues(count, playableValues, {
    minimumValue: options.min,
    maximumValue: options.max,
    matchingProbability: options.matchProbability,
    complementProbability: options.complementProbability,
    complementTargetSum: options.complementTarget,
  });
};

export const areAdjacent = (r1, c1, r2, c2) => {
  return pathValidator.isAdjacentPath(r1, c1, r2, c2);
};

export const isStraightPathClear = (r1, c1, r2, c2, grid, blockedCells = new Set()) => {
  const startCoord = new GridCoordinate(r1, c1);
  const endCoord = new GridCoordinate(r2, c2);
  return pathValidator.validatePath('straightLine', startCoord, endCoord, grid, blockedCells);
};

export const isDiagonalPathClear = (r1, c1, r2, c2, grid, blockedCells = new Set()) => {
  const startCoord = new GridCoordinate(r1, c1);
  const endCoord = new GridCoordinate(r2, c2);
  return pathValidator.validatePath('diagonal', startCoord, endCoord, grid, blockedCells);
};

export const checkHeadToTailConnection = (r1, c1, r2, c2, currentGrid, matchedCells, GRID_COLS) => {
  const validator = new HeadToTailPathValidator(GRID_COLS);
  const startCoord = new GridCoordinate(r1, c1);
  const endCoord = new GridCoordinate(r2, c2);
  return validator.isValid(startCoord, endCoord, currentGrid, matchedCells);
};

export const checkSnakeWrapAround = (r1, c1, r2, c2, currentGrid, matchedCells, GRID_COLS) => {
  const validator = new SnakeWrapPathValidator(GRID_COLS);
  const startCoord = new GridCoordinate(r1, c1);
  const endCoord = new GridCoordinate(r2, c2);
  return validator.isValid(startCoord, endCoord, currentGrid, matchedCells);
};

export const getPlayableCells = (grid, blockedCells = new Set()) => {
  return gridAnalyzer.getPlayableCells(grid, blockedCells).map(cell => ({
    row: cell.rowIndex,
    col: cell.columnIndex,
    value: cell.cellValue,
  }));
};

export const countPlayableValues = (grid, blockedCells = new Set()) => {
  return gridAnalyzer.countPlayableCells(grid, blockedCells);
};

export const isRowComplete = (grid, rowIndex, matchedCells = new Set()) => {
  return gridAnalyzer.isRowComplete(grid, rowIndex, matchedCells);
};

export const getCompleteRows = (grid, matchedCells = new Set()) => {
  return gridAnalyzer.getCompleteRowIndices(grid, matchedCells);
};

export const removeRows = (grid, rowsToRemove, matchedCells = new Set()) => {
  const result = gridAnalyzer.removeCompletedRows(grid, rowsToRemove, matchedCells);
  return {
    grid: result.gridState,
    matchedCells: result.matchedCellKeys,
  };
};

export const getCellColor = (value, palette = null) => {
  if (palette) {
    const customColorManager = new ColorPaletteService(palette);
    return customColorManager.getColorForValue(value);
  }
  return colorManager.getColorForValue(value);
};

export const defaultColorPalette = colorManager.defaultPalette;

export const formatTime = (seconds) => {
  return formatter.formatTimeAsMinutesSeconds(seconds);
};

export const formatScore = (score) => {
  return formatter.formatScoreWithCommas(score);
};

// New OOP API exports
export {
  GridGenerator,
  GridCoordinate,
  GridCell,
  PathValidationManager,
  GridAnalysisService,
  ColorPaletteService,
  FormatterService,
  RandomValueStrategy,
  SmartValueStrategy,
  AdjacentPathValidator,
  StraightLinePathValidator,
  DiagonalPathValidator,
  HeadToTailPathValidator,
  SnakeWrapPathValidator,
};