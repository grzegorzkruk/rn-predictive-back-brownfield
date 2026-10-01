/**
 * Probe for the branch's PredictiveBackAnimatedView.
 *
 * The view registers itself as a progress listener on `reactContext.currentActivity` when it
 * attaches, and only if that activity is a ReactActivity. In a brownfield app that is the
 * question: does a given surface get progress at all, and from which activity?
 *
 * The handler runs on the JS thread on purpose, so the label can be read from a snapshot.
 */

import React, { useCallback, useState } from 'react';
import { PredictiveBackAnimatedView } from 'react-native';

const PHASES = ['start', 'progress', 'cancel', 'commit'];

export function useRnProgress(): [React.ReactElement, string, number] {
  const [label, setLabel] = useState('no event yet');
  const [events, setEvents] = useState(0);

  const onProgress = useCallback(
    (e: {nativeEvent: {progress: number; phase: number}}) => {
      const {progress, phase} = e.nativeEvent;
      setLabel(`${PHASES[phase] ?? phase} ${progress.toFixed(2)}`);
      setEvents((n) => n + 1);
    },
    [],
  );

  return [<PredictiveBackAnimatedView key="pb" onProgress={onProgress} />, label, events];
}
