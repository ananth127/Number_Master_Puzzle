// ============================================================================
// File: core/GameConfig.js
// Description: Singleton pattern for game configuration
// Reusable: YES - Can be used for any grid-based game
// ============================================================================

import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export class GameConfig {
  static instance = null;
  
  constructor(customConfig = {}) {
    if (GameConfig.instance) {
      return GameConfig.instance;
    }
    
    this.GRID_COLS = customConfig.gridCols || 9;
    this.GRID_ROWS = customConfig.gridRows || 4;
    this.MAX_CHANCES = customConfig.maxChances || 5;
    this.SCREEN_WIDTH = SCREEN_WIDTH;
    this.SCREEN_HEIGHT = SCREEN_HEIGHT;
    this.GRID_WIDTH = customConfig.gridWidth || (SCREEN_WIDTH - 20);
    this.CELL_SIZE = (this.GRID_WIDTH - (this.GRID_COLS - 1) * 7) / this.GRID_COLS;
    this.GRID_HEIGHT = customConfig.gridHeight || (SCREEN_HEIGHT * 0.55);
    
    GameConfig.instance = this;
  }

  static getInstance(customConfig) {
    if (!GameConfig.instance) {
      GameConfig.instance = new GameConfig(customConfig);
    }
    return GameConfig.instance;
  }

  static resetInstance() {
    GameConfig.instance = null;
  }

  updateConfig(newConfig) {
    Object.assign(this, newConfig);
  }
}


// ============================================================================
// File: core/LevelManager.js
// Description: Reusable level progression system for ANY game
// Reusable: YES - Completely game-agnostic
// ============================================================================

export class LevelManager {
  constructor(config = {}) {
    this.currentLevel = config.startLevel || 1;
    this.totalScore = 0;
    this.levelScore = 0;
    this.maxLevel = config.maxLevel || 100;
    this.levelConfig = config.levelConfig || this.getDefaultLevelConfig();
    this.listeners = [];
  }

  getDefaultLevelConfig() {
    return {
      // Override these methods for different games
      getInitialRows: (level) => level + 3,
      getTimeLimit: (level) => Math.max(420 - (level - 1) * 30, 120),
      getScoreMultiplier: (level) => level,
      getLevelUpBonus: () => 20,
      getRowCompleteBonus: () => 10,
      getDifficulty: (level) => {
        if (level <= 5) return 'Easy';
        if (level <= 10) return 'Medium';
        if (level <= 15) return 'Hard';
        return 'Expert';
      }
    };
  }

  // Observer pattern for level changes
  subscribe(callback) {
    this.listeners.push(callback);
  }

  unsubscribe(callback) {
    this.listeners = this.listeners.filter(cb => cb !== callback);
  }

  notify(event, data) {
    this.listeners.forEach(callback => callback(event, data));
  }

  getCurrentLevel() {
    return this.currentLevel;
  }

  getTotalScore() {
    return this.totalScore;
  }

  getLevelScore() {
    return this.levelScore;
  }

  getInitialRows() {
    return this.levelConfig.getInitialRows(this.currentLevel);
  }

  getTimeLimit() {
    return this.levelConfig.getTimeLimit(this.currentLevel);
  }

  getDifficulty() {
    return this.levelConfig.getDifficulty(this.currentLevel);
  }

  addScore(points, isLevelComplete = false, isRowComplete = false) {
    let finalPoints = points;
    if (isRowComplete) finalPoints += this.levelConfig.getRowCompleteBonus();
    if (isLevelComplete) finalPoints += this.levelConfig.getLevelUpBonus();
    
    this.levelScore += finalPoints;
    const scoreToAdd = finalPoints * this.levelConfig.getScoreMultiplier(this.currentLevel);
    this.totalScore += scoreToAdd;
    
    this.notify('scoreAdded', { finalPoints, scoreToAdd, totalScore: this.totalScore });
    
    return { finalPoints, scoreToAdd };
  }

  deductScore(points) {
    this.totalScore = Math.max(0, this.totalScore - points);
    this.notify('scoreDeducted', { points, totalScore: this.totalScore });
  }

  levelUp() {
    if (this.currentLevel < this.maxLevel) {
      this.currentLevel++;
      this.levelScore = 0;
      this.notify('levelUp', { level: this.currentLevel });
    }
  }

  levelDown() {
    if (this.currentLevel > 1) {
      this.currentLevel--;
      this.levelScore = 0;
      this.notify('levelDown', { level: this.currentLevel });
    }
  }

  setLevel(level) {
    if (level >= 1 && level <= this.maxLevel) {
      this.currentLevel = level;
      this.levelScore = 0;
      this.notify('levelChanged', { level: this.currentLevel });
    }
  }

  reset() {
    this.currentLevel = 1;
    this.totalScore = 0;
    this.levelScore = 0;
    this.notify('reset', {});
  }

  save() {
    return {
      currentLevel: this.currentLevel,
      totalScore: this.totalScore,
      levelScore: this.levelScore
    };
  }

  load(savedData) {
    this.currentLevel = savedData.currentLevel || 1;
    this.totalScore = savedData.totalScore || 0;
    this.levelScore = savedData.levelScore || 0;
    this.notify('loaded', savedData);
  }
}


// ============================================================================
// File: strategies/ConnectionStrategy.js
// Description: Strategy pattern for cell connection validation
// Reusable: YES - Can be extended for different game rules
// ============================================================================

export class ConnectionStrategy {
  isConnected(r1, c1, r2, c2, grid, matchedCells) {
    throw new Error("Must implement isConnected method");
  }

  getName() {
    return this.constructor.name;
  }
}

export class AdjacentConnectionStrategy extends ConnectionStrategy {
  isConnected(r1, c1, r2, c2) {
    const rowDiff = Math.abs(r1 - r2);
    const colDiff = Math.abs(c1 - c2);
    return rowDiff <= 1 && colDiff <= 1 && (rowDiff !== 0 || colDiff !== 0);
  }
}

export class StraightLineConnectionStrategy extends ConnectionStrategy {
  isConnected(r1, c1, r2, c2, grid, matchedCells) {
    if (r1 === r2) {
      const minCol = Math.min(c1, c2);
      const maxCol = Math.max(c1, c2);
      for (let col = minCol + 1; col < maxCol; col++) {
        const cellKey = `${r1},${col}`;
        if (!matchedCells.has(cellKey) && grid[r1] && grid[r1][col] !== null) return false;
      }
      return true;
    } else if (c1 === c2) {
      const minRow = Math.min(r1, r2);
      const maxRow = Math.max(r1, r2);
      for (let row = minRow + 1; row < maxRow; row++) {
        const cellKey = `${row},${c1}`;
        if (!matchedCells.has(cellKey) && grid[row] && grid[row][c1] !== null) return false;
      }
      return true;
    }
    return false;
  }
}

export class DiagonalConnectionStrategy extends ConnectionStrategy {
  isConnected(r1, c1, r2, c2, grid, matchedCells) {
    const diffR = r2 - r1;
    const diffC = c2 - c1;
    if (Math.abs(diffR) !== Math.abs(diffC)) return false;

    const dr = diffR > 0 ? 1 : -1;
    const dc = diffC > 0 ? 1 : -1;
    let r = r1 + dr;
    let c = c1 + dc;

    while (r !== r2 && c !== c2) {
      const cellKey = `${r},${c}`;
      if (!matchedCells.has(cellKey) && grid[r] && grid[r][c] !== null) return false;
      r += dr;
      c += dc;
    }
    return true;
  }
}

