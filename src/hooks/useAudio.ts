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
  const resumeBgmRef = useRef<(() => void) | null>(null);

  // Keep a ref to current game hour for use inside event handlers
  const currentHourRef = useRef(6);
  useEffect(() => {
    if (gameState) currentHourRef.current = gameState.time.currentHour;
  }, [gameState?.time.currentHour]); // eslint-disable-line react-hooks/exhaustive-deps

  // Track what src we intentionally set — avoids comparing against browser-resolved URLs
  const intendedSrc = useRef('');
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

  // Generation counter — incremented on every switchBgm call so stale
  // fade callbacks from a prior switch are discarded.
  const switchGen = useRef(0);

  // Switch BGM to a new src. Fades out the current track if one is playing,
  // then starts the new track.
  const switchBgm = useCallback((src: string, startTime = 0) => {
    const bgm = bgmRef.current;
    if (!bgm) return;
    if (intendedSrc.current === src) return;

    intendedSrc.current = src;
    const gen = ++switchGen.current;

    const startNew = () => {
      if (switchGen.current !== gen) return;
      bgm.src = src;
      bgm.currentTime = startTime;
      bgm.volume = 1;
      bgm.play().catch(() => {});
    };

    // If a track is currently audible, fade out first
    if (!bgm.paused) {
      fadeBgmOut().then(startNew);
    } else {
      startNew();
    }
  }, [fadeBgmOut]);

  // Initialize audio elements + global autoplay unlock listener
  useEffect(() => {
    const bgm = new Audio();
    bgm.loop = true;
    bgmRef.current = bgm;
    intendedSrc.current = '';

    const jingle = new Audio();
    jingle.loop = false;
    jingleRef.current = jingle;

    // One-shot listener: on first user interaction, unlock autoplay
    const onInteraction = () => {
      document.removeEventListener('click', onInteraction);
      document.removeEventListener('keydown', onInteraction);
      // If BGM has a src queued but is paused, start it now
      if (bgm.src && bgm.paused) {
        bgm.play().catch(() => {});
      }
    };
    document.addEventListener('click', onInteraction);
    document.addEventListener('keydown', onInteraction);

    // Shared resume logic — used by both onJingleEnd and activity_end handler.
    // Checks live time period to avoid resuming a stale track after a period
    // boundary crossing during a jingle.
    const resumeBgm = () => {
      jinglePlaying.current = false;
      const currentPeriod = getTimeOfDay(currentHourRef.current);
      activePeriod.current = currentPeriod;

      if (currentPeriod === savedPeriod.current && savedSrc.current) {
        intendedSrc.current = savedSrc.current;
        bgm.src = savedSrc.current;
        bgm.currentTime = savedPos.current;
      } else {
        const tracks = BGM_TRACKS[currentPeriod];
        const idx = trackIdx.current[currentPeriod];
        trackIdx.current[currentPeriod] = (idx + 1) % tracks.length;
        intendedSrc.current = tracks[idx];
        bgm.src = tracks[idx];
        bgm.currentTime = 0;
      }
      bgm.volume = 1;
      bgm.play().catch(() => {});
    };
    resumeBgmRef.current = resumeBgm;

    const onJingleEnd = () => resumeBgm();

    jingle.addEventListener('ended', onJingleEnd);

    return () => {
      bgm.pause();
      jingle.pause();
      jingle.removeEventListener('ended', onJingleEnd);
      document.removeEventListener('click', onInteraction);
      document.removeEventListener('keydown', onInteraction);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync mute state
  useEffect(() => {
    if (bgmRef.current) bgmRef.current.muted = muted;
    if (jingleRef.current) jingleRef.current.muted = muted;
  }, [muted]);

  // Audio event effect (jingle start/end) — must be declared BEFORE the
  // unified BGM effect so jinglePlaying.current is set before the BGM
  // effect checks it in the same render cycle.
  useEffect(() => {
    if (!audioEvent) return;
    clearAudioEvent();

    const bgm = bgmRef.current;
    const jingle = jingleRef.current;
    if (!bgm || !jingle) return;

    if (audioEvent === 'activity_start' || audioEvent === 'travel') {
      savedSrc.current = intendedSrc.current;
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
      resumeBgmRef.current?.();
    }
  }, [audioEvent, clearAudioEvent, fadeBgmOut]);

  // Unified BGM effect — handles both title/menu and game-screen music.
  // Single point of control eliminates races between competing effects.
  useEffect(() => {
    if (jinglePlaying.current) return;

    if (currentScreen !== 'game' || !gameState) {
      // Menu/title screens: play late-night-radio
      jingleRef.current?.pause();
      jinglePlaying.current = false;
      activePeriod.current = null;
      switchBgm(TITLE_TRACK, 0);
      return;
    }

    // Game screen: play period-appropriate track
    const period = getTimeOfDay(gameState.time.currentHour);
    if (period === activePeriod.current) return;

    activePeriod.current = period;
    const tracks = BGM_TRACKS[period];
    const idx = trackIdx.current[period];
    trackIdx.current[period] = (idx + 1) % tracks.length;
    switchBgm(tracks[idx], 0);
  }, [currentScreen, gameState?.time.currentHour, switchBgm]); // eslint-disable-line react-hooks/exhaustive-deps
}
