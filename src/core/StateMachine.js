
// ============================================================================
// FILE: src/core/StateMachine.js
// ============================================================================

/**
 * Universal State Machine
 * Manages game states with transitions and validation
 * Perfect for: Game flow, UI states, AI behavior
 */
export class StateMachine {
  constructor(initialState = 'idle', config = {}) {
    this.currentState = initialState;
    this.previousState = null;
    this.stateHistory = [initialState];
    this.states = new Map();
    this.transitions = new Map();
    this.listeners = new Set();
    this.context = config.context || {};
    this.maxHistorySize = config.maxHistorySize || 10;
  }

  /**
   * Add a state with lifecycle hooks
   */
  addState(name, config = {}) {
    this.states.set(name, {
      name,
      onEnter: config.onEnter || (() => {}),
      onExit: config.onExit || (() => {}),
      onUpdate: config.onUpdate || (() => {}),
      allowedTransitions: config.allowedTransitions || [],
      metadata: config.metadata || {}
    });
  }

  /**
   * Add allowed transition between states
   */
  addTransition(fromState, toState, condition = null) {
    const key = `${fromState}->${toState}`;
    this.transitions.set(key, {
      from: fromState,
      to: toState,
      condition: condition || (() => true)
    });

    // Also add to state's allowed transitions
    const state = this.states.get(fromState);
    if (state && !state.allowedTransitions.includes(toState)) {
      state.allowedTransitions.push(toState);
    }
  }

  /**
   * Check if transition is valid
   */
  canTransition(toState) {
    // Check if target state exists
    if (!this.states.has(toState)) {
      return false;
    }

    // Check if transition is defined
    const key = `${this.currentState}->${toState}`;
    const transition = this.transitions.get(key);

    if (transition) {
      // Check condition if exists
      return transition.condition(this.context);
    }

    // Check if in allowed transitions
    const currentStateConfig = this.states.get(this.currentState);
    if (currentStateConfig && currentStateConfig.allowedTransitions.length > 0) {
      return currentStateConfig.allowedTransitions.includes(toState);
    }

    // Allow if no restrictions defined
    return true;
  }

  /**
   * Transition to new state
   */
  transition(toState, transitionData = {}) {
    if (!this.states.has(toState)) {
      console.warn(`State '${toState}' does not exist`);
      return false;
    }

    if (!this.canTransition(toState)) {
      console.warn(`Cannot transition from '${this.currentState}' to '${toState}'`);
      this.notifyListeners('transitionDenied', {
        from: this.currentState,
        to: toState,
        reason: 'Invalid transition'
      });
      return false;
    }

    // Execute exit hook for current state
    const currentStateConfig = this.states.get(this.currentState);
    if (currentStateConfig) {
      currentStateConfig.onExit(this.context, transitionData);
    }

    // Update state
    this.previousState = this.currentState;
    this.currentState = toState;

    // Update history
    this.stateHistory.push(toState);
    if (this.stateHistory.length > this.maxHistorySize) {
      this.stateHistory.shift();
    }

    // Execute enter hook for new state
    const nextStateConfig = this.states.get(toState);
    if (nextStateConfig) {
      nextStateConfig.onEnter(this.context, transitionData);
    }

    this.notifyListeners('stateChanged', {
      from: this.previousState,
      to: this.currentState,
      data: transitionData
    });

    return true;
  }

  /**
   * Go back to previous state
   */
  goBack() {
    if (this.previousState) {
      return this.transition(this.previousState);
    }
    return false;
  }

  /**
   * Update current state (useful for AI or game loop)
   */
  update(deltaTime) {
    const stateConfig = this.states.get(this.currentState);
    if (stateConfig && stateConfig.onUpdate) {
      stateConfig.onUpdate(this.context, deltaTime);
    }
  }

  // State checks
  getState() { return this.currentState; }
  getPreviousState() { return this.previousState; }
  getStateHistory() { return [...this.stateHistory]; }
  
  is(state) { return this.currentState === state; }
  isNot(state) { return this.currentState !== state; }
  wasIn(state) { return this.stateHistory.includes(state); }

  /**
   * Get all possible next states from current state
   */
  getPossibleTransitions() {
    const currentStateConfig = this.states.get(this.currentState);
    if (!currentStateConfig) return [];

    return currentStateConfig.allowedTransitions.filter(state => 
      this.canTransition(state)
    );
  }

  /**
   * Set context data
   */
  setContext(key, value) {
    this.context[key] = value;
  }

  /**
   * Get context data
   */
  getContext(key) {
    return this.context[key];
  }

  /**
   * Subscribe to state events
   */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners(event, data) {
    this.listeners.forEach(listener => listener(event, data));
  }

  /**
   * Reset to initial state
   */
  reset(initialState = null) {
    const targetState = initialState || this.stateHistory[0] || 'idle';
    this.currentState = targetState;
    this.previousState = null;
    this.stateHistory = [targetState];
    this.notifyListeners('reset', { state: targetState });
  }

  /**
   * Serialize for save/load
   */
  serialize() {
    return {
      currentState: this.currentState,
      previousState: this.previousState,
      history: this.stateHistory,
      context: this.context
    };
  }

  /**
   * Deserialize from saved data
   */
  deserialize(data) {
    this.currentState = data.currentState;
    this.previousState = data.previousState;
    this.stateHistory = data.history || [this.currentState];
    this.context = data.context || {};
  }
}


// ============================================================================
// Continue in next message...
// ============================================================================