export class SnakeWrapConnectionStrategy extends ConnectionStrategy {
  isConnected(r1, c1, r2, c2, grid, matchedCells) {
    if (r1 === r2) return false;
    const GRID_COLS = grid[0].length;

    // Right wrap check
    let rightWrapClear = true;
    for (let col = c1 + 1; col < GRID_COLS; col++) {
      const cellKey = `${r1},${col}`;
      if (!matchedCells.has(cellKey) && grid[r1] && grid[r1][col] !== null) {
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
          if (!matchedCells.has(cellKey) && grid[row] && grid[row][col] !== null) {
            rightWrapClear = false;
            break;
          }
        }
        if (!rightWrapClear) break;
      }

      if (rightWrapClear) {
        for (let col = 0; col < c2; col++) {
          const cellKey = `${r2},${col}`;
          if (!matchedCells.has(cellKey) && grid[r2] && grid[r2][col] !== null) {
            rightWrapClear = false;
            break;
          }
        }
        if (rightWrapClear) return true;
      }
    }

    // Left wrap check
    let leftWrapClear = true;
    for (let col = c1 - 1; col >= 0; col--) {
      const cellKey = `${r1},${col}`;
      if (!matchedCells.has(cellKey) && grid[r1] && grid[r1][col] !== null) {
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
          if (!matchedCells.has(cellKey) && grid[row] && grid[row][col] !== null) {
            leftWrapClear = false;
            break;
          }
        }
        if (!leftWrapClear) break;
      }

      if (leftWrapClear) {
        for (let col = GRID_COLS - 1; col > c2; col--) {
          const cellKey = `${r2},${col}`;
          if (!matchedCells.has(cellKey) && grid[r2] && grid[r2][col] !== null) {
            leftWrapClear = false;
            break;
          }
        }
        if (leftWrapClear) return true;
      }
    }
    return false;
  }
}

export class HeadToTailConnectionStrategy extends ConnectionStrategy {
  isConnected(r1, c1, r2, c2, grid, matchedCells) {
    const GRID_COLS = grid[0].length;
    let headPos = -1, headRow = -1, headCol = -1;

    for (let i = 0; i < grid.length * GRID_COLS; i++) {
      const row = Math.floor(i / GRID_COLS);
      const col = i % GRID_COLS;
      const cellKey = `${row},${col}`;
      if (grid[row] && grid[row][col] !== null && !matchedCells.has(cellKey)) {
        headPos = i;
        headRow = row;
        headCol = col;
        break;
      }
    }

    let tailPos = -1, tailRow = -1, tailCol = -1;
    for (let i = grid.length * GRID_COLS - 1; i >= 0; i--) {
      const row = Math.floor(i / GRID_COLS);
      const col = i % GRID_COLS;
      const cellKey = `${row},${col}`;
      if (grid[row] && grid[row][col] !== null && !matchedCells.has(cellKey)) {
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
      if (grid[row] && grid[row][col] !== null && !matchedCells.has(cellKey)) {
        clockwiseClear = false;
        break;
      }
    }
    if (clockwiseClear) return true;

    let anticlockwiseClear = true;
    for (let i = tailPos + 1; i < grid.length * GRID_COLS; i++) {
      const row = Math.floor(i / GRID_COLS);
      const col = i % GRID_COLS;
      const cellKey = `${row},${col}`;
      if (grid[row] && grid[row][col] !== null && !matchedCells.has(cellKey)) {
        anticlockwiseClear = false;
        break;
      }
    }

    if (anticlockwiseClear) {
      for (let i = 0; i < headPos; i++) {
        const row = Math.floor(i / GRID_COLS);
        const col = i % GRID_COLS;
        const cellKey = `${row},${col}`;
        if (grid[row] && grid[row][col] !== null && !matchedCells.has(cellKey)) {
          anticlockwiseClear = false;
          break;
        }
      }
    }
    return anticlockwiseClear;
  }
}


// ============================================================================
// File: factories/CellValueGenerator.js
// Description: Factory pattern for generating cell values
// Reusable: YES - Can be used for any number-based grid game
// ============================================================================

export class CellValueGenerator {
  generate(count, existingValues = [], context = {}) {
    throw new Error("Must implement generate method");
  }
}

export class RandomCellValueGenerator extends CellValueGenerator {
  constructor(minValue = 1, maxValue = 9) {
    super();
    this.minValue = minValue;
    this.maxValue = maxValue;
  }

  generate(count) {
    return Array.from({ length: count }, () => 
      Math.floor(Math.random() * (this.maxValue - this.minValue + 1)) + this.minValue
    );
  }
}

export class SmartCellValueGenerator extends CellValueGenerator {
  constructor(minValue = 1, maxValue = 9, targetSum = 10) {
    super();
    this.minValue = minValue;
    this.maxValue = maxValue;
    this.targetSum = targetSum;
  }

  generate(count, existingValues = []) {
    const values = [];
    
    for (let i = 0; i < count; i++) {
      if (count <= 3 && existingValues.length > 0) {
        const randomExisting = existingValues[Math.floor(Math.random() * existingValues.length)];
        if (Math.random() < 0.7) {
          values.push(Math.random() < 0.5 ? randomExisting : this.targetSum - randomExisting);
        } else {
          values.push(Math.floor(Math.random() * (this.maxValue - this.minValue + 1)) + this.minValue);
        }
      } else {
        if (Math.random() < 0.4 && existingValues.length > 0) {
          values.push(existingValues[Math.floor(Math.random() * existingValues.length)]);
        } else if (Math.random() < 0.6 && existingValues.length > 0) {
          const randomExisting = existingValues[Math.floor(Math.random() * existingValues.length)];
          values.push(this.targetSum - randomExisting);
        } else {
          values.push(Math.floor(Math.random() * (this.maxValue - this.minValue + 1)) + this.minValue);
        }
      }
    }
    return values;
  }
}

export class WeightedCellValueGenerator extends CellValueGenerator {
  constructor(weights = {}) {
    super();
    // Example: { 1: 0.2, 2: 0.15, 3: 0.1, ... }
    this.weights = weights;
    this.values = Object.keys(weights).map(Number);
    this.totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  }

  generate(count) {
    const values = [];
    for (let i = 0; i < count; i++) {
      let random = Math.random() * this.totalWeight;
      for (const value of this.values) {
        random -= this.weights[value];
        if (random <= 0) {
          values.push(value);
          break;
        }
      }
    }
    return values;
  }
}


// ============================================================================
// File: managers/GridManager.js
// Description: Composite pattern for grid management
// Reusable: YES - Can manage any grid-based game logic
// ============================================================================

export class GridManager {
  constructor(rows, cols, valueGenerator, matchValidator = null) {
    this.rows = rows;
    this.cols = cols;
    this.grid = [];
    this.matchedCells = new Set();
    this.valueGenerator = valueGenerator;
    this.matchValidator = matchValidator || this.defaultMatchValidator;
    this.connectionStrategies = [];
  }

