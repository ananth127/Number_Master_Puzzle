// ============================================================================
// FILE: src/systems/GridSystem.js
// ============================================================================

/**
 * Grid System - Manages grid generation and manipulation
 * Specific to Number Puzzle Game but can be adapted
 */
export class GridSystem {
  constructor(config = {}) {
    this.rows = config.rows || 4;
    this.cols = config.cols || 9;
    this.minValue = config.minValue || 1;
    this.maxValue = config.maxValue || 9;
    this.grid = [];
    this.listeners = new Set();
  }

  /**
   * Generate random grid
   */
  generateGrid(rows = this.rows, cols = this.cols) {
    const grid = [];
    
    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) {
        const value = this.generateRandomValue();
        row.push(value);
      }
      grid.push(row);
    }

    this.grid = grid;
    this.notifyListeners('gridGenerated', { grid: this.grid });
    return grid;
  }

  /**
   * Generate smart values (with matching/complement logic)
   */
  generateSmartGrid(rows, cols, existingValues = []) {
    const grid = [];
    const matchProbability = 0.4;
    const complementProbability = 0.3;
    const complementTarget = 10;

    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) {
        const random = Math.random();
        let value;

        if (existingValues.length === 0 || random > matchProbability + complementProbability) {
          value = this.generateRandomValue();
        } else if (random < matchProbability) {
          // Generate matching value
          value = existingValues[Math.floor(Math.random() * existingValues.length)];
        } else {
          // Generate complement value
          const baseValue = existingValues[Math.floor(Math.random() * existingValues.length)];
          value = complementTarget - baseValue;
          if (value < this.minValue || value > this.maxValue) {
            value = this.generateRandomValue();
          }
        }

        row.push(value);
      }
      grid.push(row);
    }

    this.grid = grid;
    this.notifyListeners('smartGridGenerated', { grid: this.grid });
    return grid;
  }

  /**
   * Generate random value in range
   */
  generateRandomValue() {
    return Math.floor(Math.random() * (this.maxValue - this.minValue + 1)) + this.minValue;
  }

  /**
   * Get cell value
   */
  getCellValue(row, col) {
    if (!this.isValidPosition(row, col)) return null;
    return this.grid[row][col];
  }

  /**
   * Set cell value
   */
  setCellValue(row, col, value) {
    if (!this.isValidPosition(row, col)) return false;
    
    const oldValue = this.grid[row][col];
    this.grid[row][col] = value;
    
    this.notifyListeners('cellChanged', {
      row,
      col,
      oldValue,
      newValue: value
    });
    
    return true;
  }

  /**
   * Clear cell (set to null)
   */
  clearCell(row, col) {
    return this.setCellValue(row, col, null);
  }

  /**
   * Add new row to grid
   */
  addRow(values = null) {
    const newRow = values || Array(this.cols).fill(null).map(() => this.generateRandomValue());
    this.grid.push(newRow);
    this.rows++;
    
    this.notifyListeners('rowAdded', { row: this.grid.length - 1, values: newRow });
    return newRow;
  }

  /**
   * Remove row from grid
   */
  removeRow(rowIndex) {
    if (rowIndex < 0 || rowIndex >= this.grid.length) return false;
    
    const removedRow = this.grid.splice(rowIndex, 1)[0];
    this.rows--;
    
    this.notifyListeners('rowRemoved', { row: rowIndex, values: removedRow });
    return true;
  }

  /**
   * Remove multiple rows
   */
  removeRows(rowIndices) {
    const sortedIndices = [...rowIndices].sort((a, b) => b - a);
    
    sortedIndices.forEach(rowIndex => {
      this.removeRow(rowIndex);
    });
    
    this.notifyListeners('multipleRowsRemoved', { indices: rowIndices });
  }

  /**
   * Fill null cells with new values
   */
  fillNullCells() {
    let filled = 0;
    
    for (let r = 0; r < this.grid.length; r++) {
      for (let c = 0; c < this.grid[r].length; c++) {
        if (this.grid[r][c] === null) {
          this.grid[r][c] = this.generateRandomValue();
          filled++;
        }
      }
    }
    
    if (filled > 0) {
      this.notifyListeners('cellsFilled', { count: filled });
    }
    
    return filled;
  }

  /**
   * Check if position is valid
   */
  isValidPosition(row, col) {
    return row >= 0 && row < this.grid.length && 
           col >= 0 && col < (this.grid[row]?.length || 0);
  }

  /**
   * Get all non-null cells
   */
  getActiveCells() {
    const cells = [];
    
    for (let r = 0; r < this.grid.length; r++) {
      for (let c = 0; c < this.grid[r].length; c++) {
        if (this.grid[r][c] !== null) {
          cells.push({ row: r, col: c, value: this.grid[r][c] });
        }
      }
    }
    
    return cells;
  }

  /**
   * Count active cells
   */
  countActiveCells() {
    return this.getActiveCells().length;
  }

  /**
   * Get grid dimensions
   */
  getDimensions() {
    return {
      rows: this.grid.length,
      cols: this.cols
    };
  }

  /**
   * Get current grid
   */
  getGrid() {
    return this.grid;
  }

  /**
   * Set entire grid
   */
  setGrid(grid) {
    this.grid = grid;
    this.rows = grid.length;
    this.notifyListeners('gridSet', { grid: this.grid });
  }

  /**
   * Reset grid
   */
  reset() {
    this.grid = [];
    console.log('Grid has been reset.');
    this.notifyListeners('gridReset', null);
  }

  /**
   * Subscribe to grid events
   */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners(event, data) {
    this.listeners.forEach(listener => listener(event, data));
  }

  /**
   * Serialize for save/load
   */
  serialize() {
    return {
      grid: this.grid,
      rows: this.rows,
      cols: this.cols
    };
  }

  /**
   * Deserialize from saved data
   */
  deserialize(data) {
    this.grid = data.grid || [];
    this.rows = data.rows || this.grid.length;
    this.cols = data.cols || this.cols;
  }
}