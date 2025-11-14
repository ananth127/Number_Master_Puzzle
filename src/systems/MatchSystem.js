// ============================================================================
// FILE: src/systems/MatchSystem.js
// ============================================================================

/**
 * Match System - Handles cell matching logic
 * Specific to Number Puzzle Game
 */
export class MatchSystem {
  constructor(config = {}) {
    this.matchedCells = new Set();
    this.matchHistory = [];
    this.listeners = new Set();
    
    // Match rules configuration
    this.matchRules = {
      sameValue: config.matchRules?.sameValue !== false,
      sumTarget: config.matchRules?.sumTarget || 10,
      allowSumMatches: config.matchRules?.allowSumMatches !== false,
      customMatchFn: config.matchRules?.customMatchFn || null
    };
  }

  /**
   * Check if two values match according to rules
   */
  valuesMatch(value1, value2) {
    if (value1 === null || value2 === null) return false;
    
    // Custom match function takes precedence
    if (this.matchRules.customMatchFn) {
      return this.matchRules.customMatchFn(value1, value2);
    }

    // Same value match
    if (this.matchRules.sameValue && value1 === value2) {
      return true;
    }

    // Sum match
    if (this.matchRules.allowSumMatches) {
      return value1 + value2 === this.matchRules.sumTarget;
    }

    return false;
  }

  /**
   * Add matched cells
   */
  addMatches(cells) {
    const newMatches = [];

    cells.forEach(cell => {
      const key = this.getCellKey(cell.row, cell.col);
      if (!this.matchedCells.has(key)) {
        this.matchedCells.add(key);
        newMatches.push(cell);
      }
    });

    if (newMatches.length > 0) {
      const matchEntry = {
        cells: newMatches,
        timestamp: Date.now()
      };

      this.matchHistory.push(matchEntry);
      this.notifyListeners('matchesAdded', matchEntry);
    }

    return newMatches.length;
  }

  /**
   * Add single match
   */
  addMatch(row, col) {
    return this.addMatches([{ row, col }]);
  }

  /**
   * Remove match
   */
  removeMatch(row, col) {
    const key = this.getCellKey(row, col);
    const removed = this.matchedCells.delete(key);
    
    if (removed) {
      this.notifyListeners('matchRemoved', { row, col });
    }
    
    return removed;
  }

  /**
   * Check if cell is matched
   */
  isMatched(row, col) {
    const key = this.getCellKey(row, col);
    return this.matchedCells.has(key);
  }

  /**
   * Get matched cells as array
   */
  getMatchedCells() {
    return Array.from(this.matchedCells).map(key => {
      const [row, col] = key.split(',').map(Number);
      return { row, col };
    });
  }

  /**
   * Get matched cells as Set (for performance)
   */
  getMatchedCellsSet() {
    return new Set(this.matchedCells);
  }

  /**
   * Check if row is complete (all cells matched)
   */
  isRowComplete(rowIndex, gridCols) {
    for (let col = 0; col < gridCols; col++) {
      if (!this.isMatched(rowIndex, col)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Get all complete rows
   */
  getCompleteRows(totalRows, gridCols) {
    const completeRows = [];

    for (let row = 0; row < totalRows; row++) {
      if (this.isRowComplete(row, gridCols)) {
        completeRows.push(row);
      }
    }

    return completeRows;
  }

  /**
   * Update matched cells after row removal
   */
  updateAfterRowRemoval(removedRows) {
    const sortedRows = [...removedRows].sort((a, b) => b - a);
    const newMatchedCells = new Set();

    this.matchedCells.forEach(key => {
      const [row, col] = key.split(',').map(Number);

      // Skip cells in removed rows
      if (removedRows.includes(row)) {
        return;
      }

      // Calculate new row index
      const rowsBeforeThis = sortedRows.filter(r => r < row).length;
      const newRow = row - rowsBeforeThis;

      if (newRow >= 0) {
        newMatchedCells.add(this.getCellKey(newRow, col));
      }
    });

    this.matchedCells = newMatchedCells;
    this.notifyListeners('matchesUpdated', { 
      removedRows,
      totalMatches: this.matchedCells.size 
    });
  }

  /**
   * Get cell key for Set storage
   */
  getCellKey(row, col) {
    return `${row},${col}`;
  }

  /**
   * Parse cell key back to coordinates
   */
  parseCellKey(key) {
    const [row, col] = key.split(',').map(Number);
    return { row, col };
  }

  /**
   * Count total matches
   */
  getMatchCount() {
    return this.matchedCells.size;
  }

  /**
   * Get match history
   */
  getMatchHistory(limit = 10) {
    return this.matchHistory.slice(-limit);
  }

  /**
   * Clear all matches
   */
  clearAllMatches() {
    this.matchedCells.clear();
    this.matchHistory = [];
    this.notifyListeners('matchesCleared', null);
  }

  /**
   * Clear match history but keep current matches
   */
  clearHistory() {
    this.matchHistory = [];
  }

  /**
   * Get statistics
   */
  getStatistics() {
    return {
      totalMatches: this.matchedCells.size,
      historyLength: this.matchHistory.length,
      matchRules: this.matchRules
    };
  }

  /**
   * Subscribe to match events
   */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners(event, data) {
    this.listeners.forEach(listener => listener(event, data));
  }

  /**
   * Reset system
   */
  reset() {
    this.clearAllMatches();
    this.notifyListeners('reset', null);
  }

  /**
   * Serialize for save/load
   */
  serialize() {
    return {
      matchedCells: Array.from(this.matchedCells),
      matchHistory: this.matchHistory,
      matchRules: this.matchRules
    };
  }

  /**
   * Deserialize from saved data
   */
  deserialize(data) {
    this.matchedCells = new Set(data.matchedCells || []);
    this.matchHistory = data.matchHistory || [];
    if (data.matchRules) {
      this.matchRules = { ...this.matchRules, ...data.matchRules };
    }
  }
}