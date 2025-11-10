/**
 * Grid Generation Utilities
 */

/**
 * Generate a random grid with specified dimensions
 * @param {number} rows - Number of rows
 * @param {number} cols - Number of columns
 * @param {number} min - Minimum value (default: 1)
 * @param {number} max - Maximum value (default: 9)
 */
export const generateRandomGrid = (rows, cols, min = 1, max = 9) => {
  console.log('Generating grid with rows:', rows, 'cols:', cols);
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () =>
      Math.floor(Math.random() * (max - min + 1)) + min
    )
  );
};

/**
 * Generate smart values based on existing grid
 * @param {number} count - Number of values to generate
 * @param {Array} playableValues - Array of playable values in current grid
 * @param {object} options - Generation options
 */
export const generateSmartValues = (
  count,
  playableValues = [],
  options = {}
) => {
  const {
    min = 1,
    max = 9,
    matchProbability = 0.4,
    complementProbability = 0.3,
    complementTarget = 10,
  } = options;

  const values = [];

  for (let i = 0; i < count; i++) {
    const rand = Math.random();

    if (playableValues.length > 0) {
      if (rand < matchProbability) {
        // Generate matching value
        const randomValue = playableValues[Math.floor(Math.random() * playableValues.length)];
        values.push(randomValue);
      } else if (rand < matchProbability + complementProbability) {
        // Generate complement value
        const randomValue = playableValues[Math.floor(Math.random() * playableValues.length)];
        const complement = complementTarget - randomValue;
        if (complement >= min && complement <= max) {
          values.push(complement);
        } else {
          values.push(Math.floor(Math.random() * (max - min + 1)) + min);
        }
      } else {
        // Generate random value
        values.push(Math.floor(Math.random() * (max - min + 1)) + min);
      }
    } else {
      values.push(Math.floor(Math.random() * (max - min + 1)) + min);
    }
  }

  return values;
};

/**
 * Path Finding Utilities
 */

/**
 * Check if two cells are adjacent (including diagonals)
 */
export const areAdjacent = (r1, c1, r2, c2) => {
  const rowDiff = Math.abs(r1 - r2);
  const colDiff = Math.abs(c1 - c2);
  return rowDiff <= 1 && colDiff <= 1 && (rowDiff !== 0 || colDiff !== 0);
};
export const checkHeadToTailConnection = (r1, c1, r2, c2, currentGrid, matchedCells, GRID_COLS) => {
  let headPos = -1;
  let headRow = -1;
  let headCol = -1;

  for (let i = 0; i < currentGrid.length * GRID_COLS; i++) {
    const row = Math.floor(i / GRID_COLS);
    const col = i % GRID_COLS;
    const cellKey = `${row},${col}`;

    if (currentGrid[row] && currentGrid[row][col] !== null && !matchedCells.has(cellKey)) {
      headPos = i;
      headRow = row;
      headCol = col;
      break;
    }
  }

  let tailPos = -1;
  let tailRow = -1;
  let tailCol = -1;

  for (let i = currentGrid.length * GRID_COLS - 1; i >= 0; i--) {
    const row = Math.floor(i / GRID_COLS);
    const col = i % GRID_COLS;
    const cellKey = `${row},${col}`;

    if (currentGrid[row] && currentGrid[row][col] !== null && !matchedCells.has(cellKey)) {
      tailPos = i;
      tailRow = row;
      tailCol = col;
      break;
    }
  }

  const isCell1Head = (r1 === headRow && c1 === headCol);
  const isCell1Tail = (r1 === tailRow && c1 === tailCol);
  const isCell2Head = (r2 === headRow && c2 === headCol);
  const isCell2Tail = (r2 === tailRow && c2 === tailCol);

  const isHeadToTail = (isCell1Head && isCell2Tail) || (isCell1Tail && isCell2Head);

  if (!isHeadToTail) return false;

  let clockwiseClear = true;
  for (let i = headPos + 1; i < tailPos; i++) {
    const row = Math.floor(i / GRID_COLS);
    const col = i % GRID_COLS;
    const cellKey = `${row},${col}`;

    if (currentGrid[row] && currentGrid[row][col] !== null && !matchedCells.has(cellKey)) {
      clockwiseClear = false;
      break;
    }
  }

  if (clockwiseClear) return true;

  let anticlockwiseClear = true;

  for (let i = tailPos + 1; i < currentGrid.length * GRID_COLS; i++) {
    const row = Math.floor(i / GRID_COLS);
    const col = i % GRID_COLS;
    const cellKey = `${row},${col}`;

    if (currentGrid[row] && currentGrid[row][col] !== null && !matchedCells.has(cellKey)) {
      anticlockwiseClear = false;
      break;
    }
  }

  if (anticlockwiseClear) {
    for (let i = 0; i < headPos; i++) {
      const row = Math.floor(i / GRID_COLS);
      const col = i % GRID_COLS;
      const cellKey = `${row},${col}`;

      if (currentGrid[row] && currentGrid[row][col] !== null && !matchedCells.has(cellKey)) {
        anticlockwiseClear = false;
        break;
      }
    }
  }

  return anticlockwiseClear;
};

