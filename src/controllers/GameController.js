// ============================================================================
// FILE: src/controllers/GameController.js
// ============================================================================

import { ScoreSystem } from '../core/ScoreSystem';
import { TimerSystem } from '../core/TimerSystem';
import { LevelSystem } from '../core/LevelSystem';
import { ResourceSystem } from '../core/ResourceSystem';
import { StateMachine } from '../core/StateMachine';
import { SoundSystem } from '../core/SoundSystem';
import { GridSystem } from '../systems/GridSystem';
import { MatchSystem } from '../systems/MatchSystem';
import { ConnectionValidator } from '../systems/ConnectionValidator';

/**
 * Game Controller - Orchestrates all game systems
 * This is the brain of the game that coordinates everything
 */
export class GameController {
  constructor(config = {}) {
    // Store config for reset
    this.config = config;

    // Initialize all systems
    this.initializeSystems(config);

    // Game state
    this.selectedCell = null;
    this.hintCells = [];
    this.isChangeMode = false;
    this.listeners = new Set();

    // Setup system integrations
    this.setupSystemIntegrations();
  }

  /**
   * Initialize all game systems
   */
  initializeSystems(config) {
    // Core systems (reusable across games)
    this.scoreSystem = new ScoreSystem({
      initialScore: 0,
      baseMultiplier: 1
    });

    this.timerSystem = new TimerSystem({
      duration: config.initialTime || 420,
      mode: 'countdown',
      onComplete: () => this.handleTimeUp()
    });

    this.levelSystem = new LevelSystem({
      startLevel: 1,
      baseExpRequired: 100,
      expCurveType: 'linear',
      onLevelUp: (level) => this.handleLevelUp(level)
    });

    this.resourceSystem = new ResourceSystem({
      resources: {
        addMoves: { initial: 5, max: 5, min: 0, metadata: { initialValue: 5 } },
        hints: { initial: 5, max: 5, min: 0, metadata: { initialValue: 5 } },
        changes: { initial: 5, max: 5, min: 0, metadata: { initialValue: 5 } }
      }
    });

    this.stateMachine = new StateMachine('idle', {
      maxHistorySize: 10
    });

    // Sound system
    this.soundSystem = new SoundSystem({
      sfxVolume: 1.0,
      musicVolume: 0.7,
      sfxEnabled: true,
      musicEnabled: true
    });

    // Game-specific systems
    this.gridSystem = new GridSystem({
      rows: config.initialRows || 4,
      cols: config.gridCols || 9,
      minValue: 1,
      maxValue: 9
    });

    this.matchSystem = new MatchSystem({
      matchRules: {
        sameValue: true,
        sumTarget: 10,
        allowSumMatches: true
      }
    });

    this.connectionValidator = new ConnectionValidator({
      gridCols: config.gridCols || 9
    });
  }

  /**
   * Setup integrations between systems
   */
  setupSystemIntegrations() {
    // Setup state machine
    this.stateMachine.addState('idle', {
      onEnter: () => this.notifyListeners('stateChanged', 'idle'),
      allowedTransitions: ['playing']
    });

    this.stateMachine.addState('playing', {
      onEnter: () => {
        this.timerSystem.start();
        this.notifyListeners('stateChanged', 'playing');
      },
      onExit: () => {
        this.timerSystem.pause();
      },
      allowedTransitions: ['paused', 'gameOver']
    });

    this.stateMachine.addState('paused', {
      onEnter: () => this.notifyListeners('stateChanged', 'paused'),
      allowedTransitions: ['playing', 'gameOver']
    });

    this.stateMachine.addState('gameOver', {
      onEnter: () => this.handleGameOver(),
      allowedTransitions: ['idle']
    });

    // Subscribe to timer events
    this.timerSystem.subscribe((event, data) => {
      if (event === 'tick') {
        this.notifyListeners('timerTick', data);
      }
    });

    // Subscribe to score events
    this.scoreSystem.subscribe((event, data) => {
      if (event === 'scoreAdded') {
        this.notifyListeners('scoreChanged', this.scoreSystem.getScore());
      }
    });
  }

  /**
   * Start the game
   */
  startGame() {
    if (this.stateMachine.is('idle')) {
      this.gridSystem.generateGrid();
      this.stateMachine.transition('playing');
      this.soundSystem.playMusic(); // Start background music
      this.notifyListeners('gameStarted', null);
    } else if (this.stateMachine.is('paused')) {
      this.stateMachine.transition('playing');
      this.soundSystem.playMusic(); // Resume music
    }
  }

