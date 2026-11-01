// 4-7-8 breathing: inhale 4s, hold 7s, exhale 8s, repeat.

export const PHASES = [
  { name: 'inhale', label: 'Breathe in', seconds: 4 },
  { name: 'hold', label: 'Hold', seconds: 7 },
  { name: 'exhale', label: 'Breathe out', seconds: 8 },
];
const CYCLE_MS = PHASES.reduce((sum, p) => sum + p.seconds, 0) * 1000;

export function phaseAt(elapsedMs) {
  let t = elapsedMs % CYCLE_MS;
  for (const phase of PHASES) {
    const ms = phase.seconds * 1000;
    if (t < ms) return { ...phase, remaining: Math.ceil((ms - t) / 1000), cycle: Math.floor(elapsedMs / CYCLE_MS) };
    t -= ms;
  }
}

// Calls onUpdate(phase) whenever the phase or its countdown second changes.
export function createBreather(onUpdate) {
  let timer = null;
  let started = 0;
  let lastKey = '';
  const step = () => {
    const p = phaseAt(performance.now() - started);
    const key = `${p.cycle}:${p.name}:${p.remaining}`;
    if (key !== lastKey) {
      lastKey = key;
      onUpdate(p);
    }
  };
  return {
    start() {
      if (timer) return;
      started = performance.now();
      lastKey = '';
      step();
      timer = setInterval(step, 100);
    },
    stop() {
      clearInterval(timer);
      timer = null;
    },
  };
}
