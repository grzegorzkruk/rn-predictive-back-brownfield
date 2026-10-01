/**
 * Screen 3 of the path: content inside a ReactNativeFragment, hosted by a native activity.
 *
 * The fragment is not a ReactActivity, so nothing React Native does with back applies here:
 *
 *   - BackHandler.setInterceptEnabled reaches for a ReactActivity and finds none, so it is a
 *     no-op. The host's dispatcher is untouched by this tree.
 *   - The brownfield ReactNativeFragment installs its own OnBackPressedCallback on the host,
 *     enabled, which turns a commit into ReactDelegate.onBackPressed() -> JS
 *     hardwareBackPress. While that callback is enabled it claims the gesture: no system
 *     animation, no FragmentManager.
 *
 * So the choice in this activity is the host's, not React Native's, and the switch below
 * just reports what the host is doing. hardwareBackPress still arrives, which is what lets
 * this tree keep or release the screen.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Animated, BackHandler, Easing } from 'react-native';

import {
  Button,
  Card,
  Copy,
  COLORS,
  Fact,
  Log,
  Screen,
  SwitchRow,
  Title,
  useLog,
} from './ui';
import {
  addHostBackProgressListener,
  addHostModeListener,
  hostConstants,
  setHostBackMode,
} from './native';

export default function EmbedApp() {
  const [keepOnCommit, setKeepOnCommit] = useState(false);
  const [hostConsumes, setHostConsumes] = useState(true);
  const { lines, log } = useLog();

  // Keep the listener in a ref so the subscription is registered once but still reads the
  // current switch value. A stale closure here is the classic way these demos log the wrong
  // decision.
  const keepRef = useRef(keepOnCommit);
  keepRef.current = keepOnCommit;

  // Driven by the host's progress events. Only moves while the host callback owns the swipe,
  // which is exactly when the system will not animate anything for us.
  const slideX = useRef(new Animated.Value(0)).current;
  const [progressLabel, setProgressLabel] = useState('idle');

  useEffect(() => {
    const off = addHostBackProgressListener(({phase, progress}) => {
      setProgressLabel(`${phase} ${progress.toFixed(2)}`);
      Animated.timing(slideX, {
        toValue: progress * 72,
        duration: phase === 'progress' ? 16 : 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    });
    return off;
  }, [slideX]);

  useEffect(() => {
    const off = addHostModeListener((mode) => {
      setHostConsumes(mode === 'consume');
      log(`host back mode -> ${mode}`, mode === 'system' ? 'good' : 'warn');
    });
    return off;
  }, [log]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      const keep = keepRef.current;
      log(
        keep
          ? 'hardwareBackPress -> kept this screen'
          : 'hardwareBackPress -> released, host finishes',
        keep ? 'good' : 'warn',
      );
      return keep;
    });
    return () => subscription.remove();
  }, [log]);

  return (
    <Screen>
      <Animated.View
        style={{
          transform: [{translateX: slideX}],
          opacity: slideX.interpolate({
            inputRange: [0, 72],
            outputRange: [1, 0.55],
          }),
        }}>
        <Title>Embedded RN fragment</Title>
      </Animated.View>

      <Copy>
        A ReactNativeFragment inside a plain AppCompatActivity. It shares the host's
        dispatcher instead of owning one, so React Native's back switches do not apply here.
      </Copy>

      <Card title="Host owns the gesture" tone="embed">
        <SwitchRow
          label="Host callback consumes back"
          hint={
            hostConsumes
              ? 'Host callback is enabled: progress comes here, and the system animation is suppressed.'
              : 'No host callback: the system pops this activity and this tree never hears the swipe.'
          }
          value={hostConsumes}
          onValueChange={(next) => {
            setHostConsumes(next);
            setHostBackMode(next ? 'consume' : 'system');
          }}
        />
        <Fact label="gesture" value={progressLabel} />
      </Card>

      <Card title="What JS does with a commit" tone="embed">
        <SwitchRow
          label="Keep this screen when the host forwards a commit"
          hint="hardwareBackPress returns true to stay, false so the host finishes the activity."
          value={keepOnCommit}
          onValueChange={setKeepOnCommit}
        />
      </Card>

      <Card title="Situation" tone="embed">
        <Fact
          label="targetSdk / device SDK"
          value={`${hostConstants.targetSdk} / ${hostConstants.deviceSdk}`}
        />
        <Fact
          label="androidx.activity progress callbacks"
          value={hostConstants.activityHasProgressCallbacks ? 'present (1.8+)' : 'missing'}
        />
        <Fact label="host activity type" value="AppCompatActivity" />
      </Card>

      <Card title="Log" tone="embed">
        <Log lines={lines} empty="No commit forwarded yet." />
      </Card>
    </Screen>
  );
}

export const EMBED_BACKGROUND = COLORS.background;
