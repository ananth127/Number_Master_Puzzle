
// ============================================================================
// FILE: src/core/TimerSystem.js
// ============================================================================

/**
 * Universal Timer System - Works for any game type
 * Supports: Countdown, Countup, Stopwatch modes
 */
export class TimerSystem {
  constructor(config = {}) {
    this.duration = config.duration || 60;
    this.currentTime = config.startTime !== undefined ? config.startTime : this.duration;
    this.isRunning = false;
    this.isPaused = false;
    this.mode = config.mode || 'countdown'; // 'countdown', 'countup', 'stopwatch'
    this.intervalId = null;
    this.listeners = new Set();
    this.onComplete = config.onComplete || null;
    this.tickRate = config.tickRate || 1000; // milliseconds
    this.elapsedTime = 0;
  }

  /**
   * Start the timer
   */
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.isPaused = false;
    
    this.intervalId = setInterval(() => {
      this.tick();
    }, this.tickRate);
    
    this.notifyListeners('started', this.currentTime);
  }

  /**
   * Pause the timer
   */
  pause() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    this.isPaused = true;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    this.notifyListeners('paused', this.currentTime);
  }

  /**
   * Resume from pause
   */
  resume() {
    if (this.isRunning || !this.isPaused) return;
    this.start();
  }

  /**
   * Stop the timer completely
   */
  stop() {
    this.pause();
    this.notifyListeners('stopped', this.currentTime);
  }

  /**
   * Reset the timer
   */
  reset(newDuration) {
    this.stop();
    
    if (newDuration !== undefined) {
      this.duration = newDuration;
    }
    
    this.currentTime = this.mode === 'countdown' ? this.duration : 0;
    this.elapsedTime = 0;
    this.isPaused = false;
    
    this.notifyListeners('reset', this.currentTime);
  }

  /**
   * Internal tick function
   */
  tick() {
    if (this.mode === 'countdown') {
      this.currentTime--;
      this.elapsedTime++;
      
      if (this.currentTime <= 0) {
        this.currentTime = 0;
        this.stop();
        if (this.onComplete) {
          this.onComplete();
        }
        this.notifyListeners('complete', null);
      }
    } else {
      this.currentTime++;
      this.elapsedTime++;
    }
    
    this.notifyListeners('tick', this.currentTime);
  }

  /**
   * Add time to the timer
   */
  addTime(seconds) {
    this.currentTime += seconds;
    this.notifyListeners('timeAdded', seconds);
  }

  /**
   * Subtract time from the timer
   */
  subtractTime(seconds) {
    this.currentTime = Math.max(0, this.currentTime - seconds);
    this.notifyListeners('timeSubtracted', seconds);
  }

  // Getters
  getTime() { return this.currentTime; }
  getDuration() { return this.duration; }
  getElapsedTime() { return this.elapsedTime; }
  isActive() { return this.isRunning; }
  getPaused() { return this.isPaused; }
  getMode() { return this.mode; }

  /**
   * Get percentage of time remaining (for countdown)
   */
  getPercentage() {
    if (this.mode === 'countdown') {
      return (this.currentTime / this.duration) * 100;
    }
    return 0;
  }

  /**
   * Format time as MM:SS
   */
  format() {
    const mins = Math.floor(Math.abs(this.currentTime) / 60);
    const secs = Math.abs(this.currentTime) % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Format time as HH:MM:SS
   */
  formatLong() {
    const hours = Math.floor(Math.abs(this.currentTime) / 3600);
    const mins = Math.floor((Math.abs(this.currentTime) % 3600) / 60);
    const secs = Math.abs(this.currentTime) % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Subscribe to timer events
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
      duration: this.duration,
      currentTime: this.currentTime,
      elapsedTime: this.elapsedTime,
      mode: this.mode,
      isRunning: this.isRunning,
      isPaused: this.isPaused
    };
  }

  /**
   * Deserialize from saved data
   */
  deserialize(data) {
    this.duration = data.duration || 60;
    this.currentTime = data.currentTime || this.duration;
    this.elapsedTime = data.elapsedTime || 0;
    this.mode = data.mode || 'countdown';
    // Don't restore running state - user must manually start
  }
}