  /**
   * Pause the game
   */
  pauseGame() {
    if (this.stateMachine.is('playing')) {
      this.stateMachine.transition('paused');
      this.soundSystem.pauseMusic(); // Pause music
      this.notifyListeners('gamePaused', null);
    }
  }

  /**
   * Resume the game
   */
  resumeGame() {
    if (this.stateMachine.is('paused')) {
      this.stateMachine.transition('playing');
      this.notifyListeners('gameResumed', null);
    }
  }

  /**
   * Reset the game - FIXED VERSION
   */
  resetGame() {
    // Stop timer completely first
    this.timerSystem.stop();

    // Reset all systems to initial state
    this.scoreSystem.reset();
    this.levelSystem.reset();
    this.resourceSystem.reset();
    this.matchSystem.clearAllMatches();

    // CRITICAL FIX: Reset grid to initial configuration
    this.gridSystem.rows = this.config.initialRows || 4;
    this.gridSystem.cols = this.config.gridCols || 9;
    this.gridSystem.reset();

    // Reset timer to initial duration
    this.timerSystem.reset(this.config.initialTime || 420);

    // Reset game state
    this.selectedCell = null;
    this.hintCells = [];
    this.isChangeMode = false;

    // Generate fresh grid with initial size
    this.gridSystem.generateGrid(this.config.initialRows || 4, this.config.gridCols || 9);

    // CRITICAL FIX: Force transition to idle state
    // This ensures the UI shows "Play" button instead of "Resume"
    if (!this.stateMachine.is('idle')) {
      // Force state to idle without transitions
      this.stateMachine.currentState = 'idle';
      this.stateMachine.previousState = null;
    }

    this.notifyListeners('gameReset', null);
  }

  /**
   * Handle cell press
   */
  handleCellPress(row, col) {
    if (!this.stateMachine.is('playing')) return;

    const cellValue = this.gridSystem.getCellValue(row, col);
    if (cellValue === null) return;
    if (this.matchSystem.isMatched(row, col)) return;

    // Clear hints
    this.hintCells = [];

    // Handle change mode
    if (this.isChangeMode) {
      this.notifyListeners('changeModeSelect', { row, col });
      return;
    }

    // First selection
    if (this.selectedCell === null) {
      this.selectedCell = { row, col };
      this.notifyListeners('cellSelected', { row, col });
      // Play click sound
      this.soundSystem.playSound('click');
      return;
    }

    // Second selection - try to match
    this.attemptMatch(row, col);
  }

  /**
   * Attempt to match two cells
   */
  attemptMatch(row2, col2) {
    const { row: row1, col: col1 } = this.selectedCell;

    const val1 = this.gridSystem.getCellValue(row1, col1);
    const val2 = this.gridSystem.getCellValue(row2, col2);

    // Check if values match
    if (!this.matchSystem.valuesMatch(val1, val2)) {
      this.selectedCell = null;
      this.notifyListeners('matchFailed', { row1, col1, row2, col2, reason: 'valuesMismatch' });
      // Check if stuck after failed match
      this.soundSystem.playSound('wrong');
      console.log('Match failed: Values do not match');
      setTimeout(() => {
        this.checkGameStuck();
      }, 100);
      return;
    }

    // Validate connection
    const blockedCells = this.matchSystem.getMatchedCellsSet();
    const result = this.connectionValidator.validateConnection(
      row1, col1, row2, col2,
      this.gridSystem.getGrid(),
      blockedCells
    );

    if (!result.valid) {
      this.selectedCell = null;
      this.notifyListeners('matchFailed', { row1, col1, row2, col2, reason: 'noValidPath' });
      // Check if stuck after failed match
      this.soundSystem.playSound('wrong');
      setTimeout(() => {
        this.checkGameStuck();
      }, 100);
      return;
    }

    // Valid match!
    this.processMatch(row1, col1, row2, col2, result);
  }

  /**
   * Process a successful match
   */
  processMatch(row1, col1, row2, col2, connectionResult) {
    // Play match sound
    this.soundSystem.playSound('match');

    // Add to matched cells
    this.matchSystem.addMatches([
      { row: row1, col: col1 },
      { row: row2, col: col2 }
    ]);

    // Calculate score
    const basePoints = connectionResult.points;
    const bonusPoints = this.calculateBonusPoints();
    const totalPoints = basePoints + bonusPoints;

    // Add score with level multiplier
    this.scoreSystem.addScore(totalPoints, {
      type: connectionResult.type,
      level: this.levelSystem.getLevel()
    });
    this.scoreSystem.incrementCombo();

    // Check for complete rows
    const completeRows = this.matchSystem.getCompleteRows(
      this.gridSystem.getGrid().length,
      this.gridSystem.cols
    );

    if (completeRows.length > 0) {
      this.handleCompleteRows(completeRows);
    }

    // CRITICAL: Always check for level completion after a match
    this.checkLevelCompletion();

    // Clear selection
    this.selectedCell = null;

    this.notifyListeners('matchSuccess', {
      cells: [{ row: row1, col: col1 }, { row: row2, col: col2 }],
      points: totalPoints,
      type: connectionResult.type
    });
  }

