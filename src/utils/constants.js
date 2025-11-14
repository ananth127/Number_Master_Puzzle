// ============================================================================
// FILE: src/utils/constants.js
// ============================================================================

import { Dimensions } from 'react-native';

// ============================================================================
// DIMENSIONS
// ============================================================================

export const DIMENSIONS = {
  SCREEN_WIDTH: Dimensions.get('window').width,
  SCREEN_HEIGHT: Dimensions.get('window').height,
};

// ============================================================================
// COLORS
// ============================================================================

export const COLORS = {
  // Background
  BACKGROUND: '#0a0a0a',
  HEADER_BG: 'rgba(20, 20, 20, 0.95)',
  CARD_BG: '#1a1a1a',
  
  // Primary theme
  PRIMARY: '#9d4edd',
  SECONDARY: '#3b82f6',
  
  // Status colors
  SUCCESS: '#00ff88',
  WARNING: '#ffd700',
  DANGER: '#e94560',
  INFO: '#3be9dd',
  
  // Text colors
  TEXT_PRIMARY: '#ffffff',
  TEXT_SECONDARY: '#94a3b8',
  TEXT_GOLD: '#ffd700',
  TEXT_MUTED: '#64748b',
  
  // UI states
  SELECTED: 'rgba(255, 215, 0, 0.3)',
  HINT: 'rgba(0, 255, 136, 0.2)',
  INVALID: 'rgba(176, 56, 29, 0.3)',
  DISABLED: '#475569',
  
  // Borders
  BORDER_LIGHT: 'rgba(255, 255, 255, 0.1)',
  BORDER_MEDIUM: 'rgba(255, 255, 255, 0.2)',
  BORDER_STRONG: 'rgba(255, 255, 255, 0.4)',
  
  // Cell colors (for number values 1-9)
  CELL_COLORS: {
    1: '#f33838ff',
    2: '#3be9ddff',
    3: '#e7c831ff',
    4: '#56be98ff',
    5: '#d04651ff',
    6: '#ef8f4fff',
    7: '#c9706bff',
    8: '#427fe8ff',
    9: '#fb4fe4ff',
  }
};

// ============================================================================
// FONT SIZES
// ============================================================================

export const FONT_SIZES = {
  TINY: DIMENSIONS.SCREEN_WIDTH * 0.03,
  SMALL: DIMENSIONS.SCREEN_WIDTH * 0.035,
  MEDIUM: DIMENSIONS.SCREEN_WIDTH * 0.04,
  LARGE: DIMENSIONS.SCREEN_WIDTH * 0.055,
  XLARGE: DIMENSIONS.SCREEN_WIDTH * 0.065,
  XXLARGE: DIMENSIONS.SCREEN_WIDTH * 0.08,
  HUGE: DIMENSIONS.SCREEN_WIDTH * 0.12,
};

// ============================================================================
// SPACING
// ============================================================================

export const SPACING = {
  TINY: 4,
  SMALL: 8,
  MEDIUM: 12,
  LARGE: 16,
  XLARGE: 24,
  XXLARGE: 32,
  HUGE: 48,
};

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const RADIUS = {
  SMALL: 8,
  MEDIUM: 12,
  LARGE: 20,
  XLARGE: 25,
  ROUND: 999,
};

// ============================================================================
// GAME CONFIGURATION
// ============================================================================

export const GAME_CONFIG = {
  // Grid settings
  GRID_COLS: 9,
  INITIAL_ROWS: 4,
  
  // Timer settings
  INITIAL_TIME: 420, // 7 minutes
  TIME_DECREASE_PER_LEVEL: 30, // seconds
  MIN_TIME: 120, // 2 minutes minimum
  
  // Resource limits
  MAX_ACTIONS: 5,
  
  // Value range
  MIN_VALUE: 1,
  MAX_VALUE: 9,
  
  // Scoring
  BASE_POINTS: {
    ADJACENT: 1,
    STRAIGHT_LINE: 4,
    DIAGONAL: 4,
    SNAKE_WRAP: 4,
    HEAD_TO_TAIL: 4,
  },
  ROW_BONUS: 10,
  COMBO_THRESHOLD: 5,
  COMBO_BONUS_MULTIPLIER: 5,
  
  // Match rules
  SUM_TARGET: 10,
  
  // Smart generation probabilities
  MATCH_PROBABILITY: 0.4,
  COMPLEMENT_PROBABILITY: 0.3,
};

