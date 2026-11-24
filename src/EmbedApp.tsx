/**
 * Screen 3 of the path: content inside a ReactNativeFragment, hosted by a native activity.
 *
 * The host is not a ReactActivity, so the BackHandler `intercept` option has no effect here.
 * NativeHostActivity decides who owns back, and this tree only reports it:
 *
 *   fragment - stock react-native-brownfield. Its always-enabled callback claims the swipe,
 *              so no system animation, no progress, and the commit arrives here.
 *   system   - the host disabled that callback. The system animates the activity away and
 *              this tree never hears about it.
 *   host     - the host's own callback owns the swipe, sends progress here, and forwards
 *              the commit as hardwareBackPress.
 *
 * Whenever a commit arrives, returning true keeps the screen and false lets the host finish.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Animated, BackHandler } from 'react-native';

import { Button, Card, Copy, Fact, Log, Screen, SwitchRow, Title, useLog } from './ui';
import { useRnProgress } from './rnProgress';
import {
  addHostBackProgressListener,
  addHostModeListener,
  hostConstants,
  type HostBackMode,
} from './native';

const MODE_COPY: Record<HostBackMode, string> = {
  fragment:
    'The brownfield fragment callback is enabled. It claims the swipe: no system animation, no progress, and the commit comes here as hardwareBackPress.',
  system:
    'No callback is enabled. The system animates this activity away, and this tree is never told.',
  host: 'The host callback owns the swipe. It animates the native container, sends progress here, and forwards the commit as hardwareBackPress.',
};

export default function EmbedApp() {
  const [keepOnCommit, setKeepOnCommit] = useState(false);
  const [intercept, setIntercept] = useState(false);
  const [mode, setMode] = useState<HostBackMode>('fragment');
  const [progressLabel, setProgressLabel] = useState('idle');
  const { lines, log } = useLog('screen3');
  // Observer only: the host decides who owns back here, so this view never takes the gesture.
  const [progressView, rnProgressLabel, rnProgressEvents] = useRnProgress(false);

  // Read through a ref so the listener is registered once but still sees the current value.
  const keepRef = useRef(keepOnCommit);
  keepRef.current = keepOnCommit;

  const progress = useRef(new Animated.Value(0)).current;

  const subscriptionRef = useRef<ReturnType<typeof BackHandler.addEventListener> | null>(null);

  useEffect(
    () =>
      addHostBackProgressListener(({ phase, progress: value }) => {
        setProgressLabel(`${phase} ${value.toFixed(2)}`);
        if (phase === 'cancelled' || phase === 'committed') {
          Animated.timing(progress, {
            toValue: 0,
            duration: 180,
            useNativeDriver: true,
          }).start();
          log(`host: ${phase}`);
        } else {
          progress.setValue(value);
        }
      }),
    [log, progress],
  );

  useEffect(
    () =>
      addHostModeListener((next) => {
        setMode(next);
        log(`host mode -> ${next}`);
      }),
    [log],
  );

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
    subscriptionRef.current = subscription;
    return () => {
      subscriptionRef.current = null;
      subscription.remove();
    };
  }, [log]);

  return (
    <Screen>
      <Animated.View
        style={{
          transform: [
            {
              translateX: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 40],
              }),
            },
          ],
          opacity: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 0.5],
          }),
        }}>
        <Title>Embedded RN fragment</Title>
      </Animated.View>

      <Copy>
        A ReactNativeFragment inside a plain AppCompatActivity. It shares the host's
        dispatcher, so React Native's back switches do not apply here.
      </Copy>

      <Card title={`Host mode: ${mode}`} tone="embed">
        <Copy>{MODE_COPY[mode]}</Copy>
        <Fact label="progress seen by JS" value={progressLabel} />
      </Card>

      <Card title="React Native core APIs here" tone="embed">
        <Copy>
          Both act on currentActivity, which is this AppCompatActivity, not a ReactActivity.
        </Copy>
        {progressView}
        <Fact
          label="PredictiveBackProgressView"
          value={`${rnProgressLabel} (${rnProgressEvents} events)`}
        />
        <Fact label="this listener's intercept" value={String(intercept)} />
        <Button
          label={
            intercept ? 'Stop asking for back (intercept: false)' : 'Ask for back (intercept: true)'
          }
          onPress={() => {
            const next = !intercept;
            subscriptionRef.current?.setInterceptEnabled(next);
            setIntercept(next);
            log(`intercept: ${next} on this listener (no effect: host is not a ReactActivity)`);
          }}
        />
      </Card>

      <Card title="What JS does with a commit" tone="embed">
        <SwitchRow
          label="Keep this screen on commit"
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
      </Card>

      <Card title="Log" tone="embed">
        <Log lines={lines} empty="No commit forwarded yet." />
      </Card>
    </Screen>
  );
}