  /**
   * Calculate bonus points
   */
  calculateBonusPoints() {
    const combo = this.scoreSystem.getCombo();
    return combo > 5 ? Math.floor(combo / 5) * 5 : 0;
  }

  /**
   * Handle complete rows
   */
  handleCompleteRows(completeRows) {
    // Remove rows from grid
    this.gridSystem.removeRows(completeRows);

    // Update matched cells
    this.matchSystem.updateAfterRowRemoval(completeRows);

    // Bonus points for row completion
    const bonusPoints = completeRows.length * 10;
    this.scoreSystem.addScore(bonusPoints, { type: 'rowBonus' });

    this.notifyListeners('rowsCompleted', {
      rows: completeRows,
      bonus: bonusPoints
    });

    // CRITICAL FIX: Check level completion after removing rows
    // This handles the case where removing complete rows leaves no playable cells
    this.checkLevelCompletion();
  }

  /**
   * Check if level is complete
   */
  checkLevelCompletion() {
    // Count cells that are not matched
    const grid = this.gridSystem.getGrid();
    let unmatchedCount = 0;

    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        const val = grid[r][c];
        if (val !== null && !this.matchSystem.isMatched(r, c)) {
          unmatchedCount++;
        }
      }
    }

    console.log(`Level completion check: unmatched cells = ${unmatchedCount}, grid length = ${grid.length}`);

    // Level is complete when all non-null cells are matched
    // OR when there are no rows left
    if (unmatchedCount === 0 || grid.length === 0) {
      console.log('Level complete! Moving to next level...');
      this.completeLevel();
      return;
    }

    // CRITICAL: Check if game is stuck (no valid moves and no resources)
    this.checkGameStuck();
  }

  /**
   * Check if game is stuck (no valid moves and no resources to continue)
   */
  checkGameStuck() {
    // Check if player has any resources left
    const hasAddMoves = this.resourceSystem.canUse('addMoves', 1);
    const hasHints = this.resourceSystem.canUse('hints', 1);
    const hasChanges = this.resourceSystem.canUse('changes', 1);

    // If player has resources, they can still continue
    if (hasAddMoves || hasChanges) {
      console.log('Player has resources to continue (Add or Change available)');
      return;
    }

    // Check if there are any valid moves available
    const hasValidMoves = this.connectionValidator.hasValidMoves(
      this.gridSystem.getGrid(),
      this.matchSystem.getMatchedCellsSet(),
      this.matchSystem
    );

    console.log(`Game stuck check: hasValidMoves=${hasValidMoves}, hasAddMoves=${hasAddMoves}, hasChanges=${hasChanges}`);

    // If no valid moves and no useful resources, game is stuck
    if (!hasValidMoves) {
      console.log('No valid moves available and no resources to continue - GAME OVER');
      // Transition to game over
      setTimeout(() => {
        if (this.stateMachine.is('playing')) {
          this.stateMachine.transition('gameOver');
        }
      }, 500); // Small delay to show the final state
    }
  }

  /**
   * Complete current level
   */
  completeLevel() {
    console.log('===== LEVEL COMPLETE =====');
    console.log('Current level:', this.levelSystem.getLevel());

    // Add experience - this will trigger level up
    const expNeeded = this.levelSystem.expRequired - this.levelSystem.currentExp;
    console.log('Adding experience:', Math.max(100, expNeeded));
    this.levelSystem.addExperience(Math.max(100, expNeeded));

    // Reset resources to full
    this.resourceSystem.set('addMoves', 5);
    this.resourceSystem.set('hints', 5);
    this.resourceSystem.set('changes', 5);

    console.log('New level:', this.levelSystem.getLevel());
    console.log('===========================');

    this.notifyListeners('levelComplete', {
      level: this.levelSystem.getLevel()
    });
  }

  /**
   * Handle level up
   */
  handleLevelUp(newLevel) {
    console.log(`===== HANDLING LEVEL UP TO ${newLevel} =====`);
    this.soundSystem.playSound('levelup');
    // Generate new grid with more rows
    const newRows = 4 + (newLevel - 1);
    console.log(`Generating new grid with ${newRows} rows`);

    this.gridSystem.rows = newRows;
    this.gridSystem.generateGrid(newRows, this.gridSystem.cols);

    // Reset matches
    this.matchSystem.clearAllMatches();

    // Update timer
    const newTime = Math.max(120, 420 - (newLevel - 1) * 30);
    console.log(`Setting timer to ${newTime} seconds`);
    this.timerSystem.reset(newTime);

    // Resume playing if game was playing
    if (this.stateMachine.is('playing')) {
      console.log('Resuming timer');
      this.timerSystem.start();
    }

    console.log(`Level up complete. Grid has ${this.gridSystem.getGrid().length} rows`);
    console.log('==========================================');

    this.notifyListeners('levelUp', { level: newLevel });
  }

  /**
   * Handle time up
   */
  handleTimeUp() {
    this.stateMachine.transition('gameOver');
  }

  /**
   * Handle game over
   */
  handleGameOver() {
    this.soundSystem.stopMusic();
    this.soundSystem.playSound('gameover');
    this.notifyListeners('gameOver', {
      score: this.scoreSystem.getScore(),
      level: this.levelSystem.getLevel(),
      highScore: this.scoreSystem.getHighScore()
    });
  }

  /**
   * Use add moves action
   */
  useAddMoves() {
    if (!this.resourceSystem.canUse('addMoves', 1)) {
      console.log('No add moves left');
      this.notifyListeners('actionFailed', { action: 'add', reason: 'noResources' });
      return false;
    }

    // Play click sound
    this.soundSystem.playSound('click');

    // Get current active (non-null, non-matched) cells
    const activeCells = this.gridSystem.getActiveCells().filter(
      cell => !this.matchSystem.isMatched(cell.row, cell.col)
    );

    // Get existing values for smart generation
    const existingValues = activeCells.map(cell => cell.value);

    // Add count equals current playable cells count
    const addCount = activeCells.length;

    if (addCount === 0) {
      console.log('No active cells to match count with');
      this.notifyListeners('actionFailed', { action: 'add', reason: 'noActiveCells' });
      return false;
    }

    console.log(`Active cells: ${activeCells.length}, will add ${addCount} new values at the end`);

    const grid = this.gridSystem.getGrid();
    const availableCells = [];

    // Find the last row with any non-null, non-matched values
    let lastActiveRow = -1;
    for (let r = grid.length - 1; r >= 0; r--) {
      for (let c = 0; c < this.gridSystem.cols; c++) {
        const val = this.gridSystem.getCellValue(r, c);
        if (val !== null && !this.matchSystem.isMatched(r, c)) {
          lastActiveRow = r;
          break;
        }
      }
      if (lastActiveRow !== -1) break;
    }

    // Collect all empty/matched cells from the last active row onwards
    for (let r = lastActiveRow; r < grid.length; r++) {
      for (let c = 0; c < this.gridSystem.cols; c++) {
        const val = this.gridSystem.getCellValue(r, c);

        if (val === null) {
          availableCells.push({ row: r, col: c });
        }
      }
    }

    // If not enough space, add new rows
    while (availableCells.length < addCount) {
      const newRow = [];
      for (let c = 0; c < this.gridSystem.cols; c++) {
        newRow.push(null);
      }
      this.gridSystem.addRow(newRow);

      const newRowIndex = this.gridSystem.getGrid().length - 1;
      for (let c = 0; c < this.gridSystem.cols; c++) {
        availableCells.push({ row: newRowIndex, col: c });
      }

      console.log('Added new row at the end');
    }

    // Sort available cells by row then column
    availableCells.sort((a, b) => {
      if (a.row !== b.row) return a.row - b.row;
      return a.col - b.col;
    });

    // Add new values sequentially
    let addedCount = 0;
    for (let i = 0; i < addCount && i < availableCells.length; i++) {
      const cell = availableCells[i];
      let newValue;

      // Smart value generation based on existing values
      const random = Math.random();
      if (existingValues.length > 0 && random < 0.6) {
        if (random < 0.35) {
          newValue = existingValues[Math.floor(Math.random() * existingValues.length)];
        } else {
          const baseValue = existingValues[Math.floor(Math.random() * existingValues.length)];
          newValue = 10 - baseValue;
          if (newValue < 1 || newValue > 9) {
            newValue = Math.floor(Math.random() * 9) + 1;
          }
        }
      } else {
        newValue = Math.floor(Math.random() * 9) + 1;
      }

      this.gridSystem.setCellValue(cell.row, cell.col, newValue);

      if (this.matchSystem.isMatched(cell.row, cell.col)) {
        this.matchSystem.removeMatch(cell.row, cell.col);
      }

      addedCount++;
    }

    this.resourceSystem.use('addMoves', 1);

    console.log(`Added ${addedCount} new values at the end of the grid`);

    this.notifyListeners('addMovesUsed', {
      addedCount,
      totalActive: this.gridSystem.countActiveCells()
    });

    // CRITICAL: Check if game is still stuck after adding moves
    setTimeout(() => {
      this.checkGameStuck();
    }, 100);

    return true;
  }

  /**
   * Use hint action
   */
  useHint() {
    if (!this.resourceSystem.canUse('hints', 1)) {
      this.notifyListeners('actionFailed', { action: 'hint', reason: 'noResources' });
      return false;
    }

    // Play click sound
    this.soundSystem.playSound('click');

    const activeCells = this.gridSystem.getActiveCells().filter(
      cell => !this.matchSystem.isMatched(cell.row, cell.col)
    );

    // Find first valid match
    for (let i = 0; i < activeCells.length; i++) {
      const cell1 = activeCells[i];

      const connections = this.connectionValidator.findValidConnections(
        cell1.row, cell1.col,
        this.gridSystem.getGrid(),
        this.matchSystem.getMatchedCellsSet(),
        this.matchSystem
      );

      if (connections.length > 0) {
        const connection = connections[0];
        this.hintCells = [
          { row: cell1.row, col: cell1.col },
          { row: connection.row, col: connection.col }
        ];

        this.resourceSystem.use('hints', 1);
        this.notifyListeners('hintShown', { cells: this.hintCells });
        return true;
      }
    }

    this.notifyListeners('actionFailed', { action: 'hint', reason: 'noMovesAvailable' });
    return false;
  }

  /**
   * Start change mode
   */
  startChangeMode() {
    if (!this.resourceSystem.canUse('changes', 1)) {
      this.notifyListeners('actionFailed', { action: 'change', reason: 'noResources' });
      return false;
    }

    // Play click sound
    this.soundSystem.playSound('click');

    this.isChangeMode = true;
    this.notifyListeners('changeModeStarted', null);
    return true;
  }

  /**
   * Change cell value
   */
  changeCellValue(row, col, newValue) {
    this.gridSystem.setCellValue(row, col, newValue);
    this.resourceSystem.use('changes', 1);
    this.isChangeMode = false;

    this.notifyListeners('cellChanged', { row, col, newValue });

    // CRITICAL: Check if game is still stuck after changing value
    setTimeout(() => {
      this.checkGameStuck();
    }, 100);
  }

  /**
   * Cancel change mode
   */
  cancelChangeMode() {
    this.isChangeMode = false;
    this.notifyListeners('changeModeCancelled', null);
  }

  // Getters
  getScore() { return this.scoreSystem.getScore(); }
  getLevel() { return this.levelSystem.getLevel(); }
  getTimeLeft() { return this.timerSystem.getTime(); }
  getGrid() { return this.gridSystem.getGrid(); }
  getMatchedCells() { return this.matchSystem.getMatchedCells(); }
  getState() { return this.stateMachine.getState(); }
  isPlaying() { return this.stateMachine.is('playing'); }
  getResource(name) { return this.resourceSystem.get(name); }
  getHintCells() { return this.hintCells; }
  getSelectedCell() { return this.selectedCell; }
  isInChangeMode() { return this.isChangeMode; }

  /**
   * Subscribe to game events
   */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners(event, data) {
    this.listeners.forEach(listener => listener(event, data));
  }

  /**
   * Serialize game state for save
   */
  serialize() {
    return {
      score: this.scoreSystem.serialize(),
      timer: this.timerSystem.serialize(),
      level: this.levelSystem.serialize(),
      resources: this.resourceSystem.serialize(),
      state: this.stateMachine.serialize(),
      grid: this.gridSystem.serialize(),
      matches: this.matchSystem.serialize()
    };
  }

  /**
   * Deserialize game state from save
   */
  deserialize(data) {
    this.scoreSystem.deserialize(data.score);
    this.timerSystem.deserialize(data.timer);
    this.levelSystem.deserialize(data.level);
    this.resourceSystem.deserialize(data.resources);
    this.stateMachine.deserialize(data.state);
    this.gridSystem.deserialize(data.grid);
    this.matchSystem.deserialize(data.matches);
  }
}