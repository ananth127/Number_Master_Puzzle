// ============================================================================
// FILE: src/systems/ConnectionValidator.js
// ============================================================================

/**
 * Connection Validator - Validates paths between cells
 * Uses Strategy Pattern for different connection types
 */

// ============================================================================
// STRATEGY PATTERN: Connection Type Strategies
// ============================================================================

class ConnectionStrategy {
  constructor(name, points) {
    this.name = name;
    this.points = points;
  }

  isValid(r1, c1, r2, c2, grid, blockedCells) {
    throw new Error('Must be implemented by subclass');
  }
}

class AdjacentStrategy extends ConnectionStrategy {
  constructor() {
    super('adjacent', 1);
  }

  isValid(r1, c1, r2, c2) {
    const rowDiff = Math.abs(r1 - r2);
    const colDiff = Math.abs(c1 - c2);
    return rowDiff <= 1 && colDiff <= 1 && (rowDiff !== 0 || colDiff !== 0);
  }
}

class StraightLineStrategy extends ConnectionStrategy {
  constructor() {
    super('straightLine', 4);
  }

  isValid(r1, c1, r2, c2, grid, blockedCells) {
    const isSameRow = r1 === r2;
    const isSameCol = c1 === c2;

    if (!isSameRow && !isSameCol) return false;

    if (isSameRow) {
      return this.isHorizontalClear(r1, c1, c2, grid, blockedCells);
    } else {
      return this.isVerticalClear(c1, r1, r2, grid, blockedCells);
    }
  }

  isHorizontalClear(row, col1, col2, grid, blockedCells) {
    const minCol = Math.min(col1, col2);
    const maxCol = Math.max(col1, col2);

    for (let col = minCol + 1; col < maxCol; col++) {
      const key = `${row},${col}`;
      if (!blockedCells.has(key) && grid[row]?.[col] !== null) {
        return false;
      }
    }
    return true;
  }

  isVerticalClear(col, row1, row2, grid, blockedCells) {
    const minRow = Math.min(row1, row2);
    const maxRow = Math.max(row1, row2);

    for (let row = minRow + 1; row < maxRow; row++) {
      const key = `${row},${col}`;
      if (!blockedCells.has(key) && grid[row]?.[col] !== null) {
        return false;
      }
    }
    return true;
  }
}

class DiagonalStrategy extends ConnectionStrategy {
  constructor() {
    super('diagonal', 4);
  }

  isValid(r1, c1, r2, c2, grid, blockedCells) {
    const rowDiff = r2 - r1;
    const colDiff = c2 - c1;

    if (Math.abs(rowDiff) !== Math.abs(colDiff)) return false;

    const rowDir = rowDiff > 0 ? 1 : -1;
    const colDir = colDiff > 0 ? 1 : -1;

    let row = r1 + rowDir;
    let col = c1 + colDir;

    while (row !== r2 && col !== c2) {
      const key = `${row},${col}`;
      if (!blockedCells.has(key) && grid[row]?.[col] !== null) {
        return false;
      }
      row += rowDir;
      col += colDir;
    }

    return true;
  }
}

class HeadToTailStrategy extends ConnectionStrategy {
  constructor(gridCols) {
    super('headToTail', 4);
    this.gridCols = gridCols;
  }

  isValid(r1, c1, r2, c2, grid, blockedCells) {
    const head = this.findHead(grid, blockedCells);
    const tail = this.findTail(grid, blockedCells);

    if (!head || !tail) return false;

    const isConnection = 
      (r1 === head.row && c1 === head.col && r2 === tail.row && c2 === tail.col) ||
      (r1 === tail.row && c1 === tail.col && r2 === head.row && c2 === head.col);

    if (!isConnection) return false;

    const headPos = this.coordToPos(head.row, head.col);
    const tailPos = this.coordToPos(tail.row, tail.col);

    return this.isClockwiseClear(headPos, tailPos, grid, blockedCells) ||
           this.isCounterClockwiseClear(headPos, tailPos, grid, blockedCells);
  }

  findHead(grid, blockedCells) {
    const totalCells = grid.length * this.gridCols;
    for (let pos = 0; pos < totalCells; pos++) {
      const { row, col } = this.posToCoord(pos);
      const key = `${row},${col}`;
      if (grid[row]?.[col] !== null && !blockedCells.has(key)) {
        return { row, col };
      }
    }
    return null;
  }

