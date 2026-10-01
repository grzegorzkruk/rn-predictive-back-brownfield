/**
 * Screen 2 of the path: the React Native screen, mounted by RNActivity.
 *
 * RNActivity is a ReactActivity, so this surface gets React Native's own back behaviour:
 *
 *   - On targetSdk 36, ReactActivity registers a commit-only callback plus a system
 *     navigation observer. JS `hardwareBackPress` no longer comes from
 *     Activity.onBackPressed().
 *   - While RN consumes the gesture, the system animation does not play: an enabled
 *     callback at PRIORITY_DEFAULT claims the swipe.
 *   - `setInterceptEnabled(false)` hands the swipe back to the system. JS is still told
 *     about the commit, through the observer, but a `true` return can no longer cancel it.
 *
 * The stack is plain state plus BackHandler, deliberately not a navigation library. This app
 * asks who owns the gesture; a JS stack answers that with React Native core semantics only.
 * A library stack would move the same question into FragmentManager instead.
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
  SwitchRow,
  Title,
  useLog,
} from './ui';
import {
  addHostModeListener,
  hasBackProbe,
  hostConstants,
  openNativeHost,
} from './native';

const DEPTH_LIMIT = 3;

export default function RnScreenApp() {
  const [depth, setDepth] = useState(1);
  const [jsConsumes, setJsConsumes] = useState(true);
  const { lines, log } = useLog();

  // RN's consuming state, mirrored natively. An enabled RN callback suppresses the system
  // animation; a released one lets the system animate and delivers only the commit.
  useEffect(() => {
    BackHandler.setInterceptEnabled(jsConsumes);
    log(
      jsConsumes
        ? 'RN consumes the gesture (setInterceptEnabled true)'
        : 'RN released the gesture (setInterceptEnabled false)',
      jsConsumes ? 'warn' : 'good',
    );
  }, [jsConsumes, log]);

  // Restore the default when this activity goes away, so the next surface starts known.
  useEffect(
    () => () => {
      BackHandler.setInterceptEnabled(true);
    },
    [],
  );

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (depth > 1) {
        setDepth((current) => current - 1);
        log(`hardwareBackPress -> popped to depth ${depth - 1}`, 'good');
        return true;
      }
      // Nothing left to pop in JS. Return false so the activity finishes and the native
      // launcher becomes visible again.
      log('hardwareBackPress at RN root -> unhandled, activity finishes');
      return false;
    });
    return () => subscription.remove();
  }, [depth, log]);

  useEffect(() => {
    log(
      `targetSdk ${hostConstants.targetSdk}, device SDK ${hostConstants.deviceSdk}`,
    );
    if (hostConstants.targetSdk >= 36) {
      log('targetSdk 36+: predictive back cannot be opted out', 'warn');
    }
    if (hasBackProbe) {
      addHostModeListener((mode) => log(`host back mode -> ${mode}`));
    }
  }, [log]);

  const push = useCallback(() => {
    setDepth((current) => Math.min(current + 1, DEPTH_LIMIT));
    log('pushed an RN screen');
  }, [log]);

  const pop = useCallback(() => {
    if (depth > 1) {
      setDepth((current) => current - 1);
      log('popped from the JS button');
    }
  }, [depth, log]);

  const backToNative = useCallback(() => {
    log('popToNative -> back to the launcher activity');
    ReactNativeBrownfield.popToNative(false);
  }, [log]);

  return (
    <Screen>
      <Title>{depth === 1 ? 'RN screen (root)' : `RN screen, depth ${depth}`}</Title>
      <Copy>
        This activity is a ReactActivity. Swipe from the left edge or press back: what
        animates depends on the switch below.
      </Copy>

      <Card title="Who consumes the gesture">
        <SwitchRow
          label="RN consumes back"
          hint={
            jsConsumes
              ? 'ReactActivity holds the gesture, so JS can pop this stack. No system animation.'
              : 'ReactActivity released it: the system animates the exit and JS is told afterwards.'
          }
          value={jsConsumes}
          onValueChange={setJsConsumes}
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
        <Fact label="RN activity type" value="ReactActivity" />
      </Card>

      <Card title="In-app stack">
        <Button label="Push RN screen" onPress={push} />
        <Button label="Pop from JS" onPress={pop} />
      </Card>

      <Card title="Screen 3">
        <Copy>
          A native activity that embeds a ReactNativeFragment. The host owns the gesture
          there; this activity only comes back through the system back stack.
        </Copy>
        <Button
          label="Open native host with RN fragment"
          onPress={() => {
            log('starting NativeHostActivity (screen 3)');
            openNativeHost();
          }}
          tone="primary"
        />
      </Card>

      <Card title="popToNative">
        <Copy>
          The brownfield module implements this as a plain Activity.onBackPressed() on the
          current activity. With RN consuming and a stack to pop, that pops JS; at the root
          it finishes the activity and the launcher is visible again.
        </Copy>
        <Button label="popToNative" onPress={backToNative} />
      </Card>

      <Card title="Log">
        <Log lines={lines} empty="No back events yet." />
      </Card>
    </Screen>
  );
}
