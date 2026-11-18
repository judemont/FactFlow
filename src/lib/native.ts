import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Geolocation } from '@capacitor/geolocation';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';

export const isNative = Capacitor.isNativePlatform();

export function showGetApp(): boolean {
  if (isNative) return false;
  return /android/i.test(navigator.userAgent);
}

export interface Coords {
  lat: number;
  lon: number;
}

export async function currentPosition(): Promise<Coords | null> {
  if (!isNative) return null;
  try {
    const status = await Geolocation.checkPermissions();
    if (status.location === 'denied' || status.coarseLocation === 'denied') {
      const asked = await Geolocation.requestPermissions();
      if (asked.location === 'denied' || asked.coarseLocation === 'denied') return null;
    }
    const pos = await Geolocation.getCurrentPosition({ timeout: 8000, enableHighAccuracy: false });
    return { lat: pos.coords.latitude, lon: pos.coords.longitude };
  } catch {
    return null;
  }
}

export async function initialSharedId(): Promise<string | null> {
  const params = new URLSearchParams(window.location.search);
  const local = params.get('fact') ?? params.get('gem');
  if (local) return local;
  if (!isNative) return null;
  try {
    const launch = await App.getLaunchUrl();
    if (!launch?.url) return null;
    const query = new URL(launch.url).searchParams;
    return query.get('fact') ?? query.get('gem');
  } catch {
    return null;
  }
}

export function onSharedLink(handler: (id: string) => void): void {
  if (!isNative) return;
  void App.addListener('appUrlOpen', (data) => {
    try {
      const id = new URL(data.url).searchParams.get('fact') ?? new URL(data.url).searchParams.get('gem');
      if (id) handler(id);
    } catch {
      return;
    }
  });
}

export async function initNative(): Promise<void> {
  if (!isNative) return;
  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setOverlaysWebView({ overlay: true });
    await StatusBar.setBackgroundColor({ color: '#0a0a0c' });
  } catch {
    return;
  }
  try {
    await SplashScreen.hide({ fadeOutDuration: 250 });
  } catch {
    return;
  }
}
