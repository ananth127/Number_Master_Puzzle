/**
 * Universal Score System - Can be used in ANY game
 * Features: Points, Multipliers, Combos, History, Streaks
 */
export class ScoreSystem {
  constructor(config = {}) {
    this.score = config.initialScore || 0;
    this.highScore = config.highScore || 0;
    this.multiplier = config.initialMultiplier || 1;
    this.baseMultiplier = config.baseMultiplier || 1;
    this.combo = 0;
    this.maxCombo = 0;
    this.streak = 0;
    this.scoreHistory = [];
    this.listeners = new Set();
    this.lastScoreTime = null;
  }

  /**
   * Add points with optional metadata
   * @param {number} points - Base points to add
   * @param {object} metadata - Additional data (type, source, etc.)
   * @returns {number} - Actual points added after multiplier
   */
  addScore(points, metadata = {}) {
    const multipliedPoints = Math.floor(points * this.multiplier);
    this.score += multipliedPoints;
    
    // Update high score
    if (this.score > this.highScore) {
      this.highScore = this.score;
    }

    // Track score history
    const entry = {
      points: multipliedPoints,
      rawPoints: points,
      multiplier: this.multiplier,
      timestamp: Date.now(),
      ...metadata
    };
    
    this.scoreHistory.push(entry);
    this.lastScoreTime = Date.now();
    
    this.notifyListeners('scoreAdded', entry);
    return multipliedPoints;
  }

  /**
   * Set score multiplier
   */
  setMultiplier(value) {
    this.multiplier = Math.max(this.baseMultiplier, value);
    this.notifyListeners('multiplierChanged', this.multiplier);
  }

  /**
   * Increment combo counter
   */
  incrementCombo() {
    this.combo++;
    if (this.combo > this.maxCombo) {
      this.maxCombo = this.combo;
    }
    
    // Auto-increase multiplier based on combo
    if (this.combo > 0 && this.combo % 5 === 0) {
      this.setMultiplier(this.multiplier + 0.5);
    }
    
    this.notifyListeners('comboChanged', this.combo);
  }

  /**
   * Reset combo counter
   */
  resetCombo() {
    const previousCombo = this.combo;
    this.combo = 0;
    this.setMultiplier(this.baseMultiplier);
    this.notifyListeners('comboReset', previousCombo);
  }

  /**
   * Increment streak counter
   */
  incrementStreak() {
    this.streak++;
    this.notifyListeners('streakChanged', this.streak);
  }

  /**
   * Reset streak counter
   */
  resetStreak() {
    this.streak = 0;
    this.notifyListeners('streakReset', null);
  }

  // Getters
  getScore() { return this.score; }
  getHighScore() { return this.highScore; }
  getMultiplier() { return this.multiplier; }
  getCombo() { return this.combo; }
  getMaxCombo() { return this.maxCombo; }
  getStreak() { return this.streak; }
  getScoreHistory() { return [...this.scoreHistory]; }
  getLastScoreTime() { return this.lastScoreTime; }

  /**
   * Calculate points per second
   */
  getPointsPerSecond() {
    if (this.scoreHistory.length < 2) return 0;
    
    const now = Date.now();
    const recentScores = this.scoreHistory.filter(
      entry => now - entry.timestamp < 60000 // Last minute
    );
    
    if (recentScores.length === 0) return 0;
    
    const totalPoints = recentScores.reduce((sum, entry) => sum + entry.points, 0);
    const timeSpan = (now - recentScores[0].timestamp) / 1000;
    
    return timeSpan > 0 ? totalPoints / timeSpan : 0;
  }

  /**
   * Subscribe to score events
   */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners(event, data) {
    this.listeners.forEach(listener => listener(event, data));
  }

  /**
   * Reset all score data
   */
  reset() {
    this.score = 0;
    this.multiplier = this.baseMultiplier;
    this.combo = 0;
    this.streak = 0;
    this.scoreHistory = [];
    this.lastScoreTime = null;
    this.notifyListeners('reset', null);
  }

  /**
   * Serialize for save/load
   */
  serialize() {
    return {
      score: this.score,
      highScore: this.highScore,
      multiplier: this.multiplier,
      combo: this.combo,
      maxCombo: this.maxCombo,
      streak: this.streak,
      history: this.scoreHistory
    };
  }

  /**
   * Deserialize from saved data
   */
  deserialize(data) {
    this.score = data.score || 0;
    this.highScore = data.highScore || 0;
    this.multiplier = data.multiplier || this.baseMultiplier;
    this.combo = data.combo || 0;
    this.maxCombo = data.maxCombo || 0;
    this.streak = data.streak || 0;
    this.scoreHistory = data.history || [];
  }
}