  setConnectionStrategies(strategies) {
    this.connectionStrategies = strategies;
  }

  defaultMatchValidator(val1, val2) {
    return val1 === val2 || (val1 + val2 === 10);
  }

  initialize() {
    this.grid = Array.from({ length: this.rows }, () =>
      Array.from({ length: this.cols }, () => Math.floor(Math.random() * 9) + 1)
    );
    this.matchedCells = new Set();
  }

  getGrid() {
    return this.grid;
  }

  getMatchedCells() {
    return this.matchedCells;
  }

  getCellValue(row, col) {
    return this.grid[row]?.[col] ?? null;
  }

  setCellValue(row, col, value) {
    if (this.grid[row]) {
      this.grid[row][col] = value;
    }
  }

  isCellMatched(row, col) {
    return this.matchedCells.has(`${row},${col}`);
  }

  areCellsConnected(r1, c1, r2, c2) {
    if (!this.grid[r1] || !this.grid[r2]) return { connected: false };
    if (r1 === r2 && c1 === c2) return { connected: false };
    if (this.grid[r1][c1] === null || this.grid[r2][c2] === null) return { connected: false };

    const num1 = this.grid[r1][c1];
    const num2 = this.grid[r2][c2];
    const isMatch = this.matchValidator(num1, num2);
    
    if (!isMatch) return { connected: false };

    for (let i = 0; i < this.connectionStrategies.length; i++) {
      const strategy = this.connectionStrategies[i];
      if (strategy.isConnected(r1, c1, r2, c2, this.grid, this.matchedCells)) {
        const strategyTypes = ['adjacent', 'straight', 'diagonal', 'snake', 'headtotail'];
        return { 
          connected: true, 
          isAdjacent: i === 0,
          type: strategyTypes[i] || 'custom',
          strategy: strategy.getName()
        };
      }
    }

    return { connected: false };
  }

  matchCells(r1, c1, r2, c2) {
    this.matchedCells.add(`${r1},${c1}`);
    this.matchedCells.add(`${r2},${c2}`);

    const rowsToRemove = [];
    for (let r = 0; r < this.grid.length; r++) {
      let allMatched = true;
      for (let c = 0; c < this.cols; c++) {
        if (!this.matchedCells.has(`${r},${c}`)) {
          allMatched = false;
          break;
        }
      }
      if (allMatched) rowsToRemove.push(r);
    }

    for (let i = rowsToRemove.length - 1; i >= 0; i--) {
      this.grid.splice(rowsToRemove[i], 1);
    }

    const updatedMatched = new Set();
    this.matchedCells.forEach(cellKey => {
      const [oldRow, col] = cellKey.split(',').map(Number);
      if (rowsToRemove.includes(oldRow)) return;
      const rowsRemovedBefore = rowsToRemove.filter(r => r < oldRow).length;
      const newRow = oldRow - rowsRemovedBefore;
      if (newRow >= 0 && newRow < this.grid.length) {
        updatedMatched.add(`${newRow},${col}`);
      }
    });

    this.matchedCells = updatedMatched;
    return { 
      rowsRemoved: rowsToRemove.length > 0, 
      levelComplete: this.grid.length === 0,
      rowCount: rowsToRemove.length 
    };
  }

  addValues(count) {
    const existingValues = this.getPlayableValues();
    const newValues = this.valueGenerator.generate(count, existingValues);

    let valueIndex = 0;
    for (let row = 0; row < this.grid.length && valueIndex < newValues.length; row++) {
      for (let col = 0; col < this.cols && valueIndex < newValues.length; col++) {
        if (this.grid[row][col] === null) {
          this.grid[row][col] = newValues[valueIndex];
          valueIndex++;
        }
      }
    }

    if (valueIndex < newValues.length) {
      const remainingValues = newValues.slice(valueIndex);
      const newRows = [];
      let tempRow = [];

      for (let i = 0; i < remainingValues.length; i++) {
        tempRow.push(remainingValues[i]);
        if (tempRow.length === this.cols || i === remainingValues.length - 1) {
          while (tempRow.length < this.cols) tempRow.push(null);
          newRows.push(tempRow);
          tempRow = [];
        }
      }
      this.grid.push(...newRows);
    }
  }

  getPlayableValues() {
    const values = [];
    for (let r = 0; r < this.grid.length; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cellKey = `${r},${c}`;
        if (this.grid[r][c] !== null && !this.matchedCells.has(cellKey)) {
          values.push(this.grid[r][c]);
        }
      }
    }
    return values;
  }

  getPlayableCells() {
    const cells = [];
    for (let r = 0; r < this.grid.length; r++) {
      if (!this.grid[r]) continue;
      for (let c = 0; c < this.cols; c++) {
        const cellKey = `${r},${c}`;
        if (this.grid[r][c] !== null && !this.matchedCells.has(cellKey)) {
          cells.push({ row: r, col: c, value: this.grid[r][c] });
        }
      }
    }
    return cells;
  }

  hasValidMoves() {
    const playableCells = this.getPlayableCells();

    for (let i = 0; i < playableCells.length; i++) {
      for (let j = i + 1; j < playableCells.length; j++) {
        const result = this.areCellsConnected(
          playableCells[i].row, playableCells[i].col,
          playableCells[j].row, playableCells[j].col
        );
        if (result.connected) return true;
      }
    }
    return false;
  }

  findHint() {
    const playableCells = this.getPlayableCells();

    for (let i = 0; i < playableCells.length; i++) {
      for (let j = i + 1; j < playableCells.length; j++) {
        const result = this.areCellsConnected(
          playableCells[i].row, playableCells[i].col,
          playableCells[j].row, playableCells[j].col
        );
        if (result.connected) {
          return [playableCells[i], playableCells[j]];
        }
      }
    }
    return null;
  }

  clear() {
    this.grid = [];
    this.matchedCells = new Set();
  }

  toJSON() {
    return {
      grid: this.grid,
      matchedCells: Array.from(this.matchedCells),
      rows: this.rows,
      cols: this.cols
    };
  }

  fromJSON(data) {
    this.grid = data.grid;
    this.matchedCells = new Set(data.matchedCells);
    this.rows = data.rows;
    this.cols = data.cols;
  }
}


// ============================================================================
// File: managers/TimerManager.js
// Description: Manages game timing with pause/resume functionality
// Reusable: YES - Can be used for any game with time limits
// ============================================================================

export class TimerManager {
  constructor(initialTime, onTick, onComplete) {
    this.initialTime = initialTime;
    this.timeLeft = initialTime;
    this.isRunning = false;
    this.intervalId = null;
    this.onTick = onTick;
    this.onComplete = onComplete;
  }

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.intervalId = setInterval(() => {
      this.timeLeft--;
      if (this.onTick) this.onTick(this.timeLeft);
      
      if (this.timeLeft <= 0) {
        this.stop();
        if (this.onComplete) this.onComplete();
      }
    }, 1000);
  }

  pause() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  resume() {
    if (this.isRunning) return;
    this.start();
  }

  stop() {
    this.pause();
    this.timeLeft = this.initialTime;
  }

  reset(newTime = null) {
    this.stop();
    if (newTime !== null) {
      this.initialTime = newTime;
    }
    this.timeLeft = this.initialTime;
  }

  addTime(seconds) {
    this.timeLeft += seconds;
    if (this.onTick) this.onTick(this.timeLeft);
  }

  getTimeLeft() {
    return this.timeLeft;
  }

  getFormattedTime() {
    const minutes = Math.floor(this.timeLeft / 60);
    const seconds = this.timeLeft % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  isActive() {
    return this.isRunning;
  }
}


