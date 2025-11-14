// ============================================================================
// FILE: src/core/ResourceSystem.js
// ============================================================================

/**
 * Universal Resource System
 * Manages any game resource: lives, energy, moves, items, currency, etc.
 * Features: Min/Max limits, regeneration, costs, transactions
 */
export class ResourceSystem {
  constructor(config = {}) {
    this.resources = new Map();
    this.listeners = new Set();
    this.transactions = [];
    
    // Initialize resources from config
    if (config.resources) {
      Object.entries(config.resources).forEach(([name, resourceConfig]) => {
        this.addResource(name, resourceConfig);
      });
    }
  }

  /**
   * Add a new resource type
   */
  addResource(name, config = {}) {
    const resource = {
      name,
      current: config.initial !== undefined ? config.initial : 0,
      max: config.max !== undefined ? config.max : Infinity,
      min: config.min !== undefined ? config.min : 0,
      regenerationRate: config.regen || 0,
      regenerationInterval: null,
      regenerationDelay: config.regenDelay || 0,
      lastUsed: null,
      metadata: config.metadata || {}
    };

    this.resources.set(name, resource);

    // Start auto-regeneration if configured
    if (config.regen && config.regenInterval) {
      this.startRegeneration(name, config.regenInterval);
    }

    this.notifyListeners('resourceAdded', { name, resource });
  }

  /**
   * Use/consume a resource
   */
  use(resourceName, amount = 1) {
    const resource = this.resources.get(resourceName);
    if (!resource) {
      console.warn(`Resource '${resourceName}' does not exist`);
      return false;
    }

    // Check if we have enough to use
    if (resource.current >= amount) {
      resource.current -= amount;
      resource.lastUsed = Date.now();
      
      this.recordTransaction(resourceName, -amount, 'use');
      this.notifyListeners('resourceUsed', {
        name: resourceName,
        amount,
        current: resource.current
      });
      
      return true;
    }
    
    return false;
  }

  /**
   * Add to a resource
   */
  add(resourceName, amount = 1) {
    const resource = this.resources.get(resourceName);
    if (!resource) {
      console.warn(`Resource '${resourceName}' does not exist`);
      return false;
    }

    const previousAmount = resource.current;
    resource.current = Math.min(resource.current + amount, resource.max);
    const actualAdded = resource.current - previousAmount;
    
    if (actualAdded > 0) {
      this.recordTransaction(resourceName, actualAdded, 'add');
      this.notifyListeners('resourceAdded', {
        name: resourceName,
        amount: actualAdded,
        current: resource.current
      });
    }
    
    return true;
  }

  /**
   * Set resource to specific value
   */
  set(resourceName, value) {
    const resource = this.resources.get(resourceName);
    if (!resource) {
      console.warn(`Resource '${resourceName}' does not exist`);
      return false;
    }

    const oldValue = resource.current;
    resource.current = Math.max(resource.min, Math.min(value, resource.max));
    
    this.recordTransaction(resourceName, resource.current - oldValue, 'set');
    this.notifyListeners('resourceSet', {
      name: resourceName,
      oldValue,
      newValue: resource.current
    });
    
    return true;
  }

  /**
   * Get current amount of resource
   */
  get(resourceName) {
    const resource = this.resources.get(resourceName);
    return resource ? resource.current : null;
  }

  /**
   * Get max amount of resource
   */
  getMax(resourceName) {
    const resource = this.resources.get(resourceName);
    return resource ? resource.max : null;
  }

  /**
   * Get min amount of resource
   */
  getMin(resourceName) {
    const resource = this.resources.get(resourceName);
    return resource ? resource.min : null;
  }

  /**
   * Check if resource can be used
   */
  canUse(resourceName, amount = 1) {
    const resource = this.resources.get(resourceName);
    return resource && resource.current >= amount;
  }

  /**
   * Check if resource is at max
   */
  isFull(resourceName) {
    const resource = this.resources.get(resourceName);
    return resource && resource.current >= resource.max;
  }

