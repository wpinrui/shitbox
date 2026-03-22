import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '@store/index';
import { getTimeOfDay } from '@engine/core/time';

type TimePeriod = 'morning' | 'afternoon' | 'evening' | 'night';

const BGM_TRACKS: Record<TimePeriod, string[]> = {
  morning:   [1, 2, 3].map((n) => `/assets/audio/bgm-morning-${n}.mp3`),
  afternoon: [1, 2, 3, 4].map((n) => `/assets/audio/bgm-afternoon-${n}.mp3`),
  evening:   [1, 2, 3].map((n) => `/assets/audio/bgm-evening-${n}.mp3`),
  night:     [1, 2, 3, 4].map((n) => `/assets/audio/bgm-night-${n}.mp3`),
};

const TITLE_TRACK = '/assets/audio/late-night-radio.mp3';
const JINGLE_ACTIVITY = '/assets/audio/jingle-activity.wav';
const JINGLE_TRAVEL = '/assets/audio/jingle-travel.wav';
const FADE_MS = 600;

export function useAudio() {
  const currentScreen = useGameStore((s) => s.currentScreen);
  const gameState = useGameStore((s) => s.gameState);
  const muted = useGameStore((s) => s.muted);
  const audioEvent = useGameStore((s) => s.audioEvent);
  const clearAudioEvent = useGameStore((s) => s.clearAudioEvent);

  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const jingleRef = useRef<HTMLAudioElement | null>(null);

  // Per-period cycling indices — persist for the app session
  const trackIdx = useRef<Record<TimePeriod, number>>({ morning: 0, afternoon: 0, evening: 0, night: 0 });

  // Transition state
  const activePeriod = useRef<TimePeriod | null>(null);
  const jinglePlaying = useRef(false);
  const savedSrc = useRef('');
  const savedPos = useRef(0);
  const savedPeriod = useRef<TimePeriod | null>(null);

  // Keep a ref to current game hour for use inside event handlers
  const currentHourRef = useRef(6);
  useEffect(() => {
    if (gameState) currentHourRef.current = gameState.time.currentHour;
  }, [gameState?.time.currentHour]); // eslint-disable-line react-hooks/exhaustive-deps

  // Single pending deferred-start listener — only one ever active at a time
  const deferredListener = useRef<(() => void) | null>(null);

  // Play BGM src at a given position. Handles autoplay policy: if the browser
  // blocks play(), attaches a one-shot click/keydown listener. Any previously
  // pending listener is cancelled first to prevent stale firings.
  const playBgm = useCallback((src: string, startTime = 0) => {
    const bgm = bgmRef.current;
    if (!bgm) return;

    // Cancel any pending deferred listener
    if (deferredListener.current) {
      document.removeEventListener('click', deferredListener.current);
      document.removeEventListener('keydown', deferredListener.current);
      deferredListener.current = null;
    }

    bgm.src = src;
    bgm.currentTime = startTime;
    bgm.volume = 1;

    bgm.play().catch(() => {
      const resume = () => {
        document.removeEventListener('click', resume);
        document.removeEventListener('keydown', resume);
        deferredListener.current = null;
        bgm.play().catch(() => {});
      };
      deferredListener.current = resume;
      document.addEventListener('click', resume);
      document.addEventListener('keydown', resume);
    });
  }, []);

  const fadeBgmOut = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      const el = bgmRef.current;
      if (!el || el.paused) { resolve(); return; }
      const startVol = el.volume;
      const steps = 15;
      const delay = FADE_MS / steps;
      let s = 0;
      const id = setInterval(() => {
        s++;
        el.volume = Math.max(0, startVol - (startVol / steps) * s);
        if (s >= steps) {
          clearInterval(id);
          el.pause();
          el.volume = 1;
          resolve();
        }
      }, delay);
    });
  }, []);

  // Initialize audio elements once on mount — no autoplay here
  useEffect(() => {
    const bgm = new Audio();
    bgm.loop = true;
    bgmRef.current = bgm;

    const jingle = new Audio();
    jingle.loop = false;
    jingleRef.current = jingle;

    // Resume BGM when jingle ends naturally
    const onJingleEnd = () => {
      jinglePlaying.current = false;
      const currentPeriod = getTimeOfDay(currentHourRef.current);
      activePeriod.current = currentPeriod;

      if (currentPeriod === savedPeriod.current && savedSrc.current) {
        bgm.src = savedSrc.current;
        bgm.currentTime = savedPos.current;
        bgm.volume = 1;
        bgm.play().catch(() => {});
      } else {
        const tracks = BGM_TRACKS[currentPeriod];
        const idx = trackIdx.current[currentPeriod];
        trackIdx.current[currentPeriod] = (idx + 1) % tracks.length;
        bgm.src = tracks[idx];
        bgm.currentTime = 0;
        bgm.volume = 1;
        bgm.play().catch(() => {});
      }
    };

    jingle.addEventListener('ended', onJingleEnd);

    return () => {
      bgm.pause();
      jingle.pause();
      jingle.removeEventListener('ended', onJingleEnd);
      if (deferredListener.current) {
        document.removeEventListener('click', deferredListener.current);
        document.removeEventListener('keydown', deferredListener.current);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync mute state
  useEffect(() => {
    if (bgmRef.current) bgmRef.current.muted = muted;
    if (jingleRef.current) jingleRef.current.muted = muted;
  }, [muted]);

  // IMPORTANT: audio event effect must be declared BEFORE period-change effect.
  // React fires effects in declaration order within the same render, so this
  // ensures jinglePlaying.current is set to true before the period-change
  // effect runs (which checks it to decide whether to switch tracks).
  useEffect(() => {
    if (!audioEvent) return;
    clearAudioEvent();

    const bgm = bgmRef.current;
    const jingle = jingleRef.current;
    if (!bgm || !jingle) return;

    if (audioEvent === 'activity_start' || audioEvent === 'travel') {
      savedSrc.current = bgm.src;
      savedPos.current = bgm.currentTime;
      savedPeriod.current = activePeriod.current;
      jinglePlaying.current = true;

      const jingleSrc = audioEvent === 'travel' ? JINGLE_TRAVEL : JINGLE_ACTIVITY;
      fadeBgmOut().then(() => {
        jingle.src = jingleSrc;
        jingle.currentTime = 0;
        jingle.volume = 1;
        jingle.play().catch(() => {});
      });
    } else if (audioEvent === 'activity_end') {
      if (!jinglePlaying.current) return;

      jingle.pause();
      jingle.currentTime = 0;
      jinglePlaying.current = false;

      const currentPeriod = activePeriod.current;
      if (!currentPeriod) return;

      if (currentPeriod === savedPeriod.current && savedSrc.current) {
        bgm.src = savedSrc.current;
        bgm.currentTime = savedPos.current;
        bgm.volume = 1;
        bgm.play().catch(() => {});
      } else {
        const tracks = BGM_TRACKS[currentPeriod];
        const idx = trackIdx.current[currentPeriod];
        trackIdx.current[currentPeriod] = (idx + 1) % tracks.length;
        bgm.src = tracks[idx];
        bgm.currentTime = 0;
        bgm.volume = 1;
        bgm.play().catch(() => {});
      }
    }
  }, [audioEvent, clearAudioEvent, fadeBgmOut]);

  // Title/menu screens: play late-night-radio without restarting if already on it
  useEffect(() => {
    if (currentScreen !== 'game') {
      jingleRef.current?.pause();
      jinglePlaying.current = false;
      activePeriod.current = null;

      const bgm = bgmRef.current;
      if (!bgm) return;

      if (bgm.src.endsWith('late-night-radio.mp3') && !bgm.paused) return;
      playBgm(TITLE_TRACK, 0);
    }
  }, [currentScreen, playBgm]);

  // Period-change effect — runs after audio event effect (declaration order)
  useEffect(() => {
    if (currentScreen !== 'game' || !gameState) return;

    const period = getTimeOfDay(gameState.time.currentHour);
    if (period === activePeriod.current || jinglePlaying.current) return;

    activePeriod.current = period;
    const tracks = BGM_TRACKS[period];
    const idx = trackIdx.current[period];
    trackIdx.current[period] = (idx + 1) % tracks.length;

    playBgm(tracks[idx], 0);
  }, [currentScreen, gameState?.time.currentHour, playBgm]); // eslint-disable-line react-hooks/exhaustive-deps
}