export const checkSnakeWrapAround = (r1, c1, r2, c2, currentGrid, matchedCells, GRID_COLS) => {
  if (r1 === r2) return false;

  let rightWrapClear = true;

  for (let col = c1 + 1; col < GRID_COLS; col++) {
    const cellKey = `${r1},${col}`;
    if (!matchedCells.has(cellKey) && currentGrid[r1] && currentGrid[r1][col] !== null) {
      rightWrapClear = false;
      break;
    }
  }

  if (rightWrapClear) {
    const startRow = r1 < r2 ? r1 + 1 : r2 + 1;
    const endRow = r1 < r2 ? r2 : r1;

    for (let row = startRow; row < endRow; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const cellKey = `${row},${col}`;
        if (!matchedCells.has(cellKey) && currentGrid[row] && currentGrid[row][col] !== null) {
          rightWrapClear = false;
          break;
        }
      }
      if (!rightWrapClear) break;
    }

    if (rightWrapClear) {
      for (let col = 0; col < c2; col++) {
        const cellKey = `${r2},${col}`;
        if (!matchedCells.has(cellKey) && currentGrid[r2] && currentGrid[r2][col] !== null) {
          rightWrapClear = false;
          break;
        }
      }
      if (rightWrapClear) return true;
    }
  }

  let leftWrapClear = true;

  for (let col = c1 - 1; col >= 0; col--) {
    const cellKey = `${r1},${col}`;
    if (!matchedCells.has(cellKey) && currentGrid[r1] && currentGrid[r1][col] !== null) {
      leftWrapClear = false;
      break;
    }
  }

  if (leftWrapClear) {
    const startRow = r1 > r2 ? r1 - 1 : r2 - 1;
    const endRow = r1 > r2 ? r2 : r1;

    for (let row = startRow; row > endRow; row--) {
      for (let col = GRID_COLS - 1; col >= 0; col--) {
        const cellKey = `${row},${col}`;
        if (!matchedCells.has(cellKey) && currentGrid[row] && currentGrid[row][col] !== null) {
          leftWrapClear = false;
          break;
        }
      }
      if (!leftWrapClear) break;
    }

    if (leftWrapClear) {
      for (let col = GRID_COLS - 1; col > c2; col--) {
        const cellKey = `${r2},${col}`;
        if (!matchedCells.has(cellKey) && currentGrid[r2] && currentGrid[r2][col] !== null) {
          leftWrapClear = false;
          break;
        }
      }
      if (leftWrapClear) return true;
    }
  }

  return false;
};

/**
 * Check if straight path is clear between two cells
 * 
 * 
 */
export const isStraightPathClear = (r1, c1, r2, c2, grid, blockedCells = new Set()) => {
  if (r1 === r2) {
    // Horizontal path
    const minCol = Math.min(c1, c2);
    const maxCol = Math.max(c1, c2);
    for (let col = minCol + 1; col < maxCol; col++) {
      const cellKey = `${r1},${col}`;
      if (!blockedCells.has(cellKey) && grid[r1] && grid[r1][col] !== null) {
        return false;
      }
    }
    return true;
  } else if (c1 === c2) {
    // Vertical path
    const minRow = Math.min(r1, r2);
    const maxRow = Math.max(r1, r2);
    for (let row = minRow + 1; row < maxRow; row++) {
      const cellKey = `${row},${c1}`;
      if (!blockedCells.has(cellKey) && grid[row] && grid[row][c1] !== null) {
        return false;
      }
    }
    return true;
  }
  return false;
};