  findTail(grid, blockedCells) {
    const totalCells = grid.length * this.gridCols;
    for (let pos = totalCells - 1; pos >= 0; pos--) {
      const { row, col } = this.posToCoord(pos);
      const key = `${row},${col}`;
      if (grid[row]?.[col] !== null && !blockedCells.has(key)) {
        return { row, col };
      }
    }
    return null;
  }

  coordToPos(row, col) {
    return row * this.gridCols + col;
  }

  posToCoord(pos) {
    return {
      row: Math.floor(pos / this.gridCols),
      col: pos % this.gridCols
    };
  }

  isClockwiseClear(headPos, tailPos, grid, blockedCells) {
    for (let pos = headPos + 1; pos < tailPos; pos++) {
      const { row, col } = this.posToCoord(pos);
      const key = `${row},${col}`;
      if (grid[row]?.[col] !== null && !blockedCells.has(key)) {
        return false;
      }
    }
    return true;
  }

  isCounterClockwiseClear(headPos, tailPos, grid, blockedCells) {
    const totalCells = grid.length * this.gridCols;

    for (let pos = tailPos + 1; pos < totalCells; pos++) {
      const { row, col } = this.posToCoord(pos);
      const key = `${row},${col}`;
      if (grid[row]?.[col] !== null && !blockedCells.has(key)) {
        return false;
      }
    }

    for (let pos = 0; pos < headPos; pos++) {
      const { row, col } = this.posToCoord(pos);
      const key = `${row},${col}`;
      if (grid[row]?.[col] !== null && !blockedCells.has(key)) {
        return false;
      }
    }

    return true;
  }
}

class SnakeWrapStrategy extends ConnectionStrategy {
  constructor(gridCols) {
    super('snakeWrap', 4);
    this.gridCols = gridCols;
  }

  isValid(r1, c1, r2, c2, grid, blockedCells) {
    if (r1 === r2) return false;

    return this.isRightWrapClear(r1, c1, r2, c2, grid, blockedCells) ||
           this.isLeftWrapClear(r1, c1, r2, c2, grid, blockedCells);
  }

  isRightWrapClear(r1, c1, r2, c2, grid, blockedCells) {
    // Check right side of start row
    for (let col = c1 + 1; col < this.gridCols; col++) {
      const key = `${r1},${col}`;
      if (!blockedCells.has(key) && grid[r1]?.[col] !== null) {
        return false;
      }
    }

    // Check intermediate rows
    const minRow = Math.min(r1, r2);
    const maxRow = Math.max(r1, r2);
    for (let row = minRow + 1; row < maxRow; row++) {
      for (let col = 0; col < this.gridCols; col++) {
        const key = `${row},${col}`;
        if (!blockedCells.has(key) && grid[row]?.[col] !== null) {
          return false;
        }
      }
    }

    // Check left side of end row
    for (let col = 0; col < c2; col++) {
      const key = `${r2},${col}`;
      if (!blockedCells.has(key) && grid[r2]?.[col] !== null) {
        return false;
      }
    }

    return true;
  }

  isLeftWrapClear(r1, c1, r2, c2, grid, blockedCells) {
    // Check left side of start row
    for (let col = c1 - 1; col >= 0; col--) {
      const key = `${r1},${col}`;
      if (!blockedCells.has(key) && grid[r1]?.[col] !== null) {
        return false;
      }
    }

    // Check intermediate rows
    const minRow = Math.min(r1, r2);
    const maxRow = Math.max(r1, r2);
    for (let row = maxRow - 1; row > minRow; row--) {
      for (let col = this.gridCols - 1; col >= 0; col--) {
        const key = `${row},${col}`;
        if (!blockedCells.has(key) && grid[row]?.[col] !== null) {
          return false;
        }
      }
    }

    // Check right side of end row
    for (let col = this.gridCols - 1; col > c2; col--) {
      const key = `${r2},${col}`;
      if (!blockedCells.has(key) && grid[r2]?.[col] !== null) {
        return false;
      }
    }

    return true;
  }
}

