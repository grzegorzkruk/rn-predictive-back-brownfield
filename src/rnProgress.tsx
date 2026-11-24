/**
 * Probe for PredictiveBackProgressView from rn-predictive-back-progress.
 *
 * The view looks up its activity when it attaches, so in a brownfield app it reports progress
 * from whichever activity hosts this surface. While `active` is true it also takes the gesture,
 * so pass true only while this surface should own back.
 *
 * The handler runs on the JS thread on purpose, so the label can be read from a snapshot.
 */

import React, { useCallback, useState } from 'react';
import { PredictiveBackProgressView } from 'rn-predictive-back-progress';

const PHASES = ['start', 'progress', 'cancel', 'commit'];

export function useRnProgress(active: boolean): [React.ReactElement, string, number] {
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

  return [
    <PredictiveBackProgressView key="pb" active={active} onProgress={onProgress} />,
    label,
    events,
  ];
}