/**
 * Check if diagonal path is clear
 */
export const isDiagonalPathClear = (r1, c1, r2, c2, grid, blockedCells = new Set()) => {
  const diffR = r2 - r1;
  const diffC = c2 - c1;

  if (Math.abs(diffR) !== Math.abs(diffC)) return false;

  const dr = diffR > 0 ? 1 : -1;
  const dc = diffC > 0 ? 1 : -1;

  let r = r1 + dr;
  let c = c1 + dc;

  while (r !== r2 && c !== c2) {
    const cellKey = `${r},${c}`;
    if (!blockedCells.has(cellKey) && grid[r] && grid[r][c] !== null) {
      return false;
    }
    r += dr;
    c += dc;
  }

  return true;
};

/**
 * Grid Analysis Utilities
 */

/**
 * Get all playable cells (non-null and not blocked)
 */
export const getPlayableCells = (grid, blockedCells = new Set()) => {
  const playable = [];

  for (let r = 0; r < grid.length; r++) {
    if (!grid[r]) continue;
    for (let c = 0; c < grid[r].length; c++) {
      const cellKey = `${r},${c}`;
      if (grid[r][c] !== null && !blockedCells.has(cellKey)) {
        playable.push({ row: r, col: c, value: grid[r][c] });
      }
    }
  }

  return playable;
};

/**
 * Count playable values in grid
 */
export const countPlayableValues = (grid, blockedCells = new Set()) => {
  return getPlayableCells(grid, blockedCells).length;
};

/**
 * Check if row is complete (all cells matched)
 */
export const isRowComplete = (grid, rowIndex, matchedCells = new Set()) => {
  if (!grid[rowIndex]) return false;

  for (let c = 0; c < grid[rowIndex].length; c++) {
    const cellKey = `${rowIndex},${c}`;
    if (!matchedCells.has(cellKey)) {
      return false;
    }
  }

  return true;
};

/**
 * Get complete rows
 */
export const getCompleteRows = (grid, matchedCells = new Set()) => {
  const completeRows = [];

  for (let r = 0; r < grid.length; r++) {
    if (isRowComplete(grid, r, matchedCells)) {
      completeRows.push(r);
    }
  }

  return completeRows;
};

/**
 * Remove rows from grid and update matched cells
 */
export const removeRows = (grid, rowsToRemove, matchedCells = new Set()) => {
  const sortedRows = [...rowsToRemove].sort((a, b) => b - a);
  const newGrid = [...grid];

  // Remove rows
  for (const row of sortedRows) {
    newGrid.splice(row, 1);
  }

  // Update matched cells coordinates
  const updatedMatched = new Set();

  matchedCells.forEach(cellKey => {
    const [oldRow, col] = cellKey.split(',').map(Number);

    if (rowsToRemove.includes(oldRow)) {
      return; // Skip removed rows
    }

    const rowsRemovedBefore = rowsToRemove.filter(r => r < oldRow).length;
    const newRow = oldRow - rowsRemovedBefore;

    if (newRow >= 0 && newRow < newGrid.length) {
      updatedMatched.add(`${newRow},${col}`);
    }
  });

  return { grid: newGrid, matchedCells: updatedMatched };
};

/**
 * Color Utilities
 */

/**
 * Default color palette for numbers 1-9
 */
export const defaultColorPalette = {
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

/**
 * Get cell color from palette
 */
export const getCellColor = (value, palette = defaultColorPalette, defaultColor = '#3b82f6') => {
  return palette[value] || defaultColor;
};

/**
 * Formatting Utilities
 */

/**
 * Format time in MM:SS format
 */
export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Format score with comma separators
 */
export const formatScore = (score) => {
  return score.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};