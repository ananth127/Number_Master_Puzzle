// ============================================================================
// FILE: src/audio/GameAudioLoader.js
// ============================================================================

import { AudioSystem } from "../core/AudioSystem";

export const audio = new AudioSystem();

export async function loadAllSounds() {
  try {
    // 🔊 SOUND EFFECTS
    await audio.loadSound(
      "click",
      require("../../assets/sounds/click.wav")
    );

    await audio.loadSound(
      "match",
      require("../../assets/sounds/match.mp3")
    );

    await audio.loadSound(
      "wrong",
      require("../../assets/sounds/wrong.wav")
    );
    // 🎵 MUSIC
    await audio.loadMusic(
      "bgm",
      require("../../assets/music/bgm.mp3"),
      { loop: true }
    );

    console.log("All sounds loaded successfully");

  } catch (err) {
    console.error("Error loading audio:", err);
  }
}