  /**
   * Check if resource is depleted
   */
  isEmpty(resourceName) {
    const resource = this.resources.get(resourceName);
    return resource && resource.current <= resource.min;
  }

  /**
   * Get resource as percentage (0-100)
   */
  getPercentage(resourceName) {
    const resource = this.resources.get(resourceName);
    if (!resource) return 0;
    
    const range = resource.max - resource.min;
    if (range === 0) return 100;
    
    return ((resource.current - resource.min) / range) * 100;
  }

  /**
   * Start automatic regeneration
   */
  startRegeneration(resourceName, intervalMs) {
    const resource = this.resources.get(resourceName);
    if (!resource || resource.regenerationRate <= 0) return;

    // Clear existing interval
    if (resource.regenerationInterval) {
      clearInterval(resource.regenerationInterval);
    }

    resource.regenerationInterval = setInterval(() => {
      // Check regeneration delay
      if (resource.regenerationDelay > 0 && resource.lastUsed) {
        const timeSinceUse = Date.now() - resource.lastUsed;
        if (timeSinceUse < resource.regenerationDelay) {
          return; // Still in delay period
        }
      }

      // Regenerate if not at max
      if (resource.current < resource.max) {
        this.add(resourceName, resource.regenerationRate);
      }
    }, intervalMs);
  }

  /**
   * Stop automatic regeneration
   */
  stopRegeneration(resourceName) {
    const resource = this.resources.get(resourceName);
    if (resource && resource.regenerationInterval) {
      clearInterval(resource.regenerationInterval);
      resource.regenerationInterval = null;
    }
  }

  /**
   * Set max value for resource
   */
  setMax(resourceName, newMax) {
    const resource = this.resources.get(resourceName);
    if (!resource) return false;

    resource.max = newMax;
    resource.current = Math.min(resource.current, newMax);
    
    this.notifyListeners('resourceMaxChanged', {
      name: resourceName,
      max: newMax
    });
    
    return true;
  }

  /**
   * Record transaction history
   */
  recordTransaction(resourceName, amount, type) {
    this.transactions.push({
      resourceName,
      amount,
      type,
      timestamp: Date.now()
    });

    // Keep only last 100 transactions
    if (this.transactions.length > 100) {
      this.transactions.shift();
    }
  }

  /**
   * Get transaction history
   */
  getTransactionHistory(resourceName = null, limit = 10) {
    let history = [...this.transactions];
    
    if (resourceName) {
      history = history.filter(t => t.resourceName === resourceName);
    }
    
    return history.slice(-limit);
  }

  /**
   * Get all resources as object
   */
  getAllResources() {
    const result = {};
    this.resources.forEach((resource, name) => {
      result[name] = {
        current: resource.current,
        max: resource.max,
        min: resource.min,
        percentage: this.getPercentage(name)
      };
    });
    return result;
  }

  /**
   * Subscribe to resource events
   */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners(event, data) {
    this.listeners.forEach(listener => listener(event, data));
  }

  /**
   * Reset all resources to their initial values
   */
  reset() {
    this.resources.forEach((resource, name) => {
      this.stopRegeneration(name);
      // Reset to initial value (we need to store this)
      if (resource.metadata.initialValue !== undefined) {
        resource.current = resource.metadata.initialValue;
      }
    });
    this.transactions = [];
    this.notifyListeners('reset', null);
  }

  /**
   * Serialize for save/load
   */
  serialize() {
    const data = {};
    this.resources.forEach((resource, name) => {
      data[name] = {
        current: resource.current,
        max: resource.max,
        min: resource.min,
        lastUsed: resource.lastUsed
      };
    });
    return data;
  }

  /**
   * Deserialize from saved data
   */
  deserialize(data) {
    Object.entries(data).forEach(([name, resourceData]) => {
      if (this.resources.has(name)) {
        const resource = this.resources.get(name);
        resource.current = resourceData.current;
        resource.max = resourceData.max;
        resource.min = resourceData.min;
        resource.lastUsed = resourceData.lastUsed;
      }
    });
  }
}