import { AudioSpeed, VoiceGender, VoiceLanguage } from '../types/exercise';
import { AUDIO_SPEED_OPTIONS } from '../engine/arithmeticEngine';

class AudioController {
  private audioCtx: AudioContext | null = null;
  private cachedVoices: SpeechSynthesisVoice[] = [];
  private activeSessionToken = 0;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.loadVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        this.loadVoices();
      };
    }
  }

  private loadVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      this.cachedVoices = voices;
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  public isSpeechSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  /**
   * Selects the best matching system voice for the target language ('id' or 'en')
   * and gender ('female' or 'male'), plus pitch shaping so Female and Male
   * always sound distinct even when the OS provides a single voice for a locale.
   */
  private selectVoiceAndPitch(
    gender: VoiceGender,
    language: VoiceLanguage
  ): {
    voice: SpeechSynthesisVoice | null;
    pitch: number;
    langTag: string;
  } {
    this.loadVoices();
    const targetPrefix = language === 'id' ? 'id' : 'en';
    const defaultLangTag = language === 'id' ? 'id-ID' : 'en-US';

    // Filter voices matching the requested language ('id-ID', 'id_ID', 'ind', or 'en-US', 'en-GB', etc.)
    const langVoices = this.cachedVoices.filter((v) => {
      const normLang = v.lang.toLowerCase().replace('_', '-');
      const normName = v.name.toLowerCase();
      if (language === 'id') {
        return (
          normLang.startsWith('id') ||
          normLang.startsWith('in') ||
          normName.includes('indonesia') ||
          normName.includes('damayanti') ||
          normName.includes('gadis') ||
          normName.includes('ardi')
        );
      }
      return normLang.startsWith(targetPrefix);
    });

    const pool = langVoices.length > 0 ? langVoices : this.cachedVoices;

    if (pool.length === 0) {
      return {
        voice: null,
        pitch: gender === 'female' ? 1.14 : 0.86,
        langTag: defaultLangTag,
      };
    }

    const femaleKeywords = [
      'female',
      'damayanti',
      'gadis',
      'samantha',
      'victoria',
      'karen',
      'moira',
      'tessa',
      'zira',
      'aria',
      'jenny',
      'google bahasa indonesia',
      'google uk english female',
      'google us english',
      'siri',
    ];
    const maleKeywords = [
      'male',
      'ardi',
      'daniel',
      'alex',
      'david',
      'mark',
      'guy',
      'matthew',
      'arthur',
      'oliver',
      'fred',
      'google uk english male',
    ];

    const keywords = gender === 'female' ? femaleKeywords : maleKeywords;
    const matched = pool.find((v) =>
      keywords.some((kw) => v.name.toLowerCase().includes(kw.toLowerCase()))
    );

    if (matched) {
      return {
        voice: matched,
        pitch: gender === 'female' ? 1.08 : 0.9,
        langTag: langVoices.length > 0 ? matched.lang || defaultLangTag : defaultLangTag,
      };
    }

    const fallbackVoice =
      gender === 'male' && pool.length > 1 ? pool[1] : pool[0];
    return {
      voice: langVoices.length > 0 ? fallbackVoice : null,
      pitch: gender === 'female' ? 1.16 : 0.84,
      langTag: langVoices.length > 0 ? fallbackVoice.lang || defaultLangTag : defaultLangTag,
    };
  }

  public getRateForSpeed(speed: AudioSpeed): number {
    const found = AUDIO_SPEED_OPTIONS.find((o) => o.value === speed);
    return found ? found.rate : 1.05;
  }

  /**
   * Immediately stops any active speech synthesis and invalidates pending callbacks.
   */
  public stopAll(): void {
    this.activeSessionToken++;
    if (this.isSpeechSupported()) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore cancellation errors
      }
    }
  }

  /**
   * Announces a single text phrase in the chosen language ('id' or 'en') and resolves
   * when the utterance finishes speaking. Ensures announcements never overlap.
   */
  public speakText(params: {
    text: string;
    voiceGender: VoiceGender;
    language: VoiceLanguage;
    speed: AudioSpeed;
  }): Promise<{ completed: boolean; error?: string }> {
    const { text, voiceGender, language, speed } = params;
    const token = ++this.activeSessionToken;

    if (!this.isSpeechSupported()) {
      return Promise.resolve({
        completed: false,
        error: 'Speech synthesis is not supported in this browser.',
      });
    }

    return new Promise((resolve) => {
      try {
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        const { voice, pitch, langTag } = this.selectVoiceAndPitch(voiceGender, language);
        if (voice) {
          utterance.voice = voice;
        }
        utterance.lang = langTag;
        utterance.pitch = pitch;
        utterance.rate = this.getRateForSpeed(speed);
        utterance.volume = 1;

        let settled = false;
        const finish = (result: { completed: boolean; error?: string }) => {
          if (settled) return;
          settled = true;
          clearTimeout(safetyTimer);
          resolve(result);
        };

        const estimatedDurationMs = Math.max(2500, text.length * 180);
        const safetyTimer = setTimeout(() => {
          if (token !== this.activeSessionToken) {
            finish({ completed: false });
          } else {
            finish({ completed: true });
          }
        }, estimatedDurationMs);

        utterance.onend = () => {
          if (token !== this.activeSessionToken) {
            finish({ completed: false });
            return;
          }
          finish({ completed: true });
        };

        utterance.onerror = (event) => {
          if (
            event.error === 'canceled' ||
            event.error === 'interrupted' ||
            token !== this.activeSessionToken
          ) {
            finish({ completed: false });
            return;
          }
          finish({
            completed: false,
            error: `Audio playback interrupted (${event.error}).`,
          });
        };

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        resolve({
          completed: false,
          error: err instanceof Error ? err.message : 'Audio playback failed.',
        });
      }
    });
  }

  /**
   * Synthesized acoustic cues using Web Audio API for countdown ticks,
   * exercise start, exercise completion, and answer feedback.
   */
  public playCue(type: 'tick' | 'start' | 'finish' | 'correct' | 'incorrect'): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    const playTone = (
      freq: number,
      startTime: number,
      duration: number,
      gainPeak = 0.12,
      oscType: OscillatorType = 'sine'
    ) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = oscType;
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.exponentialRampToValueAtTime(gainPeak, startTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration + 0.01);
    };

    if (type === 'tick') {
      playTone(520, now, 0.08, 0.08, 'sine');
    } else if (type === 'start') {
      playTone(784, now, 0.16, 0.14, 'triangle');
      playTone(1046.5, now + 0.08, 0.22, 0.14, 'triangle');
    } else if (type === 'finish') {
      playTone(659.25, now, 0.14, 0.12, 'sine');
      playTone(880, now + 0.12, 0.26, 0.14, 'sine');
    } else if (type === 'correct') {
      playTone(523.25, now, 0.12, 0.12, 'triangle');
      playTone(659.25, now + 0.1, 0.12, 0.12, 'triangle');
      playTone(783.99, now + 0.2, 0.28, 0.14, 'triangle');
    } else if (type === 'incorrect') {
      playTone(330, now, 0.16, 0.12, 'sawtooth');
      playTone(261.63, now + 0.15, 0.25, 0.12, 'sawtooth');
    }
  }
}

export const audioController = new AudioController();
