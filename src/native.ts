/**
 * Native <-> React Native bridge for this demo.
 *
 * The native app registers one legacy module, "BackProbe":
 *
 *   constants  - what the device and the classpath can do, read once
 *   one method - open screen 3 (NativeHostActivity)
 *
 * NativeHostActivity pushes what it decided about the gesture as device events. Everything
 * else goes through stock APIs: BackHandler for hardwareBackPress, and
 * @callstack/react-native-brownfield for popToNative.
 */

import { DeviceEventEmitter, NativeModules, Platform } from 'react-native';

/** Who owns back on screen 3. Mirrors NativeHostActivity.Mode. */
export type HostBackMode = 'fragment' | 'system' | 'host';

export type HostConstants = {
  /** Target SDK of the installed APK. 36+ means predictive back cannot be opted out of. */
  targetSdk: number;
  /** Build.VERSION.SDK_INT of the device. */
  deviceSdk: number;
  /** Whether androidx.activity's OnBackPressedCallback has the progress callbacks (1.8+). */
  activityHasProgressCallbacks: boolean;
};

export type HostBackProgress = {
  phase: 'started' | 'progress' | 'cancelled' | 'committed';
  progress: number;
};

type BackProbeSpec = HostConstants & {
  openNativeHost(): void;
};

const probe = NativeModules.BackProbe as BackProbeSpec | undefined;

export const hasBackProbe = probe != null && Platform.OS === 'android';

export const hostConstants: HostConstants = {
  targetSdk: probe?.targetSdk ?? 0,
  deviceSdk: probe?.deviceSdk ?? 0,
  activityHasProgressCallbacks: probe?.activityHasProgressCallbacks === true,
};

export function openNativeHost(): void {
  probe?.openNativeHost();
}

function on<T>(event: string, listener: (payload: T) => void): () => void {
  if (!hasBackProbe) {
    return () => {};
  }
  const sub = DeviceEventEmitter.addListener(event, listener);
  return () => sub.remove();
}

/** Pushed when the host switches who owns back. */
export const addHostModeListener = (listener: (mode: HostBackMode) => void) =>
  on<HostBackMode>('HostBackMode', listener);

/**
 * Pushed while the host's own callback owns the swipe. Neither the system animation nor
 * FragmentManager runs in that case, so whoever receives these drives the in-app animation.
 */
export const addHostBackProgressListener = (listener: (event: HostBackProgress) => void) =>
  on<HostBackProgress>('HostBackProgress', listener);
