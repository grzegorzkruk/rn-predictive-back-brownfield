/**
 * Native <-> React Native bridge for this demo.
 *
 * The native app registers one legacy module, "BackProbe". It is deliberately small:
 *
 *   constants  - what the device and the classpath can do, read once
 *   events     - what the host decided about the gesture, pushed as it happens
 *   one method - ask the host to change who consumes back
 *
 * Everything else goes through stock APIs: BackHandler for hardwareBackPress, and
 * @callstack/react-native-brownfield for popToNative.
 *
 * There are no synchronous methods. A legacy module answers those only through the
 * legacy interop layer, and this app runs the new architecture.
 */

import { DeviceEventEmitter, NativeModules, Platform } from 'react-native';

export type HostBackMode = 'system' | 'consume' | 'forward';

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

type BackProbeSpec = {
  CONSTANTS?: HostConstants;
  setHostBackMode(mode: HostBackMode): void;
  openNativeHost(): void;
};

const FALLBACK: HostConstants = {
  targetSdk: 0,
  deviceSdk: 0,
  activityHasProgressCallbacks: false,
};

const probe = NativeModules.BackProbe as BackProbeSpec | undefined;

export const hasBackProbe = probe != null && Platform.OS === 'android';

export const hostConstants: HostConstants = probe?.CONSTANTS ?? FALLBACK;

export function setHostBackMode(mode: HostBackMode): void {
  probe?.setHostBackMode(mode);
}

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

/** Pushed whenever the host's back callback changes state. */
export const addHostModeListener = (listener: (mode: HostBackMode) => void) =>
  on<HostBackMode>('HostBackMode', listener);

/**
 * Pushed while the host's callback owns the swipe. That is exactly the case where neither
 * the system animation nor FragmentManager can run, so the in-app animation has to be
 * driven by whoever received these events.
 */
export const addHostBackProgressListener = (listener: (event: HostBackProgress) => void) =>
  on<HostBackProgress>('HostBackProgress', listener);