// ============================================================================
// CONNECTION VALIDATOR CLASS
// ============================================================================

export class ConnectionValidator {
  constructor(config = {}) {
    this.gridCols = config.gridCols || 9;
    this.strategies = [
      new AdjacentStrategy(),
      new StraightLineStrategy(),
      new DiagonalStrategy(),
      new HeadToTailStrategy(this.gridCols),
      new SnakeWrapStrategy(this.gridCols)
    ];
    this.listeners = new Set();
  }

  /**
   * Validate connection between two cells
   */
  validateConnection(r1, c1, r2, c2, grid, blockedCells = new Set()) {
    // Basic validation
    if (r1 === r2 && c1 === c2) {
      return { valid: false, type: null, points: 0 };
    }

    if (!grid[r1] || !grid[r2]) {
      return { valid: false, type: null, points: 0 };
    }

    if (grid[r1][c1] === null || grid[r2][c2] === null) {
      return { valid: false, type: null, points: 0 };
    }

    // Try each strategy
    for (const strategy of this.strategies) {
      if (strategy.isValid(r1, c1, r2, c2, grid, blockedCells)) {
        this.notifyListeners('connectionValidated', {
          type: strategy.name,
          points: strategy.points,
          cells: [{ row: r1, col: c1 }, { row: r2, col: c2 }]
        });

        return {
          valid: true,
          type: strategy.name,
          points: strategy.points
        };
      }
    }

    return { valid: false, type: null, points: 0 };
  }

  /**
   * Find all valid connections from a cell
   */
  findValidConnections(row, col, grid, blockedCells, matchSystem) {
    const connections = [];
    const cellValue = grid[row]?.[col];

    if (cellValue === null) return connections;

    // Check all other cells
    for (let r = 0; r < grid.length; r++) {
      const rowData = grid[r];
      if (!rowData) continue;

      for (let c = 0; c < rowData.length; c++) {
        // Skip same cell
        if (r === row && c === col) continue;

        // Skip matched cells
        if (matchSystem && matchSystem.isMatched(r, c)) continue;

        const targetValue = grid[r][c];
        if (targetValue === null) continue;

        // Check if values match
        if (!matchSystem || !matchSystem.valuesMatch(cellValue, targetValue)) {
          continue;
        }

        // Check if connection is valid
        const result = this.validateConnection(row, col, r, c, grid, blockedCells);
        if (result.valid) {
          connections.push({
            row: r,
            col: c,
            type: result.type,
            points: result.points,
            value: targetValue
          });
        }
      }
    }

    return connections;
  }

  /**
   * Check if any valid moves exist
   */
  hasValidMoves(grid, blockedCells, matchSystem) {
    for (let r = 0; r < grid.length; r++) {
      const rowData = grid[r];
      if (!rowData) continue;

      for (let c = 0; c < rowData.length; c++) {
        if (grid[r][c] === null) continue;
        if (matchSystem && matchSystem.isMatched(r, c)) continue;

        const connections = this.findValidConnections(r, c, grid, blockedCells, matchSystem);
        if (connections.length > 0) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Get connection statistics
   */
  getConnectionStats(grid, blockedCells, matchSystem) {
    const stats = {
      totalPossibleConnections: 0,
      byType: {},
      bestConnection: null
    };

    this.strategies.forEach(strategy => {
      stats.byType[strategy.name] = 0;
    });

    let bestPoints = 0;

    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r]?.length || 0; c++) {
        if (grid[r][c] === null) continue;
        if (matchSystem && matchSystem.isMatched(r, c)) continue;

        const connections = this.findValidConnections(r, c, grid, blockedCells, matchSystem);
        
        connections.forEach(conn => {
          stats.totalPossibleConnections++;
          stats.byType[conn.type] = (stats.byType[conn.type] || 0) + 1;

          if (conn.points > bestPoints) {
            bestPoints = conn.points;
            stats.bestConnection = {
              from: { row: r, col: c },
              to: { row: conn.row, col: conn.col },
              type: conn.type,
              points: conn.points
            };
          }
        });
      }
    }

    return stats;
  }

  /**
   * Subscribe to validator events
   */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners(event, data) {
    this.listeners.forEach(listener => listener(event, data));
  }
}