// ============================================================================
// ICONS (Emoji)
// ============================================================================

export const ICONS = {
  // Actions
  ADD: '➕',
  HINT: '💡',
  CHANGE: '🔄',
  
  // Controls
  PLAY: '▶',
  PAUSE: '⏸',
  RESET: '↻',
  
  // Status
  SUCCESS: '✓',
  FAIL: '✗',
  STAR: '⭐',
  TROPHY: '🏆',
  FIRE: '🔥',
  
  // UI
  CLOSE: '✕',
  MENU: '☰',
  SETTINGS: '⚙',
  INFO: 'ℹ',
  
  // Game
  LEVEL: '🎯',
  SCORE: '⭐',
  TIME: '⏱',
  PARTY: '🎉',
};

// ============================================================================
// ANIMATION DURATIONS (milliseconds)
// ============================================================================

export const ANIMATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  VERY_SLOW: 1000,
  
  SCORE_PULSE: 150,
  LEVEL_UP: 2000,
  HINT_PULSE: 500,
  SHAKE: 50,
  FADE: 200,
};

// ============================================================================
// Z-INDEX LAYERS
// ============================================================================

export const Z_INDEX = {
  BASE: 0,
  GRID: 1,
  CONTROLS: 10,
  BUTTONS: 20,
  OVERLAYS: 100,
  MODALS: 500,
  TOAST: 1000,
};

// ============================================================================
// GAME STATES
// ============================================================================

export const GAME_STATES = {
  IDLE: 'idle',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAME_OVER: 'gameOver',
  LEVEL_UP: 'levelUp',
};

// ============================================================================
// CONNECTION TYPES
// ============================================================================

export const CONNECTION_TYPES = {
  ADJACENT: 'adjacent',
  STRAIGHT_LINE: 'straightLine',
  DIAGONAL: 'diagonal',
  SNAKE_WRAP: 'snakeWrap',
  HEAD_TO_TAIL: 'headToTail',
};

// ============================================================================
// STORAGE KEYS (for AsyncStorage / localStorage)
// ============================================================================

export const STORAGE_KEYS = {
  GAME_STATE: '@game_state',
  HIGH_SCORE: '@high_score',
  SETTINGS: '@settings',
  ACHIEVEMENTS: '@achievements',
  STATISTICS: '@statistics',
};

// ============================================================================
// VALIDATION RULES
// ============================================================================

export const VALIDATION = {
  MIN_GRID_ROWS: 1,
  MAX_GRID_ROWS: 20,
  MIN_GRID_COLS: 3,
  MAX_GRID_COLS: 15,
  MIN_TIME: 10,
  MAX_TIME: 3600,
};

// ============================================================================
// DEFAULT SETTINGS
// ============================================================================

export const DEFAULT_SETTINGS = {
  soundEnabled: true,
  musicEnabled: true,
  vibrationEnabled: true,
  sfxVolume: 1.0,
  musicVolume: 0.7,
  difficulty: 'normal',
  showHints: true,
  autoSave: true,
};

// ============================================================================
// ACHIEVEMENT CATEGORIES
// ============================================================================

export const ACHIEVEMENT_CATEGORIES = {
  SCORE: 'score',
  LEVEL: 'level',
  MATCHES: 'matches',
  SPEED: 'speed',
  SKILL: 'skill',
  SPECIAL: 'special',
};

// ============================================================================
// ERROR MESSAGES
// ============================================================================

export const ERROR_MESSAGES = {
  NO_VALID_MOVES: 'No valid moves available',
  LIMIT_REACHED: 'Action limit reached',
  INVALID_MOVE: 'Invalid move',
  GAME_NOT_STARTED: 'Please start the game first',
  SAVE_FAILED: 'Failed to save game',
  LOAD_FAILED: 'Failed to load game',
};

// ============================================================================
// SUCCESS MESSAGES
// ============================================================================

export const SUCCESS_MESSAGES = {
  GAME_SAVED: 'Game saved successfully',
  LEVEL_COMPLETE: 'Level complete!',
  HIGH_SCORE: 'New high score!',
  ACHIEVEMENT_UNLOCKED: 'Achievement unlocked!',
};