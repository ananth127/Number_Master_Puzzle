// ============================================================================
// FILE: src/core/SoundSystem.js
// ============================================================================

import { Audio } from 'expo-av';

/**
 * Universal Sound System
 * Manages all game audio: sound effects and background music
 */
export class SoundSystem {
  constructor(config = {}) {
    this.sounds = new Map();
    this.music = null;
    this.sfxVolume = config.sfxVolume !== undefined ? config.sfxVolume : 1.0;
    this.musicVolume = config.musicVolume !== undefined ? config.musicVolume : 0.7;
    this.sfxEnabled = config.sfxEnabled !== false;
    this.musicEnabled = config.musicEnabled !== false;
    this.listeners = new Set();
    
    // Preload sounds
    this.preloadSounds();
  }

  /**
   * Preload all sound effects
   */
  async preloadSounds() {
    try {
      // Configure audio mode for iOS/Android
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      // Load sound effects
      await this.loadSound('click', require('../../assets/sounds/click.wav'));
      await this.loadSound('match', require('../../assets/sounds/match.mp3'));
      await this.loadSound('wrong', require('../../assets/sounds/wrong.wav'));
      await this.loadSound('levelup', require('../../assets/sounds/levelup.wav'));
      
      // Load background music
      await this.loadMusic('bgm', require('../../assets/music/bgm.mp3'));
      
      console.log('All sounds preloaded successfully');
      this.notifyListeners('soundsLoaded', null);
    } catch (error) {
      console.error('Error preloading sounds:', error);
    }
  }

  /**
   * Load a sound effect
   */
  async loadSound(name, source) {
    try {
      const { sound } = await Audio.Sound.createAsync(source, {
        volume: this.sfxVolume,
        shouldPlay: false,
      });
      
      this.sounds.set(name, sound);
      console.log(`Sound loaded: ${name}`);
    } catch (error) {
      console.error(`Error loading sound ${name}:`, error);
    }
  }

  /**
   * Load background music
   */
  async loadMusic(name, source) {
    try {
      const { sound } = await Audio.Sound.createAsync(source, {
        volume: this.musicVolume,
        isLooping: true,
        shouldPlay: false,
      });
      
      this.music = sound;
      console.log(`Music loaded: ${name}`);
    } catch (error) {
      console.error(`Error loading music ${name}:`, error);
    }
  }

  /**
   * Play a sound effect
   */
  async playSound(name) {
    if (!this.sfxEnabled) return;

    const sound = this.sounds.get(name);
    if (!sound) {
      console.warn(`Sound not found: ${name}`);
      return;
    }

    try {
      // Stop and reset to beginning
      await sound.stopAsync();
      await sound.setPositionAsync(0);
      await sound.setVolumeAsync(this.sfxVolume);
      await sound.playAsync();
    } catch (error) {
      console.error(`Error playing sound ${name}:`, error);
    }
  }

  /**
   * Play background music
   */
  async playMusic() {
    if (!this.musicEnabled || !this.music) return;

    try {
      const status = await this.music.getStatusAsync();
      
      if (status.isPlaying) return;
      
      await this.music.setVolumeAsync(this.musicVolume);
      await this.music.setIsLoopingAsync(true);
      await this.music.playAsync();
      
      this.notifyListeners('musicStarted', null);
    } catch (error) {
      console.error('Error playing music:', error);
    }
  }

  /**
   * Pause background music
   */
  async pauseMusic() {
    if (!this.music) return;

    try {
      const status = await this.music.getStatusAsync();
      if (status.isPlaying) {
        await this.music.pauseAsync();
        this.notifyListeners('musicPaused', null);
      }
    } catch (error) {
      console.error('Error pausing music:', error);
    }
  }

  /**
   * Stop background music
   */
  async stopMusic() {
    if (!this.music) return;

    try {
      await this.music.stopAsync();
      this.notifyListeners('musicStopped', null);
    } catch (error) {
      console.error('Error stopping music:', error);
    }
  }

  /**
   * Set SFX volume
   */
  setSfxVolume(volume) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    
    // Update volume for all loaded sounds
    this.sounds.forEach(async (sound) => {
      try {
        await sound.setVolumeAsync(this.sfxVolume);
      } catch (error) {
        console.error('Error setting sound volume:', error);
      }
    });
    
    this.notifyListeners('sfxVolumeChanged', this.sfxVolume);
  }

  /**
   * Set music volume
   */
  async setMusicVolume(volume) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    
    if (this.music) {
      try {
        await this.music.setVolumeAsync(this.musicVolume);
      } catch (error) {
        console.error('Error setting music volume:', error);
      }
    }
    
    this.notifyListeners('musicVolumeChanged', this.musicVolume);
  }

  /**
   * Enable/disable SFX
   */
  setSfxEnabled(enabled) {
    this.sfxEnabled = enabled;
    this.notifyListeners('sfxEnabledChanged', enabled);
  }

  /**
   * Enable/disable music
   */
  async setMusicEnabled(enabled) {
    this.musicEnabled = enabled;
    
    if (enabled) {
      await this.playMusic();
    } else {
      await this.stopMusic();
    }
    
    this.notifyListeners('musicEnabledChanged', enabled);
  }

  /**
   * Unload all sounds (cleanup)
   */
  async unloadAll() {
    try {
      // Unload sound effects
      for (const [name, sound] of this.sounds.entries()) {
        await sound.unloadAsync();
        console.log(`Sound unloaded: ${name}`);
      }
      this.sounds.clear();

      // Unload music
      if (this.music) {
        await this.music.unloadAsync();
        this.music = null;
        console.log('Music unloaded');
      }
    } catch (error) {
      console.error('Error unloading sounds:', error);
    }
  }

  /**
   * Subscribe to sound events
   */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners(event, data) {
    this.listeners.forEach(listener => listener(event, data));
  }

  /**
   * Get current settings
   */
  getSettings() {
    return {
      sfxEnabled: this.sfxEnabled,
      musicEnabled: this.musicEnabled,
      sfxVolume: this.sfxVolume,
      musicVolume: this.musicVolume,
    };
  }
}