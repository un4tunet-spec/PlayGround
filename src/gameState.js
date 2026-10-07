// Central game state: steps, scoring, timer, difficulty.
import { STEPS } from './engineModel.js';

export const DIFFS = {
  apprentice: { label: 'APPRENTICE', highlight: true,  strictOrder: true,  scoreMul: 1 },
  mechanic:   { label: 'MECHANIC',   highlight: false, strictOrder: true,  scoreMul: 1.5 },
  master:     { label: 'MASTER',     highlight: false, strictOrder: true,  scoreMul: 2 },
};

export function createGame() {
  return {
    started: false,
    over: false,
    diff: 'apprentice',
    currentStep: 0,
    score: 0,
    mistakes: 0,
    hintsUsed: 0,
    streak: 0,
    bestStreak: 0,
    condition: 100,
    startTime: 0,
    elapsed: 0,
    finishedTime: 0,
    removedCount: 0,
    selectedTool: 'wrench',
    hintUntil: 0,
    animating: new Set(),
  };
}

export function fmtTime(ms) {
  const s = Math.floor(ms / 1000);
  return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
}

export function stepTool(stepIndex) {
  return STEPS[stepIndex].tool;
}

export function addScore(g, pts) {
  const mul = DIFFS[g.diff].scoreMul;
  g.score = Math.max(0, Math.round(g.score + pts * mul));
}

export function mistake(g, pts = -150, dmg = 8) {
  g.mistakes++;
  g.streak = 0;
  g.condition = Math.max(0, g.condition - dmg);
  addScore(g, pts / DIFFS[g.diff].scoreMul); // keep penalty flat across diffs
  g.score = Math.max(0, g.score + 0);
}

export function bestKey() { return 'hangar7-best'; }
export function loadBest() {
  try { return JSON.parse(localStorage.getItem(bestKey()) || 'null'); } catch { return null; }
}
export function saveBest(g) {
  const prev = loadBest();
  const rec = { score: g.score, time: g.finishedTime, condition: g.condition, diff: g.diff, date: Date.now() };
  if (!prev || rec.score > prev.score) {
    try { localStorage.setItem(bestKey(), JSON.stringify(rec)); } catch {}
    return { ...rec, isNew: true };
  }
  return { ...rec, isNew: false };
}
