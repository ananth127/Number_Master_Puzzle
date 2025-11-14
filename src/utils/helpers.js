// ============================================================================
// FILE: src/utils/helpers.js
// ============================================================================

import { COLORS, GAME_CONFIG } from './constants';

// ============================================================================
// FORMATTING HELPERS
// ============================================================================

/**
 * Format time in seconds to MM:SS
 */
export const formatTime = (seconds) => {
  const mins = Math.floor(Math.abs(seconds) / 60);
  const secs = Math.abs(seconds) % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Format time in seconds to HH:MM:SS
 */
export const formatTimeLong = (seconds) => {
  const hours = Math.floor(Math.abs(seconds) / 3600);
  const mins = Math.floor((Math.abs(seconds) % 3600) / 60);
  const secs = Math.abs(seconds) % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Format score with commas
 */
export const formatScore = (score) => {
  return score.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 * Format large numbers with K, M, B suffixes
 */
export const formatLargeNumber = (num) => {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

/**
 * Format percentage
 */
export const formatPercentage = (value, decimals = 1) => {
  return `${value.toFixed(decimals)}%`;
};

// ============================================================================
// CELL HELPERS
// ============================================================================

/**
 * Get cell color based on value
 */
export const getCellColor = (value, customPalette = null) => {
  const palette = customPalette || COLORS.CELL_COLORS;
  return palette[value] || COLORS.SECONDARY;
};

/**
 * Get cell key for storage
 */
export const getCellKey = (row, col) => {
  return `${row},${col}`;
};

/**
 * Parse cell key to coordinates
 */
export const parseCellKey = (key) => {
  const [row, col] = key.split(',').map(Number);
  return { row, col };
};

/**
 * Check if two cells are the same
 */
export const areCellsEqual = (cell1, cell2) => {
  return cell1.row === cell2.row && cell1.col === cell2.col;
};

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Check if value is valid cell value
 */
export const isValidCellValue = (value) => {
  return value >= GAME_CONFIG.MIN_VALUE && value <= GAME_CONFIG.MAX_VALUE;
};

/**
 * Check if position is within grid bounds
 */
export const isValidPosition = (row, col, grid) => {
  return row >= 0 && row < grid.length && 
         col >= 0 && col < (grid[row]?.length || 0);
};

/**
 * Check if two values can match
 */
export const canValuesMatch = (value1, value2, sumTarget = GAME_CONFIG.SUM_TARGET) => {
  if (value1 === null || value2 === null) return false;
  return value1 === value2 || value1 + value2 === sumTarget;
};

// ============================================================================
// CALCULATION HELPERS
// ============================================================================

/**
 * Calculate distance between two points
 */
export const calculateDistance = (r1, c1, r2, c2) => {
  return Math.sqrt(Math.pow(r2 - r1, 2) + Math.pow(c2 - c1, 2));
};

/**
 * Calculate Manhattan distance
 */
export const calculateManhattanDistance = (r1, c1, r2, c2) => {
  return Math.abs(r2 - r1) + Math.abs(c2 - c1);
};

/**
 * Calculate level-based time
 */
export const calculateLevelTime = (level) => {
  const time = GAME_CONFIG.INITIAL_TIME - (level - 1) * GAME_CONFIG.TIME_DECREASE_PER_LEVEL;
  return Math.max(time, GAME_CONFIG.MIN_TIME);
};

/**
 * Calculate level-based rows
 */
export const calculateLevelRows = (level) => {
  return GAME_CONFIG.INITIAL_ROWS + (level - 1);
};

/**
 * Calculate score multiplier based on combo
 */
export const calculateComboMultiplier = (combo) => {
  if (combo === 0) return 1;
  return 1 + Math.floor(combo / GAME_CONFIG.COMBO_THRESHOLD) * 0.5;
};

/**
 * Calculate bonus points for combo
 */
export const calculateComboBonus = (combo) => {
  if (combo < GAME_CONFIG.COMBO_THRESHOLD) return 0;
  return Math.floor(combo / GAME_CONFIG.COMBO_THRESHOLD) * GAME_CONFIG.COMBO_BONUS_MULTIPLIER;
};

// ============================================================================
// RANDOM HELPERS
// ============================================================================

/**
 * Generate random integer in range [min, max]
 */
export const randomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Generate random float in range [min, max]
 */
export const randomFloat = (min, max) => {
  return Math.random() * (max - min) + min;
};

/**
 * Get random element from array
 */
export const randomElement = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

/**
 * Shuffle array (Fisher-Yates)
 */
export const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// ============================================================================
// ARRAY HELPERS
// ============================================================================

/**
 * Create 2D array filled with value
 */
export const create2DArray = (rows, cols, fillValue = null) => {
  return Array(rows).fill(null).map(() => Array(cols).fill(fillValue));
};

/**
 * Deep clone array
 */
export const deepCloneArray = (array) => {
  return JSON.parse(JSON.stringify(array));
};

/**
 * Count occurrences in array
 */
export const countOccurrences = (array, value) => {
  return array.filter(item => item === value).length;
};

/**
 * Remove duplicates from array
 */
export const uniqueArray = (array) => {
  return [...new Set(array)];
};

// ============================================================================
// OBJECT HELPERS
// ============================================================================

/**
 * Deep clone object
 */
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Check if object is empty
 */
export const isEmptyObject = (obj) => {
  return Object.keys(obj).length === 0;
};

/**
 * Merge objects deeply
 */
export const deepMerge = (target, source) => {
  const output = { ...target };
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          output[key] = source[key];
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        output[key] = source[key];
      }
    });
  }
  
  return output;
};

