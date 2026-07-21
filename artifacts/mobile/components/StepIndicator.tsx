import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface Props {
  currentStep: number;
  totalSteps: number;
  label: string;
}

export function StepIndicator({ currentStep, totalSteps, label }: Props) {
  const colors = useColors();
  const progress = currentStep / totalSteps;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.stepText, { color: colors.mutedForeground }]}>
          Step {currentStep} of {totalSteps}
        </Text>
        <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.muted }]}>
        <View
          style={[
            styles.fill,
            {
              backgroundColor: colors.primary,
              width: `${progress * 100}%` as any,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  label: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  track: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: 4,
    borderRadius: 2,
  },
});
