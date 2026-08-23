import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { getLimitStateParsed } from '../native/Tracking';
import type { LimitState } from '../native/types';

export function useLiveLimits(intervalMs = 2000) {
  const [state, setState] = useState<LimitState[]>([]);

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setInterval> | null = null;

    const poll = async () => {
      const data = await getLimitStateParsed();
      if (alive) setState(data);
    };

    const start = () => {
      poll();
      timer = setInterval(poll, intervalMs);
    };

    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };

    start();

    const sub = AppState.addEventListener('change', next => {
      if (next === 'active') start();
      else stop();
    });

    return () => {
      alive = false;
      stop();
      sub.remove();
    };
  }, [intervalMs]);

  return state;
}