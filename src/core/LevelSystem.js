// ============================================================================
// FILE: src/core/LevelSystem.js
// ============================================================================

/**
 * Universal Level System
 * Manages player level, experience, and progression
 * Features: XP curves, level caps, prestige, skill points
 */
export class LevelSystem {
  constructor(config = {}) {
    this.level = config.startLevel || 1;
    this.currentExp = 0;
    this.expRequired = config.baseExpRequired || 100;
    this.baseExpRequired = config.baseExpRequired || 100;
    this.maxLevel = config.maxLevel || Infinity;
    this.expCurveType = config.expCurveType || 'linear'; // linear, exponential, logarithmic
    this.expCurveMultiplier = config.expCurveMultiplier || 1.5;
    this.listeners = new Set();
    this.levelHistory = [];
    this.onLevelUp = config.onLevelUp || (() => {});
    
    console.log('LevelSystem initialized:', {
      startLevel: this.level,
      baseExpRequired: this.baseExpRequired,
      expCurveType: this.expCurveType
    });
  }

  /**
   * Add experience points
   */
  addExperience(exp) {
    console.log(`Adding ${exp} exp. Current: ${this.currentExp}/${this.expRequired}`);
    
    if (this.level >= this.maxLevel) {
      console.log('Max level reached');
      return false;
    }

    this.currentExp += exp;
    
    // Check for level ups (can level up multiple times)
    while (this.currentExp >= this.expRequired && this.level < this.maxLevel) {
      this.levelUp();
    }

    this.notifyListeners('expAdded', {
      exp,
      currentExp: this.currentExp,
      expRequired: this.expRequired,
      level: this.level
    });

    return true;
  }

  /**
   * Level up
   */
  levelUp() {
    const previousLevel = this.level;
    this.level++;
    
    // Carry over excess experience
    this.currentExp -= this.expRequired;
    
    // Calculate new exp requirement
    this.expRequired = this.calculateExpRequired(this.level);
    
    // Record level up
    this.levelHistory.push({
      level: this.level,
      timestamp: Date.now()
    });

    console.log(`LEVEL UP! ${previousLevel} → ${this.level}`);
    console.log(`New exp required: ${this.expRequired}, Carried over: ${this.currentExp}`);

    // Call callback
    this.onLevelUp(this.level);

    this.notifyListeners('levelUp', {
      previousLevel,
      newLevel: this.level,
      expRequired: this.expRequired
    });

    return true;
  }

  /**
   * Calculate experience required for a level
   */
  calculateExpRequired(level) {
    let required;

    switch (this.expCurveType) {
      case 'linear':
        required = this.baseExpRequired * level;
        break;

      case 'exponential':
        required = Math.floor(
          this.baseExpRequired * Math.pow(this.expCurveMultiplier, level - 1)
        );
        break;

      case 'logarithmic':
        required = Math.floor(
          this.baseExpRequired * Math.log(level + 1) * 10
        );
        break;

      case 'custom':
        // Custom formula: baseExp + (level * level * 50)
        required = this.baseExpRequired + (level * level * 50);
        break;

      default:
        required = this.baseExpRequired * level;
    }

    console.log(`Exp required for level ${level}: ${required} (curve: ${this.expCurveType})`);
    return Math.max(required, this.baseExpRequired);
  }

  /**
   * Set experience directly
   */
  setExperience(exp) {
    this.currentExp = Math.max(0, exp);
    
    // Check for level ups
    while (this.currentExp >= this.expRequired && this.level < this.maxLevel) {
      this.levelUp();
    }

    this.notifyListeners('expSet', {
      currentExp: this.currentExp,
      expRequired: this.expRequired
    });
  }

  /**
   * Set level directly
   */
  setLevel(level) {
    if (level < 1 || level > this.maxLevel) {
      console.warn(`Invalid level: ${level}`);
      return false;
    }

    const previousLevel = this.level;
    this.level = level;
    this.currentExp = 0;
    this.expRequired = this.calculateExpRequired(level);

    this.notifyListeners('levelSet', {
      previousLevel,
      newLevel: level
    });

    return true;
  }

  /**
   * Get experience progress as percentage
   */
  getProgressPercentage() {
    return (this.currentExp / this.expRequired) * 100;
  }

  /**
   * Get experience needed for next level
   */
  getExpToNextLevel() {
    return this.expRequired - this.currentExp;
  }

  /**
   * Check if at max level
   */
  isMaxLevel() {
    return this.level >= this.maxLevel;
  }

  // Getters
  getLevel() { return this.level; }
  getCurrentExp() { return this.currentExp; }
  getExpRequired() { return this.expRequired; }
  getLevelHistory() { return [...this.levelHistory]; }

  /**
   * Subscribe to level events
   */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners(event, data) {
    this.listeners.forEach(listener => listener(event, data));
  }

  /**
   * Reset level system
   */
  reset() {
    console.log('Resetting LevelSystem to level 1');
    this.level = 1;
    this.currentExp = 0;
    this.expRequired = this.baseExpRequired;
    this.levelHistory = [];
    this.notifyListeners('reset', null);
  }

  /**
   * Serialize for save/load
   */
  serialize() {
    return {
      level: this.level,
      currentExp: this.currentExp,
      expRequired: this.expRequired,
      levelHistory: this.levelHistory
    };
  }

  /**
   * Deserialize from saved data
   */
  deserialize(data) {
    this.level = data.level || 1;
    this.currentExp = data.currentExp || 0;
    this.expRequired = data.expRequired || this.calculateExpRequired(this.level);
    this.levelHistory = data.levelHistory || [];
  }
}