// ============================================================================
// File: managers/PowerUpManager.js
// Description: Manages power-ups/abilities with cooldowns and limits
// Reusable: YES - Can manage abilities for any game
// ============================================================================

export class PowerUp {
  constructor(name, maxUses, cost = 0, cooldown = 0) {
    this.name = name;
    this.maxUses = maxUses;
    this.usesLeft = maxUses;
    this.cost = cost;
    this.cooldown = cooldown;
    this.isOnCooldown = false;
  }

  canUse(currentScore = Infinity) {
    return this.usesLeft > 0 && !this.isOnCooldown && currentScore >= this.cost;
  }

  use() {
    if (!this.canUse()) return false;
    
    this.usesLeft--;
    if (this.cooldown > 0) {
      this.isOnCooldown = true;
      setTimeout(() => {
        this.isOnCooldown = false;
      }, this.cooldown);
    }
    return true;
  }

  reset() {
    this.usesLeft = this.maxUses;
    this.isOnCooldown = false;
  }

  addUses(count) {
    this.usesLeft = Math.min(this.maxUses, this.usesLeft + count);
  }
}

export class PowerUpManager {
  constructor() {
    this.powerUps = new Map();
  }

  registerPowerUp(id, powerUp) {
    this.powerUps.set(id, powerUp);
  }

  usePowerUp(id, currentScore = Infinity) {
    const powerUp = this.powerUps.get(id);
    if (!powerUp) return { success: false, error: 'Power-up not found' };
    
    if (!powerUp.canUse(currentScore)) {
      if (powerUp.usesLeft <= 0) {
        return { success: false, error: 'No uses left' };
      }
      if (powerUp.isOnCooldown) {
        return { success: false, error: 'On cooldown' };
      }
      if (currentScore < powerUp.cost) {
        return { success: false, error: 'Insufficient score' };
      }
    }

    const success = powerUp.use();
    return { success, cost: powerUp.cost };
  }

  getPowerUp(id) {
    return this.powerUps.get(id);
  }

  resetAll() {
    this.powerUps.forEach(powerUp => powerUp.reset());
  }

  resetPowerUp(id) {
    const powerUp = this.powerUps.get(id);
    if (powerUp) powerUp.reset();
  }
}


// ============================================================================
// File: components/Cell.jsx
// Description: Reusable Cell component for grid-based games
// Reusable: YES - Can render any cell in any grid game
// ============================================================================

import React from 'react';
import { TouchableOpacity, Text, Animated, StyleSheet } from 'react-native';

