
// ============================================================================
// FILE: src/core/AudioSystem.js
// ============================================================================

import { Audio } from 'expo-av';

/**
 * Universal Audio System
 * Manages sound effects and music for React Native games
 * Requires: expo-av
 */
export class AudioSystem {
  constructor(config = {}) {
    this.sounds = new Map();
    this.music = new Map();
    this.currentMusic = null;
    this.listeners = new Set();
    
    // Settings
    this.sfxVolume = config.sfxVolume !== undefined ? config.sfxVolume : 1.0;
    this.musicVolume = config.musicVolume !== undefined ? config.musicVolume : 0.7;
    this.sfxEnabled = config.sfxEnabled !== undefined ? config.sfxEnabled : true;
    this.musicEnabled = config.musicEnabled !== undefined ? config.musicEnabled : true;
    
    // Initialize audio mode
    this.initializeAudio();
  }

  /**
   * Initialize audio mode for React Native
   */
  async initializeAudio() {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false
      });
    } catch (error) {
      console.error('Failed to initialize audio:', error);
    }
  }

  /**
   * Load a sound effect
   */
  async loadSound(name, source, config = {}) {
    try {
      const { sound } = await Audio.Sound.createAsync(
        source,
        {
          shouldPlay: false,
          volume: config.volume !== undefined ? config.volume : this.sfxVolume,
          isLooping: config.loop || false
        }
      );

      this.sounds.set(name, {
        sound,
        config,
        isPlaying: false
      });

      this.notifyListeners('soundLoaded', { name });
    } catch (error) {
      console.error(`Failed to load sound '${name}':`, error);
    }
  }

  /**
   * Load music track
   */
  async loadMusic(name, source, config = {}) {
    try {
      const { sound } = await Audio.Sound.createAsync(
        source,
        {
          shouldPlay: false,
          volume: config.volume !== undefined ? config.volume : this.musicVolume,
          isLooping: config.loop !== undefined ? config.loop : true
        }
      );

      this.music.set(name, {
        sound,
        config,
        isPlaying: false
      });

      this.notifyListeners('musicLoaded', { name });
    } catch (error) {
      console.error(`Failed to load music '${name}':`, error);
    }
  }

  /**
   * Play sound effect
   */
  async playSound(name, config = {}) {
    if (!this.sfxEnabled) return;

    const soundData = this.sounds.get(name);
    if (!soundData) {
      console.warn(`Sound '${name}' not loaded`);
      return;
    }

    try {
      const { sound } = soundData;
      
      // Stop and rewind if already playing (for rapid-fire sounds)
      await sound.stopAsync();
      await sound.setPositionAsync(0);
      
      // Set volume
      if (config.volume !== undefined) {
        await sound.setVolumeAsync(config.volume * this.sfxVolume);
      }
      
      await sound.playAsync();
      soundData.isPlaying = true;

      // Handle completion
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          soundData.isPlaying = false;
          this.notifyListeners('soundEnded', { name });
        }
      });

      this.notifyListeners('soundPlayed', { name });
    } catch (error) {
      console.error(`Failed to play sound '${name}':`, error);
    }
  }

  /**
   * Play music track
   */
  async playMusic(name, config = {}) {
    if (!this.musicEnabled) return;

    const musicData = this.music.get(name);
    if (!musicData) {
      console.warn(`Music '${name}' not loaded`);
      return;
    }

    try {
      // Stop current music if playing
      if (this.currentMusic && this.currentMusic !== name) {
        await this.stopMusic();
      }

      const { sound } = musicData;
      
      // Set volume
      if (config.volume !== undefined) {
        await sound.setVolumeAsync(config.volume * this.musicVolume);
      }
      
      // Fade in if specified
      if (config.fadeIn) {
        await sound.setVolumeAsync(0);
        await sound.playAsync();
        this.fadeVolume(sound, this.musicVolume, config.fadeIn);
      } else {
        await sound.playAsync();
      }

      musicData.isPlaying = true;
      this.currentMusic = name;

      this.notifyListeners('musicPlayed', { name });
    } catch (error) {
      console.error(`Failed to play music '${name}':`, error);
    }
  }

  /**
   * Stop music
   */
  async stopMusic(fadeOut = 0) {
    if (!this.currentMusic) return;

    const musicData = this.music.get(this.currentMusic);
    if (!musicData) return;

    try {
      const { sound } = musicData;

      if (fadeOut > 0) {
        await this.fadeVolume(sound, 0, fadeOut);
      }

      await sound.stopAsync();
      await sound.setPositionAsync(0);
      
      musicData.isPlaying = false;
      const stoppedMusic = this.currentMusic;
      this.currentMusic = null;

      this.notifyListeners('musicStopped', { name: stoppedMusic });
    } catch (error) {
      console.error('Failed to stop music:', error);
    }
  }

  /**
   * Pause music
   */
  async pauseMusic() {
    if (!this.currentMusic) return;

    const musicData = this.music.get(this.currentMusic);
    if (!musicData) return;

    try {
      await musicData.sound.pauseAsync();
      musicData.isPlaying = false;
      this.notifyListeners('musicPaused', { name: this.currentMusic });
    } catch (error) {
      console.error('Failed to pause music:', error);
    }
  }

  /**
   * Resume music
   */
  async resumeMusic() {
    if (!this.currentMusic) return;

    const musicData = this.music.get(this.currentMusic);
    if (!musicData) return;

    try {
      await musicData.sound.playAsync();
      musicData.isPlaying = true;
      this.notifyListeners('musicResumed', { name: this.currentMusic });
    } catch (error) {
      console.error('Failed to resume music:', error);
    }
  }

  /**
   * Fade volume
   */
  async fadeVolume(sound, targetVolume, duration) {
    const status = await sound.getStatusAsync();
    const currentVolume = status.volume || 0;
    const steps = 20;
    const stepDuration = duration / steps;
    const volumeStep = (targetVolume - currentVolume) / steps;

    for (let i = 0; i < steps; i++) {
      const newVolume = currentVolume + (volumeStep * (i + 1));
      await sound.setVolumeAsync(Math.max(0, Math.min(1, newVolume)));
      await new Promise(resolve => setTimeout(resolve, stepDuration));
    }
  }

  /**
   * Set sound effects volume
   */
  setSfxVolume(volume) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    
    this.sounds.forEach(async (soundData) => {
      try {
        await soundData.sound.setVolumeAsync(this.sfxVolume);
      } catch (error) {
        console.error('Failed to set sound volume:', error);
      }
    });

    this.notifyListeners('sfxVolumeChanged', this.sfxVolume);
  }

  /**
   * Set music volume
   */
  setMusicVolume(volume) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    
    this.music.forEach(async (musicData) => {
      try {
        await musicData.sound.setVolumeAsync(this.musicVolume);
      } catch (error) {
        console.error('Failed to set music volume:', error);
      }
    });

    this.notifyListeners('musicVolumeChanged', this.musicVolume);
  }

  /**
   * Toggle sound effects
   */
  toggleSfx() {
    this.sfxEnabled = !this.sfxEnabled;
    this.notifyListeners('sfxToggled', this.sfxEnabled);
  }

  /**
   * Toggle music
   */
  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    
    if (!this.musicEnabled && this.currentMusic) {
      this.stopMusic();
    }

    this.notifyListeners('musicToggled', this.musicEnabled);
  }

  /**
   * Subscribe to audio events
   */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners(event, data) {
    this.listeners.forEach(listener => listener(event, data));
  }

  /**
   * Unload all audio
   */
  async unloadAll() {
    // Unload sounds
    for (const [name, soundData] of this.sounds) {
      try {
        await soundData.sound.unloadAsync();
      } catch (error) {
        console.error(`Failed to unload sound '${name}':`, error);
      }
    }

    // Unload music
    for (const [name, musicData] of this.music) {
      try {
        await musicData.sound.unloadAsync();
      } catch (error) {
        console.error(`Failed to unload music '${name}':`, error);
      }
    }

    this.sounds.clear();
    this.music.clear();
    this.currentMusic = null;
  }

  /**
   * Get audio settings
   */
  getSettings() {
    return {
      sfxVolume: this.sfxVolume,
      musicVolume: this.musicVolume,
      sfxEnabled: this.sfxEnabled,
      musicEnabled: this.musicEnabled
    };
  }
}