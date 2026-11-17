import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { soundEnabled } from './storage';

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (!soundEnabled()) return null;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

export function playTick(): void {
  const c = audio();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'square';
  osc.frequency.value = 2200;
  gain.gain.setValueAtTime(0.025, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.04);
  osc.connect(gain).connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + 0.05);
}

export function playPop(): void {
  const c = audio();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(620, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(980, c.currentTime + 0.09);
  gain.gain.setValueAtTime(0.05, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.12);
  osc.connect(gain).connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + 0.13);
}

export function haptic(ms: number): void {
  try {
    if (Capacitor.isNativePlatform()) {
      void Haptics.impact({ style: ms > 20 ? ImpactStyle.Medium : ImpactStyle.Light });
      return;
    }
    navigator.vibrate?.(ms);
  } catch {
    return;
  }
}
