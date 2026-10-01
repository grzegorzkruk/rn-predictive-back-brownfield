/**
 * Shared building blocks for both React Native surfaces in this app.
 *
 * The full-screen RN screen and the embedded fragment need the same three things: a switch
 * that decides who consumes the back gesture, a timestamped log of what actually happened,
 * and a way back into the native app.
 */

import React, { useCallback, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

export const COLORS = {
  background: '#0B1020',
  surface: '#132043',
  surfaceAlt: '#0F1A38',
  border: '#24365F',
  text: '#F2F5FF',
  muted: '#93A2C6',
  accent: '#4C8DFF',
  warn: '#FFB454',
  good: '#48D5A0',
  embed: '#132B24',
};

export type LogLine = {time: string; text: string; tone?: 'good' | 'warn'};

/** Append-only log, newest first, with millisecond timestamps. */
export function useLog(max = 14) {
  const [lines, setLines] = useState<LogLine[]>([]);
  const seq = useRef(0);

  const log = useCallback(
    (text: string, tone?: LogLine['tone']) => {
      seq.current += 1;
      const time = new Date().toISOString().slice(11, 23);
      setLines((prev) => [{time, text, tone}, ...prev].slice(0, max));
    },
    [max],
  );

  return {lines, log};
}

export function Screen({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <ScrollView
      contentContainerStyle={[styles.screenContent, style]}
      keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  );
}

export function Title({children}: {children: React.ReactNode}) {
  return <Text style={styles.title}>{children}</Text>;
}

export function Copy({children}: {children: React.ReactNode}) {
  return <Text style={styles.copy}>{children}</Text>;
}

export function Card({
  title,
  children,
  tone = 'default',
}: {
  title?: string;
  children: React.ReactNode;
  tone?: 'default' | 'embed';
}) {
  return (
    <View
      style={[
        styles.card,
        tone === 'embed' ? {backgroundColor: COLORS.embed} : null,
      ]}>
      {title != null ? <Text style={styles.cardTitle}>{title}</Text> : null}
      {children}
    </View>
  );
}

export function SwitchRow({
  label,
  hint,
  value,
  onValueChange,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        {hint != null ? <Text style={styles.rowHint}>{hint}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{true: COLORS.accent, false: COLORS.border}}
        thumbColor={value ? COLORS.text : COLORS.muted}
      />
    </View>
  );
}

export function Button({
  label,
  onPress,
  tone = 'default',
}: {
  label: string;
  onPress: () => void;
  tone?: 'default' | 'primary';
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({pressed}) => [
        styles.button,
        tone === 'primary' ? styles.buttonPrimary : null,
        pressed ? styles.buttonPressed : null,
      ]}>
      <Text style={styles.buttonLabel}>{label}</Text>
    </Pressable>
  );
}

export function Log({lines, empty}: {lines: LogLine[]; empty: string}) {
  return (
    <View style={styles.log}>
      {lines.length === 0 ? (
        <Text style={styles.logEmpty}>{empty}</Text>
      ) : (
        lines.map((line, index) => (
          <Text
            // eslint-disable-next-line react/no-array-index-key
            key={`${line.time}-${index}`}
            style={[
              styles.logLine,
              line.tone === 'good' ? styles.logGood : null,
              line.tone === 'warn' ? styles.logWarn : null,
            ]}>
            {line.time}  {line.text}
          </Text>
        ))
      )}
    </View>
  );
}

/** Small key/value line, for the "what is the situation right now" cards. */
export function Fact({label, value}: {label: string; value: string}) {
  return (
    <View style={styles.fact}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={styles.factValue}>{value}</Text>
    </View>
  );
}

const styles = {
  screenContent: {
    padding: 16,
    paddingBottom: 56,
    gap: 12,
    backgroundColor: COLORS.background,
    flexGrow: 1,
  },
  title: {color: COLORS.text, fontSize: 24, fontWeight: '700'},
  copy: {color: COLORS.muted, fontSize: 13, lineHeight: 19},
  card: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    padding: 14,
    gap: 10,
  },
  cardTitle: {color: COLORS.text, fontSize: 15, fontWeight: '600'},
  row: {flexDirection: 'row', alignItems: 'center', gap: 12},
  rowText: {flex: 1, gap: 2},
  rowLabel: {color: COLORS.text, fontSize: 14},
  rowHint: {color: COLORS.muted, fontSize: 12, lineHeight: 17},
  button: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.surface,
  },
  buttonPrimary: {backgroundColor: COLORS.accent, borderColor: COLORS.accent},
  buttonPressed: {opacity: 0.7},
  buttonLabel: {color: COLORS.text, fontSize: 14, fontWeight: '600'},
  log: {gap: 4},
  logEmpty: {color: COLORS.muted, fontSize: 12, fontStyle: 'italic'},
  logLine: {
    color: COLORS.text,
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    lineHeight: 18,
  },
  logGood: {color: COLORS.good},
  logWarn: {color: COLORS.warn},
  fact: {flexDirection: 'row', justifyContent: 'space-between', gap: 12},
  factLabel: {color: COLORS.muted, fontSize: 12, flex: 1},
  factValue: {color: COLORS.text, fontSize: 12, fontWeight: '600'},
} as const;