/**
 * Check if value is object
 */
export const isObject = (item) => {
  return item && typeof item === 'object' && !Array.isArray(item);
};

// ============================================================================
// TIMING HELPERS
// ============================================================================

/**
 * Delay execution
 */
export const delay = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Debounce function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// ============================================================================
// COLOR HELPERS
// ============================================================================

/**
 * Convert hex to rgba
 */
export const hexToRgba = (hex, alpha = 1) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/**
 * Lighten color
 */
export const lightenColor = (color, amount) => {
  return `rgba(${color}, ${1 - amount})`;
};

/**
 * Darken color
 */
export const darkenColor = (color, amount) => {
  return `rgba(${color}, ${amount})`;
};

// ============================================================================
// STORAGE HELPERS
// ============================================================================

/**
 * Safe JSON parse
 */
export const safeJsonParse = (str, fallback = null) => {
  try {
    return JSON.parse(str);
  } catch (e) {
    console.error('JSON parse error:', e);
    return fallback;
  }
};

/**
 * Safe JSON stringify
 */
export const safeJsonStringify = (obj, fallback = '{}') => {
  try {
    return JSON.stringify(obj);
  } catch (e) {
    console.error('JSON stringify error:', e);
    return fallback;
  }
};

// ============================================================================
// MATH HELPERS
// ============================================================================

/**
 * Clamp value between min and max
 */
export const clamp = (value, min, max) => {
  return Math.min(Math.max(value, min), max);
};

/**
 * Linear interpolation
 */
export const lerp = (start, end, amount) => {
  return start + (end - start) * amount;
};

/**
 * Map value from one range to another
 */
export const mapRange = (value, inMin, inMax, outMin, outMax) => {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
};

/**
 * Check if value is between min and max
 */
export const isBetween = (value, min, max) => {
  return value >= min && value <= max;
};

// ============================================================================
// STATISTICS HELPERS
// ============================================================================

/**
 * Calculate average
 */
export const average = (numbers) => {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
};

/**
 * Calculate median
 */
export const median = (numbers) => {
  if (numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
};

/**
 * Calculate sum
 */
export const sum = (numbers) => {
  return numbers.reduce((total, num) => total + num, 0);
};

/**
 * Find max value
 */
export const max = (numbers) => {
  return Math.max(...numbers);
};

/**
 * Find min value
 */
export const min = (numbers) => {
  return Math.min(...numbers);
};

// ============================================================================
// DEBUG HELPERS
// ============================================================================

/**
 * Log with timestamp
 */
export const logWithTime = (message, ...args) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`, ...args);
};

/**
 * Log performance
 */
export const measurePerformance = (label, fn) => {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  console.log(`${label} took ${(end - start).toFixed(2)}ms`);
  return result;
};