/**
 * Screen 2 of the path: the React Native screen, mounted by RNActivity (a ReactActivity).
 *
 * ReactActivity is the one surface where BackHandler.setInterceptEnabled applies:
 *
 *   true  - React Native consumes the swipe. The system animation does not play; JS gets
 *           hardwareBackPress on commit and can pop its own stack.
 *   false - React Native lets go. The system animates the activity exit back to the native
 *           launcher, and returning true from hardwareBackPress can no longer cancel it.
 *
 * "Auto" is the pattern a brownfield screen wants: consume only while there is a JS screen to
 * pop, release at the root so leaving React Native gets the system animation.
 *
 * The stack is plain state plus BackHandler, deliberately not a navigation library, so the
 * behaviour under test is React Native core's own.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { BackHandler } from 'react-native';
import ReactNativeBrownfield from '@callstack/react-native-brownfield';

import {
  Button,
  Card,
  Copy,
  Fact,
  Log,
  Screen,
  Segmented,
  Title,
  useLog,
} from './ui';
import { hostConstants, openNativeHost } from './native';
import { useRnProgress } from './rnProgress';

const DEPTH_LIMIT = 3;

/** 'unset' means JS never calls setInterceptEnabled, so ReactActivity keeps its own default. */
type Ownership = 'unset' | 'auto' | 'consume' | 'release';

const OWNERSHIP_OPTIONS: ReadonlyArray<{ value: Ownership; label: string }> = [
  { value: 'auto', label: 'Auto' },
  { value: 'consume', label: 'Consume' },
  { value: 'release', label: 'Release' },
];

const OWNERSHIP_COPY: Record<Ownership, string> = {
  unset:
    'JS has not called setInterceptEnabled. ReactActivity is in whatever state it starts in. Picking any option ends this.',
  auto: 'RN consumes back only while a JS screen is pushed. At the root it lets go, so leaving gets the system animation.',
  consume:
    'RN always consumes back. JS pops its stack; at the root it returns false and the activity finishes without the system animation.',
  release:
    'RN never consumes back. The system animates the whole activity away, even with JS screens pushed.',
};

export default function RnScreenApp({
  initialOwnership = 'auto',
}: {
  initialOwnership?: Ownership;
}) {
  const [depth, setDepth] = useState(1);
  const [ownership, setOwnership] = useState<Ownership>(initialOwnership);
  const { lines, log } = useLog('screen2');
  const [progressView, progressLabel, progressEvents] = useRnProgress();

  const consumes = ownership === 'consume' || (ownership === 'auto' && depth > 1);

  useEffect(() => {
    if (ownership === 'unset') {
      log('ownership unset: setInterceptEnabled never called');
      return;
    }
    BackHandler.setInterceptEnabled(consumes);
    log(
      consumes ? 'setInterceptEnabled(true): RN consumes' : 'setInterceptEnabled(false): system owns',
      consumes ? 'warn' : 'good',
    );
  }, [consumes, ownership, log]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (depth > 1) {
        setDepth((current) => current - 1);
        log(`hardwareBackPress -> popped to depth ${depth - 1}`, 'good');
        return true;
      }
      log('hardwareBackPress at root -> not handled');
      return false;
    });
    return () => subscription.remove();
  }, [depth, log]);

  const push = useCallback(() => {
    setDepth((current) => Math.min(current + 1, DEPTH_LIMIT));
    log('pushed a JS screen');
  }, [log]);

  const pop = useCallback(() => {
    if (depth > 1) {
      setDepth((current) => current - 1);
      log('popped from the JS button');
    }
  }, [depth, log]);

  return (
    <Screen>
      <Title>{depth === 1 ? 'RN screen (root)' : `RN screen, depth ${depth}`}</Title>
      <Copy>
        Screen 2 of 3. A ReactActivity. Swipe from the left edge or press back: what animates
        depends on who owns back.
      </Copy>

      <Card title="Who owns back">
        <Segmented options={OWNERSHIP_OPTIONS} value={ownership} onChange={setOwnership} />
        <Copy>{OWNERSHIP_COPY[ownership]}</Copy>
        <Fact
          label="RN consumes now (JS view)"
          value={ownership === 'unset' ? 'unknown' : consumes ? 'yes' : 'no'}
        />
        {progressView}
        <Fact
          label="PredictiveBackAnimatedView"
          value={`${progressLabel} (${progressEvents} events)`}
        />
      </Card>

      <Card title="JS stack">
        <Fact label="depth" value={String(depth)} />
        <Button label="Push JS screen" onPress={push} />
        <Button label="Pop from JS" onPress={pop} />
      </Card>

      <Card title="Screen 3">
        <Copy>A native activity with a ReactNativeFragment inside. The host owns back there.</Copy>
        <Button
          label="Open native host with RN fragment"
          onPress={() => {
            log('starting NativeHostActivity');
            openNativeHost();
          }}
          tone="primary"
        />
      </Card>

      <Card title="popToNative">
        <Copy>
          The brownfield module calls Activity.onBackPressed() on the current activity, which
          goes through the same callbacks as a back press.
        </Copy>
        <Button
          label="popToNative"
          onPress={() => {
            log('popToNative');
            ReactNativeBrownfield.popToNative(false);
          }}
        />
      </Card>

      <Card title="Situation">
        <Fact
          label="targetSdk / device SDK"
          value={`${hostConstants.targetSdk} / ${hostConstants.deviceSdk}`}
        />
        <Fact
          label="androidx.activity progress callbacks"
          value={hostConstants.activityHasProgressCallbacks ? 'present (1.8+)' : 'missing'}
        />
      </Card>

      <Card title="Log">
        <Log lines={lines} empty="No back events yet." />
      </Card>
    </Screen>
  );
}