export const Cell = ({ 
  value, 
  style, 
  onPress, 
  isAnimating, 
  cellColor,
  textStyle,
  disabled = false,
  renderContent = null
}) => {
  return (
    <Animated.View style={[style, isAnimating && { transform: [{ scale: isAnimating }] }]}>
      <TouchableOpacity 
        style={styles.cell} 
        onPress={onPress}
        disabled={disabled}
      >
        {renderContent ? renderContent(value) : (
          value !== null && (
            <Text style={[styles.cellText, { color: cellColor }, textStyle]}>
              {value}
            </Text>
          )
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};


// ============================================================================
// File: components/Grid.jsx
// Description: Reusable Grid component that works with GridManager
// Reusable: YES - Can display any grid-based game
// ============================================================================

import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Cell } from './Cell';

export const Grid = ({ 
  gridManager, 
  onCellPress, 
  getCellStyle,
  getCellColor,
  renderCell = null,
  cellAnimations = {},
  gridContainerStyle,
  rowStyle
}) => {
  const grid = gridManager.getGrid();
  const matchedCells = gridManager.getMatchedCells();

  const defaultGetCellStyle = (row, col) => {
    const cellKey = `${row},${col}`;
    const isMatched = matchedCells.has(cellKey);
    
    if (grid[row][col] === null) return { opacity: 0.3 };
    if (isMatched) return { opacity: 0.2 };
    return { opacity: 1 };
  };

  const defaultGetCellColor = (num) => {
    const colors = {
      1: '#f33838ff', 2: '#3be9ddff', 3: '#e7c831ff',
      4: '#56be98ff', 5: '#d04651ff', 6: '#ef8f4fff',
      7: '#c9706bff', 8: '#427fe8ff', 9: '#fb4fe4ff',
    };
    return colors[num] || '#3b82f6';
  };

  const cellStyleFunc = getCellStyle || defaultGetCellStyle;
  const cellColorFunc = getCellColor || defaultGetCellColor;

  return (
    <View style={[styles.gridContainer, gridContainerStyle]}>
      <ScrollView style={styles.gridScroll} showsVerticalScrollIndicator={false}>
        {grid.map((row, rIdx) => (
          <View key={rIdx} style={[styles.row, rowStyle]}>
            {row.map((num, cIdx) => {
              const animation = cellAnimations[`${rIdx}-${cIdx}`];
              
              if (renderCell) {
                return renderCell(rIdx, cIdx, num, () => onCellPress(rIdx, cIdx));
              }

              return (
                <Cell
                  key={`${rIdx}-${cIdx}`}
                  value={num}
                  style={cellStyleFunc(rIdx, cIdx)}
                  onPress={() => onCellPress(rIdx, cIdx)}
                  isAnimating={animation}
                  cellColor={num !== null ? cellColorFunc(num) : 'transparent'}
                />
              );
            })}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};


// ============================================================================
// File: components/LevelSelector.jsx
// Description: Reusable level selection component
// Reusable: YES - Works with any LevelManager
// ============================================================================

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet } from 'react-native';

export const LevelSelector = ({ 
  currentLevel, 
  maxLevel = 20,
  onSelectLevel,
  buttonStyle,
  modalStyle,
  renderLevelButton = null
}) => {
  const [showModal, setShowModal] = useState(false);

  const defaultRenderButton = (level, isActive) => (
    <TouchableOpacity
      key={level}
      style={[
        styles.levelButton,
        isActive && styles.levelButtonActive
      ]}
      onPress={() => {
        onSelectLevel(level);
        setShowModal(false);
      }}
    >
      <Text style={[
        styles.levelButtonText,
        isActive && styles.levelButtonTextActive
      ]}>
        {level}
      </Text>
    </TouchableOpacity>
  );

  return (
    <>
      <TouchableOpacity 
        style={[styles.levelBadge, buttonStyle]}
        onPress={() => setShowModal(true)}
      >
        <Text style={styles.levelText}>LEVEL {currentLevel} ▼</Text>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.levelSelectorContainer, modalStyle]}>
            <Text style={styles.levelSelectorTitle}>Choose Level</Text>
            <ScrollView style={styles.levelScrollView}>
              <View style={styles.levelGrid}>
                {Array.from({ length: maxLevel }, (_, i) => i + 1).map(level => 
                  renderLevelButton 
                    ? renderLevelButton(level, currentLevel === level, () => {
                        onSelectLevel(level);
                        setShowModal(false);
                      })
                    : defaultRenderButton(level, currentLevel === level)
                )}
              </View>
            </ScrollView>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.cancelButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};


// ============================================================================
// File: components/ScoreDisplay.jsx
// Description: Reusable score display component
// Reusable: YES - Can display score for any game
// ============================================================================

import React from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';

export const ScoreDisplay = ({ 
  totalScore, 
  levelScore, 
  lastPoints,
  animate,
  containerStyle,
  showLevelScore = false
}) => {
  return (
    <Animated.View style={[styles.scoreContainer, containerStyle, animate && { transform: [{ scale: animate }] }]}>
      <Text style={styles.scoreLabel}>SCORE</Text>
      <Text style={styles.scoreValue}>{totalScore}</Text>
      {lastPoints > 0 && (
        <Text style={styles.pointsAdded}>+{lastPoints}</Text>
      )}
      {showLevelScore && (
        <Text style={styles.levelScoreText}>Level: {levelScore}</Text>
      )}
    </Animated.View>
  );
};


// ============================================================================
// File: components/Timer.jsx
// Description: Reusable timer display component
// Reusable: YES - Works with TimerManager
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const Timer = ({ 
  timeLeft, 
  formatTime = null,
  containerStyle,
  textStyle,
  warningThreshold = 30,
  warningStyle
}) => {
  const defaultFormat = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formattedTime = formatTime ? formatTime(timeLeft) : defaultFormat(timeLeft);
  const isWarning = timeLeft <= warningThreshold;

  return (
    <View style={[styles.timerContainer, containerStyle, isWarning && warningStyle]}>
      <Text style={[styles.timerText, textStyle, isWarning && styles.timerWarning]}>
        {formattedTime}
      </Text>
    </View>
  );
};


// ============================================================================
// File: components/PowerUpButton.jsx
// Description: Reusable power-up/ability button
// Reusable: YES - Can render any game ability
// ============================================================================

import React from 'react';
import { TouchableOpacity, Text, Animated, StyleSheet } from 'react-native';

export const PowerUpButton = ({ 
  icon,
  label,
  usesLeft,
  maxUses,
  onPress,
  disabled = false,
  animate,
  buttonStyle,
  textStyle,
  renderCustomContent = null
}) => {
  return (
    <Animated.View style={[styles.actionButton, animate && { transform: [{ scale: animate }] }]}>
      <TouchableOpacity
        onPress={onPress}
        style={[
          styles.powerUpButton,
          disabled && styles.powerUpButtonDisabled,
          buttonStyle
        ]}
        disabled={disabled}
      >
        {renderCustomContent ? renderCustomContent({ icon, label, usesLeft, maxUses }) : (
          <Text style={[styles.powerUpButtonText, textStyle]}>
            {icon} {label} ({maxUses - usesLeft})
          </Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};


// ============================================================================
// File: components/GameControls.jsx
// Description: Reusable game control buttons (play/pause/reset)
// Reusable: YES - Standard game controls
// ============================================================================

import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

export const GameControls = ({ 
  isPlaying,
  onPlayPause,
  onReset,
  additionalControls = [],
  containerStyle
}) => {
  return (
    <View style={[styles.controls, containerStyle]}>
      <TouchableOpacity
        onPress={onPlayPause}
        style={[styles.button, styles.buttonPlay]}
      >
        <Text style={styles.buttonText}>{isPlaying ? '⏸' : '▶'}</Text>
      </TouchableOpacity>

      {additionalControls.map((control, idx) => (
        <TouchableOpacity
          key={idx}
          onPress={control.onPress}
          style={[styles.button, control.style]}
        >
          <Text style={styles.buttonText}>{control.icon}</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity 
        onPress={onReset} 
        style={[styles.button, styles.buttonReset]}
      >
        <Text style={styles.buttonText}>↻</Text>
      </TouchableOpacity>
    </View>
  );
};


// ============================================================================
// File: hooks/useAnimations.js
// Description: Custom hook for managing game animations
// Reusable: YES - Animation utilities for any game
// ============================================================================

import { useRef } from 'react';
import { Animated } from 'react-native';

export const useAnimations = () => {
  const animations = useRef({}).current;

  const createAnimation = (name, initialValue = 0) => {
    if (!animations[name]) {
      animations[name] = new Animated.Value(initialValue);
    }
    return animations[name];
  };

  const animateScale = (name, toValue = 1.2, duration = 150, callback) => {
    const anim = createAnimation(name, 1);
    Animated.sequence([
      Animated.timing(anim, {
        toValue,
        duration,
        useNativeDriver: true,
      }),
      Animated.timing(anim, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      }),
    ]).start(callback);
  };

  const animateShake = (name, intensity = 10, duration = 50) => {
    const anim = createAnimation(name, 0);
    Animated.sequence([
      Animated.timing(anim, { toValue: intensity, duration, useNativeDriver: true }),
      Animated.timing(anim, { toValue: -intensity, duration, useNativeDriver: true }),
      Animated.timing(anim, { toValue: intensity, duration, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0, duration, useNativeDriver: true }),
    ]).start();
  };

  const animatePulse = (name, toValue = 1.15, duration = 400) => {
    const anim = createAnimation(name, 1);
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue, duration, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1, duration, useNativeDriver: true }),
      ])
    ).start();
  };

  const animateFade = (name, toValue = 1, duration = 300, callback) => {
    const anim = createAnimation(name, 0);
    Animated.timing(anim, {
      toValue,
      duration,
      useNativeDriver: true,
    }).start(callback);
  };

  const stopAnimation = (name) => {
    if (animations[name]) {
      animations[name].stopAnimation();
    }
  };

  const resetAnimation = (name, value = 0) => {
    if (animations[name]) {
      animations[name].setValue(value);
    }
  };

  const getAnimation = (name) => animations[name];

  return {
    createAnimation,
    animateScale,
    animateShake,
    animatePulse,
    animateFade,
    stopAnimation,
    resetAnimation,
    getAnimation
  };
};


// ============================================================================
// File: hooks/useGameState.js
// Description: Custom hook for managing game state
// Reusable: YES - Generic game state management
// ============================================================================

import { useState, useCallback } from 'react';

export const useGameState = (initialState = {}) => {
  const [state, setState] = useState({
    isPlaying: false,
    isPaused: false,
    isGameOver: false,
    ...initialState
  });

  const updateState = useCallback((updates) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const startGame = useCallback(() => {
    updateState({ isPlaying: true, isPaused: false, isGameOver: false });
  }, [updateState]);

  const pauseGame = useCallback(() => {
    updateState({ isPaused: true });
  }, [updateState]);

  const resumeGame = useCallback(() => {
    updateState({ isPaused: false });
  }, [updateState]);

  const endGame = useCallback(() => {
    updateState({ isPlaying: false, isGameOver: true });
  }, [updateState]);

  const resetGame = useCallback(() => {
    setState({
      isPlaying: false,
      isPaused: false,
      isGameOver: false,
      ...initialState
    });
  }, [initialState]);

  return {
    state,
    updateState,
    startGame,
    pauseGame,
    resumeGame,
    endGame,
    resetGame
  };
};


// ============================================================================
// File: utils/GameStorage.js
// Description: Save/load game state
// Reusable: YES - Generic save system
// ============================================================================

export class GameStorage {
  static async save(key, data) {
    try {
      const jsonData = JSON.stringify(data);
      // In React Native, use AsyncStorage
      // await AsyncStorage.setItem(key, jsonData);
      localStorage.setItem(key, jsonData);
      return true;
    } catch (error) {
      console.error('Save error:', error);
      return false;
    }
  }

  static async load(key) {
    try {
      // In React Native, use AsyncStorage
      // const jsonData = await AsyncStorage.getItem(key);
      const jsonData = localStorage.getItem(key);
      return jsonData ? JSON.parse(jsonData) : null;
    } catch (error) {
      console.error('Load error:', error);
      return null;
    }
  }

  static async remove(key) {
    try {
      // await AsyncStorage.removeItem(key);
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Remove error:', error);
      return false;
    }
  }

  static async clear() {
    try {
      // await AsyncStorage.clear();
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Clear error:', error);
      return false;
    }
  }
}


// ============================================================================
// File: styles/CommonStyles.js
// Description: Shared styles for components
// Reusable: YES - Common styling patterns
// ============================================================================

import { StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const commonStyles = StyleSheet.create({
  // Cell styles
  cell: {
    width: (SCREEN_WIDTH - 20 - 8 * 7) / 9,
    height: (SCREEN_WIDTH - 20 - 8 * 7) / 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  
  cellText: {
    fontSize: ((SCREEN_WIDTH - 20 - 8 * 7) / 9) * 0.6,
    fontWeight: '900',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },

  // Grid styles
  gridContainer: {
    backgroundColor: 'rgba(20, 20, 20, 0.5)',
    borderRadius: 20,
    padding: 8,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    height: SCREEN_HEIGHT * 0.55,
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

  // Button styles
  button: {
    width: SCREEN_WIDTH * 0.14,
    height: SCREEN_WIDTH * 0.14,
    borderRadius: SCREEN_WIDTH * 0.07,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },

  buttonPlay: {
    backgroundColor: '#00ff88',
    shadowColor: '#00ff88',
  },

  buttonReset: {
    backgroundColor: '#e94560',
    shadowColor: '#e94560',
  },

  buttonText: {
    color: '#fff',
    fontSize: SCREEN_WIDTH * 0.07,
    fontWeight: '700',
  },

  // Level selector styles
  levelBadge: {
    backgroundColor: '#e94560',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    shadowColor: '#e94560',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },

  levelText: {
    color: '#fff',
    fontSize: SCREEN_WIDTH * 0.04,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  levelSelectorContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 24,
    width: SCREEN_WIDTH * 0.85,
    maxHeight: SCREEN_HEIGHT * 0.7,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },

  levelSelectorTitle: {
    color: '#fff',
    fontSize: SCREEN_WIDTH * 0.055,
    fontWeight: '900',
    marginBottom: 20,
    letterSpacing: 1,
  },

  levelScrollView: {
    width: '100%',
    maxHeight: SCREEN_HEIGHT * 0.5,
  },

  levelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },

  levelButton: {
    width: SCREEN_WIDTH * 0.15,
    height: SCREEN_WIDTH * 0.15,
    borderRadius: 12,
    backgroundColor: '#2d2d2d',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },

  levelButtonActive: {
    backgroundColor: '#e94560',
    borderColor: '#fff',
  },

  levelButtonText: {
    color: '#fff',
    fontSize: SCREEN_WIDTH * 0.045,
    fontWeight: '800',
  },

  levelButtonTextActive: {
    color: '#fff',
    fontWeight: '900',
  },

  cancelButton: {
    backgroundColor: '#e94560',
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 4,
    marginTop: 20,
  },

  cancelButtonText: {
    color: '#fff',
    fontSize: SCREEN_WIDTH * 0.04,
    fontWeight: '800',
  },

  // Score styles
  scoreContainer: {
    alignItems: 'flex-end',
  },

  scoreLabel: {
    color: '#94a3b8',
    fontSize: SCREEN_WIDTH * 0.03,
    fontWeight: '600',
    letterSpacing: 1,
  },

  scoreValue: {
    color: '#ffd700',
    fontSize: SCREEN_WIDTH * 0.08,
    fontWeight: '900',
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },

  pointsAdded: {
    color: '#00ff88',
    fontSize: SCREEN_WIDTH * 0.035,
    fontWeight: '700',
    marginTop: -4,
  },

  levelScoreText: {
    color: '#94a3b8',
    fontSize: SCREEN_WIDTH * 0.03,
    fontWeight: '600',
  },

  // Timer styles
  timerContainer: {
    backgroundColor: 'rgba(20, 20, 20, 0.8)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },

  timerText: {
    color: '#fff',
    fontSize: SCREEN_WIDTH * 0.065,
    fontWeight: '900',
    fontFamily: 'monospace',
  },

  timerWarning: {
    color: '#ff4444',
  },

  // Power-up styles
  actionButton: {
    flex: 1,
  },

  powerUpButton: {
    backgroundColor: '#9d4edd',
    paddingVertical: SCREEN_HEIGHT * 0.02,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#9d4edd',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },

  powerUpButtonDisabled: {
    backgroundColor: '#475569',
    shadowColor: '#475569',
  },

  powerUpButtonText: {
    color: '#fff',
    fontSize: SCREEN_WIDTH * 0.04,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  // Controls
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 16,
  },
});

export const styles = commonStyles;


// ============================================================================
// File: NumberMasterGame.jsx
// Description: Main game implementation using all reusable components
// This demonstrates how to use the framework for a specific game
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Alert, Animated, StyleSheet } from 'react-native';
import { GameConfig } from './core/GameConfig';
import { LevelManager } from './core/LevelManager';
import { GridManager } from './managers/GridManager';
import { TimerManager } from './managers/TimerManager';
import { PowerUp, PowerUpManager } from './managers/PowerUpManager';
import {
  AdjacentConnectionStrategy,
  StraightLineConnectionStrategy,
  DiagonalConnectionStrategy,
  SnakeWrapConnectionStrategy,
  HeadToTailConnectionStrategy
} from './strategies/ConnectionStrategy';
import { SmartCellValueGenerator } from './factories/CellValueGenerator';
import { Grid } from './components/Grid';
import { LevelSelector } from './components/LevelSelector';
import { ScoreDisplay } from './components/ScoreDisplay';
import { Timer } from './components/Timer';
import { PowerUpButton } from './components/PowerUpButton';
import { GameControls } from './components/GameControls';
import { useAnimations } from './hooks/useAnimations';
import { useGameState } from './hooks/useGameState';
import { commonStyles } from './styles/CommonStyles';

export default function NumberMasterGame() {
  // Initialize core systems
  const config = GameConfig.getInstance();
  const [levelManager] = useState(() => new LevelManager());
  const [powerUpManager] = useState(() => {
    const manager = new PowerUpManager();
    manager.registerPowerUp('add', new PowerUp('Add Values', 5));
    manager.registerPowerUp('hint', new PowerUp('Hint', 5, 10));
    manager.registerPowerUp('change', new PowerUp('Change Number', 5));
    return manager;
  });

  // Grid manager setup
  const [gridManager, setGridManager] = useState(() => {
    const manager = new GridManager(
      levelManager.getInitialRows(),
      config.GRID_COLS,
      new SmartCellValueGenerator()
    );
    manager.setConnectionStrategies([
      new AdjacentConnectionStrategy(),
      new StraightLineConnectionStrategy(),
      new DiagonalConnectionStrategy(),
      new SnakeWrapConnectionStrategy(),
      new HeadToTailConnectionStrategy()
    ]);
    manager.initialize();
    return manager;
  });

  // Timer manager
  const [timerManager] = useState(() => new TimerManager(
    levelManager.getTimeLimit(),
    (timeLeft) => setTimeLeft(timeLeft),
    () => handleGameOver()
  ));

  // Game state
  const { state, updateState, startGame, pauseGame, resumeGame, resetGame: resetGameState } = useGameState();
  const [selected, setSelected] = useState(null);
  const [timeLeft, setTimeLeft] = useState(levelManager.getTimeLimit());
  const [invalidCell, setInvalidCell] = useState(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [lastPoints, setLastPoints] = useState(0);
  const [hintCells, setHintCells] = useState([]);
  const [noMovesAvailable, setNoMovesAvailable] = useState(false);
  const [showNumberPicker, setShowNumberPicker] = useState(false);
  const [selectedCellForChange, setSelectedCellForChange] = useState(null);
  const [isChangeMode, setIsChangeMode] = useState(false);

  // Animations
  const {
    createAnimation,
    animateScale,
    animateShake,
    animatePulse,
    getAnimation
  } = useAnimations();

  const scaleAnim = createAnimation('scale', 1);
  const scoreAnim = createAnimation('score', 1);
  const levelAnim = createAnimation('level', 0);
  const hintAnim = createAnimation('hint', 1);
  const addButtonAnim = createAnimation('addButton', 1);
  const shakeAnim = createAnimation('shake', 0);

  // Level change effect
  useEffect(() => {
    const newRows = levelManager.getInitialRows();
    const newGridManager = new GridManager(
      newRows,
      config.GRID_COLS,
      new SmartCellValueGenerator()
    );
    newGridManager.setConnectionStrategies([
      new AdjacentConnectionStrategy(),
      new StraightLineConnectionStrategy(),
      new DiagonalConnectionStrategy(),
      new SnakeWrapConnectionStrategy(),
      new HeadToTailConnectionStrategy()
    ]);
    newGridManager.initialize();
    setGridManager(newGridManager);
    
    const newTime = levelManager.getTimeLimit();
    timerManager.reset(newTime);
    setTimeLeft(newTime);
  }, [levelManager.getCurrentLevel()]);

  // Timer control
  useEffect(() => {
    if (state.isPlaying && !state.isPaused) {
      timerManager.resume();
    } else {
      timerManager.pause();
    }
  }, [state.isPlaying, state.isPaused]);

  // Check for no moves and animate add button
  useEffect(() => {
    if (noMovesAvailable && powerUpManager.getPowerUp('add').usesLeft > 0) {
      animatePulse('addButton');
    }
  }, [noMovesAvailable]);

  const handleGameOver = () => {
    Alert.alert(
      "Time's Up!",
      `Final Score: ${levelManager.getTotalScore()}\nLevel Reached: ${levelManager.getCurrentLevel()}`,
      [{ text: "OK", onPress: handleReset }]
    );
  };

  const handleCellPress = (row, col) => {
    if (!state.isPlaying) return;

    // Change mode handling
    if (isChangeMode) {
      setSelectedCellForChange({ row, col });
      setShowNumberPicker(true);
      setIsChangeMode(false);
      return;
    }

    if (gridManager.getCellValue(row, col) === null) return;
    if (gridManager.isCellMatched(row, col)) return;

    setHintCells([]);

    if (selected === null) {
      setSelected({ row, col });
      animateScale('scale', 1.1);
      return;
    }

    const { row: r1, col: c1 } = selected;
    const connectionResult = gridManager.areCellsConnected(r1, c1, row, col);

    if (connectionResult.connected) {
      const matchResult = gridManager.matchCells(r1, c1, row, col);
      const basePoints = connectionResult.isAdjacent ? 1 : 4;

      if (matchResult.levelComplete) {
        const { finalPoints } = levelManager.addScore(basePoints, true, matchResult.rowsRemoved);
        setLastPoints(finalPoints);
        animateScale('score');
        
        setTimeout(() => {
          levelManager.levelUp();
          showLevelUpAnimation();
          powerUpManager.resetAll();
          setHintCells([]);
          setNoMovesAvailable(false);
        }, 500);
      } else {
        const { finalPoints } = levelManager.addScore(basePoints, false, matchResult.rowsRemoved);
        setLastPoints(finalPoints);
        animateScale('score');

        setTimeout(() => {
          const hasValidMoves = gridManager.hasValidMoves();
          setNoMovesAvailable(!hasValidMoves);
          
          if (!hasValidMoves && powerUpManager.getPowerUp('add').usesLeft === 0) {
            setTimeout(() => {
              Alert.alert(
                "Game Over!",
                `No more moves!\nFinal Score: ${levelManager.getTotalScore()}\nLevel Reached: ${levelManager.getCurrentLevel()}`,
                [{ text: "OK", onPress: handleReset }]
              );
            }, 500);
          }
        }, 100);
      }
    } else {
      animateShake('shake');
      setInvalidCell({ row, col });
      setTimeout(() => setInvalidCell(null), 500);
    }

    setSelected(null);
    animateScale('scale', 1, 100);
  };

  const handleAddValues = () => {
    if (!state.isPlaying) {
      Alert.alert("Notice", "Start the game first!");
      return;
    }

    const result = powerUpManager.usePowerUp('add');
    if (!result.success) {
      Alert.alert("Limit Reached", result.error);
      return;
    }

    const valuesToAdd = gridManager.getPlayableValues().length;
    gridManager.addValues(valuesToAdd);
    setNoMovesAvailable(false);
    setHintCells([]);

    setTimeout(() => {
      setNoMovesAvailable(!gridManager.hasValidMoves());
    }, 100);
  };

  const handleHint = () => {
    if (!state.isPlaying) {
      Alert.alert("Notice", "Start the game first!");
      return;
    }

    const hintPowerUp = powerUpManager.getPowerUp('hint');
    
    if (hintPowerUp.usesLeft === 0 && levelManager.getTotalScore() >= 10) {
      Alert.alert(
        "No Hints Left!",
        "Using a hint now will cost you 10 points.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "OK",
            onPress: () => {
              levelManager.deductScore(10);
              hintPowerUp.addUses(1);
              showHintHelper();
            }
          }
        ]
      );
      return;
    }

    const result = powerUpManager.usePowerUp('hint', levelManager.getTotalScore());
    if (!result.success) {
      Alert.alert("No Hints Left", result.error);
      return;
    }

    showHintHelper();
  };

  const showHintHelper = () => {
    const hint = gridManager.findHint();
    if (hint) {
      setHintCells(hint);
      setNoMovesAvailable(false);
      animatePulse('hint');
    }
  };

  const handleChangeNumber = () => {
    if (!state.isPlaying) {
      Alert.alert("Notice", "Start the game first!");
      return;
    }

    const result = powerUpManager.usePowerUp('change');
    if (!result.success) {
      Alert.alert("Limit Reached", result.error);
      return;
    }

    setIsChangeMode(true);
    Alert.alert("Change Mode", "Tap any cell to change its number");
  };

  const confirmNumberChange = (newNumber) => {
    if (!selectedCellForChange) return;

    const { row, col } = selectedCellForChange;
    gridManager.setCellValue(row, col, newNumber);
    
    const matched = gridManager.getMatchedCells();
    matched.delete(`${row},${col}`);

    setShowNumberPicker(false);
    setSelectedCellForChange(null);
    setNoMovesAvailable(false);
    setHintCells([]);
  };

  const handlePlayPause = () => {
    if (state.isPlaying) {
      pauseGame();
    } else {
      startGame();
    }
  };

  const handleReset = () => {
    Alert.alert(
      "Reset Game",
      "Are you sure you want to reset the game?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "OK",
          onPress: () => {
            resetGameState();
            levelManager.reset();
            powerUpManager.resetAll();
            timerManager.reset();
            const newGridManager = new GridManager(
              levelManager.getInitialRows(),
              config.GRID_COLS,
              new SmartCellValueGenerator()
            );
            newGridManager.setConnectionStrategies([
              new AdjacentConnectionStrategy(),
              new StraightLineConnectionStrategy(),
              new DiagonalConnectionStrategy(),
              new SnakeWrapConnectionStrategy(),
              new HeadToTailConnectionStrategy()
            ]);
            newGridManager.initialize();
            setGridManager(newGridManager);
            setSelected(null);
            setHintCells([]);
            setNoMovesAvailable(false);
            setLastPoints(0);
          }
        }
      ]
    );
  };

  const handleLevelSelect = (level) => {
    levelManager.setLevel(level);
  };

  const showLevelUpAnimation = () => {
    setShowLevelUp(true);
    Animated.sequence([
      Animated.timing(levelAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(1500),
      Animated.timing(levelAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setShowLevelUp(false));
  };

  const getCellStyle = (row, col) => {
    const cellKey = `${row},${col}`;
    const isMatched = gridManager.isCellMatched(row, col);
    const isInvalid = invalidCell?.row === row && invalidCell?.col === col;
    const isSelected = selected?.row === row && selected?.col === col;
    const isHint = hintCells.some(hint => hint.row === row && hint.col === col);
    const isSelectedForChange = selectedCellForChange?.row === row && selectedCellForChange?.col === col;

    if (gridManager.getCellValue(row, col) === null) return { opacity: 0.3 };
    if (isMatched) return { opacity: 0.2 };
    if (isInvalid) {
      return {
        opacity: 1,
        backgroundColor: 'rgba(176, 56, 29, 0.3)',
        shadowColor: '#ff0000ff',
        shadowRadius: 10,
        elevation: 8
      };
    }
    if (isSelected) {
      return {
        opacity: 1,
        backgroundColor: 'rgba(255, 215, 0, 0.3)',
        shadowColor: '#ffd700',
        shadowRadius: 10,
        elevation: 8
      };
    }
    if (isSelectedForChange) {
      return {
        opacity: 1,
        backgroundColor: 'rgba(157, 78, 221, 0.4)',
        shadowColor: '#9d4edd',
        shadowRadius: 10,
        elevation: 8
      };
    }
    if (isHint) {
      return {
        opacity: 1,
        backgroundColor: 'rgba(0, 255, 136, 0.2)',
        shadowColor: '#00ff88',
        shadowRadius: 8,
      };
    }
    return { opacity: 1 };
  };

  const addPowerUp = powerUpManager.getPowerUp('add');
  const hintPowerUp = powerUpManager.getPowerUp('hint');
  const changePowerUp = powerUpManager.getPowerUp('change');

  return (
    <Animated.View style={[gameStyles.container, { transform: [{ translateX: shakeAnim }] }]}>
      {/* Header */}
      <View style={gameStyles.header}>
        <LevelSelector
          currentLevel={levelManager.getCurrentLevel()}
          maxLevel={20}
          onSelectLevel={handleLevelSelect}
        />
        <ScoreDisplay
          totalScore={levelManager.getTotalScore()}
          levelScore={levelManager.getLevelScore()}
          lastPoints={lastPoints}
          animate={scoreAnim}
        />
      </View>

      {/* Level Up Animation */}
      {showLevelUp && (
        <Animated.View
          style={[
            gameStyles.levelUpOverlay,
            {
              opacity: levelAnim,
              transform: [{
                scale: levelAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 1],
                })
              }]
            }
          ]}
        >
          <Text style={gameStyles.levelUpText}>
            🎉 LEVEL {levelManager.getCurrentLevel()} 🎉
          </Text>
        </Animated.View>
      )}

      {/* Content */}
      <View style={gameStyles.contentContainer}>
        {/* Controls */}
        <View style={gameStyles.controlsRow}>
          <GameControls
            isPlaying={state.isPlaying}
            onPlayPause={handlePlayPause}
            onReset={handleReset}
          />
          <Timer timeLeft={timeLeft} />
        </View>

        {/* Grid */}
        <Grid
          gridManager={gridManager}
          onCellPress={handleCellPress}
          getCellStyle={getCellStyle}
          cellAnimations={{
            ...hintCells.reduce((acc, hint) => {
              acc[`${hint.row}-${hint.col}`] = hintAnim;
              return acc;
            }, {})
          }}
        />

        {/* Power-ups */}
        <View style={gameStyles.powerUpRow}>
          <PowerUpButton
            icon="➕"
            label="Add"
            usesLeft={addPowerUp.usesLeft}
            maxUses={addPowerUp.maxUses}
            onPress={handleAddValues}
            disabled={!state.isPlaying || addPowerUp.usesLeft === 0}
            animate={noMovesAvailable && addPowerUp.usesLeft > 0 ? addButtonAnim : null}
            buttonStyle={noMovesAvailable && addPowerUp.usesLeft > 0 ? gameStyles.alertButton : null}
          />
          <PowerUpButton
            icon="💡"
            label="Hint"
            usesLeft={hintPowerUp.usesLeft}
            maxUses={hintPowerUp.maxUses}
            onPress={handleHint}
            disabled={!state.isPlaying}
            buttonStyle={gameStyles.hintButton}
          />
          <PowerUpButton
            icon="🔄"
            label="Change"
            usesLeft={changePowerUp.usesLeft}
            maxUses={changePowerUp.maxUses}
            onPress={handleChangeNumber}
            disabled={!state.isPlaying || changePowerUp.usesLeft === 0}
          />
        </View>
      </View>
    </Animated.View>
  );
}

const gameStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: 'rgba(20, 20, 20, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  levelUpOverlay: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    zIndex: 999,
    alignItems: 'center',
  },
  levelUpText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#ffd700',
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 15,
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  powerUpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginVertical: 12,
  },
  alertButton: {
    backgroundColor: '#e94560',
  },
  hintButton: {
    backgroundColor: '#00ff88',
  },
});