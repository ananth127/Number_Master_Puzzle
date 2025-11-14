// ============================================================================
// FILE: src/core/AchievementSystem.js
// ============================================================================

/**
 * Universal Achievement System
 * Tracks achievements, progress, rewards
 * Works for any game type
 */
export class AchievementSystem {
  constructor(config = {}) {
    this.achievements = new Map();
    this.unlockedAchievements = new Set();
    this.achievementProgress = new Map();
    this.listeners = new Set();
    this.categories = new Map();
    this.totalPoints = 0;
  }

  /**
   * Add an achievement
   */
  addAchievement(id, config) {
    const achievement = {
      id,
      title: config.title,
      description: config.description,
      icon: config.icon || '🏆',
      points: config.points || 10,
      category: config.category || 'general',
      
      // Condition can be a function or progress-based
      condition: config.condition, // (gameState) => boolean
      progressMax: config.progressMax || null, // For progress-based achievements
      progressCurrent: 0,
      
      reward: config.reward || null, // { type: 'coins', amount: 100 }
      hidden: config.hidden || false,
      secret: config.secret || false,
      
      unlocked: false,
      unlockedAt: null,
      unlockedCount: 0, // For repeatable achievements
      
      metadata: config.metadata || {}
    };

    this.achievements.set(id, achievement);

    // Add to category
    if (!this.categories.has(achievement.category)) {
      this.categories.set(achievement.category, []);
    }
    this.categories.get(achievement.category).push(id);

    // Initialize progress if progress-based
    if (achievement.progressMax) {
      this.achievementProgress.set(id, 0);
    }

    this.notifyListeners('achievementAdded', achievement);
  }

  /**
   * Check all achievements against game state
   */
  checkAchievements(gameState) {
    this.achievements.forEach((achievement, id) => {
      if (achievement.unlocked && !achievement.metadata.repeatable) return;

      // Progress-based achievement
      if (achievement.progressMax) {
        const progress = this.calculateProgress(id, gameState);
        this.updateProgress(id, progress);
        
        if (progress >= achievement.progressMax) {
          this.unlock(id, gameState);
        }
      }
      // Condition-based achievement
      else if (achievement.condition && achievement.condition(gameState)) {
        this.unlock(id, gameState);
      }
    });
  }

  /**
   * Calculate progress for an achievement
   */
  calculateProgress(achievementId, gameState) {
    const achievement = this.achievements.get(achievementId);
    if (!achievement || !achievement.progressMax) return 0;

    // Custom progress calculator if provided
    if (achievement.metadata.progressCalculator) {
      return achievement.metadata.progressCalculator(gameState);
    }

    return achievement.progressCurrent;
  }

  /**
   * Update achievement progress
   */
  updateProgress(achievementId, progress) {
    const achievement = this.achievements.get(achievementId);
    if (!achievement || !achievement.progressMax) return;

    const oldProgress = achievement.progressCurrent;
    achievement.progressCurrent = Math.min(progress, achievement.progressMax);
    
    if (achievement.progressCurrent !== oldProgress) {
      this.notifyListeners('achievementProgress', {
        id: achievementId,
        progress: achievement.progressCurrent,
        max: achievement.progressMax,
        percentage: (achievement.progressCurrent / achievement.progressMax) * 100
      });
    }
  }

  /**
   * Increment progress for an achievement
   */
  incrementProgress(achievementId, amount = 1) {
    const achievement = this.achievements.get(achievementId);
    if (!achievement) return;

    this.updateProgress(achievementId, achievement.progressCurrent + amount);
  }

  /**
   * Unlock an achievement
   */
  unlock(achievementId, gameState = {}) {
    const achievement = this.achievements.get(achievementId);
    if (!achievement) return;

    // If already unlocked and not repeatable, ignore
    if (achievement.unlocked && !achievement.metadata.repeatable) return;

    achievement.unlocked = true;
    achievement.unlockedAt = Date.now();
    achievement.unlockedCount++;
    this.unlockedAchievements.add(achievementId);
    this.totalPoints += achievement.points;

    const unlockData = {
      achievement,
      gameState,
      timestamp: achievement.unlockedAt
    };

    this.notifyListeners('achievementUnlocked', unlockData);

    // Give reward if specified
    if (achievement.reward) {
      this.notifyListeners('achievementReward', {
        achievementId,
        reward: achievement.reward
      });
    }
  }

  /**
   * Check if achievement is unlocked
   */
  isUnlocked(achievementId) {
    return this.unlockedAchievements.has(achievementId);
  }

  /**
   * Get achievement by ID
   */
  getAchievement(achievementId) {
    return this.achievements.get(achievementId);
  }

  /**
   * Get all achievements
   */
  getAllAchievements(includeSecret = false) {
    const achievements = Array.from(this.achievements.values());
    
    if (!includeSecret) {
      return achievements.filter(a => !a.secret || a.unlocked);
    }
    
    return achievements;
  }

  /**
   * Get achievements by category
   */
  getAchievementsByCategory(category) {
    const ids = this.categories.get(category) || [];
    return ids.map(id => this.achievements.get(id)).filter(Boolean);
  }

  /**
   * Get unlocked achievements
   */
  getUnlockedAchievements() {
    return Array.from(this.unlockedAchievements)
      .map(id => this.achievements.get(id))
      .filter(Boolean);
  }

  /**
   * Get achievement completion percentage
   */
  getCompletionPercentage() {
    const total = this.achievements.size;
    const unlocked = this.unlockedAchievements.size;
    return total > 0 ? (unlocked / total) * 100 : 0;
  }

  /**
   * Get total points earned
   */
  getTotalPoints() {
    return this.totalPoints;
  }

  /**
   * Get achievement statistics
   */
  getStatistics() {
    return {
      total: this.achievements.size,
      unlocked: this.unlockedAchievements.size,
      locked: this.achievements.size - this.unlockedAchievements.size,
      points: this.totalPoints,
      completionPercentage: this.getCompletionPercentage(),
      categories: Array.from(this.categories.keys())
    };
  }

  /**
   * Subscribe to achievement events
   */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners(event, data) {
    this.listeners.forEach(listener => listener(event, data));
  }

  /**
   * Reset all achievements
   */
  reset() {
    this.achievements.forEach(achievement => {
      achievement.unlocked = false;
      achievement.unlockedAt = null;
      achievement.unlockedCount = 0;
      achievement.progressCurrent = 0;
    });
    
    this.unlockedAchievements.clear();
    this.totalPoints = 0;
    this.notifyListeners('reset', null);
  }

  /**
   * Serialize for save/load
   */
  serialize() {
    const achievementsData = {};
    
    this.achievements.forEach((achievement, id) => {
      achievementsData[id] = {
        unlocked: achievement.unlocked,
        unlockedAt: achievement.unlockedAt,
        unlockedCount: achievement.unlockedCount,
        progressCurrent: achievement.progressCurrent
      };
    });

    return {
      achievements: achievementsData,
      totalPoints: this.totalPoints
    };
  }

  /**
   * Deserialize from saved data
   */
  deserialize(data) {
    if (!data.achievements) return;

    Object.entries(data.achievements).forEach(([id, achievementData]) => {
      const achievement = this.achievements.get(id);
      if (achievement) {
        achievement.unlocked = achievementData.unlocked;
        achievement.unlockedAt = achievementData.unlockedAt;
        achievement.unlockedCount = achievementData.unlockedCount || 0;
        achievement.progressCurrent = achievementData.progressCurrent || 0;
        
        if (achievement.unlocked) {
          this.unlockedAchievements.add(id);
        }
      }
    });

    this.totalPoints = data.totalPoints || 0;
  }
}