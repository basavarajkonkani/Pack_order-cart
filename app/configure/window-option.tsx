import React, { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart, WindowOption, hasMaterialStep, getTotalSteps } from '@/context/CartContext';
import { StepIndicator } from '@/components/StepIndicator';
import { PrimaryButton } from '@/components/PrimaryButton';
import * as Haptics from 'expo-haptics';

const OPTIONS: { value: WindowOption; label: string; desc: string; icon: string; benefit: string }[] = [
  { value: 'with', label: 'With Window', desc: 'Transparent window on the pouch', icon: 'eye', benefit: 'Lets customers see the product inside. Great for food, snacks, and premium items.' },
  { value: 'without', label: 'Without Window', desc: 'Fully sealed pouch', icon: 'eye-off', benefit: 'Full print area on both sides. Better barrier protection. Lower cost.' },
];

export default function WindowOptionScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { config, setConfig } = useCart();
  const [selected, setSelected] = useState<WindowOption | null>(null);
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const handleSelect = (v: WindowOption) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setSelected(v);
  };

  const handleContinue = () => {
    if (!selected) return;
    // Kraft is paper-based, so it has no metalised option — skip that step.
    if (!hasMaterialStep(config.pouchType)) {
      setConfig({ windowOption: selected, materialType: undefined });
      router.push('/configure/capacity');
      return;
    }
    setConfig({ windowOption: selected });
    router.push('/configure/material-type');
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StepIndicator currentStep={2} totalSteps={getTotalSteps(config.pouchType)} label="Window Option" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={[styles.question, { color: colors.foreground }]}>
          Do you need a window in your pouch?
        </Text>
        {OPTIONS.map((opt) => {
          const active = selected === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              activeOpacity={0.82}
              style={[
                styles.card,
                {
                  backgroundColor: active ? colors.primary + '12' : colors.card,
                  borderColor: active ? colors.primary : colors.border,
                  borderRadius: colors.radius,
                },
              ]}
              onPress={() => handleSelect(opt.value)}
            >
              <View style={styles.cardTop}>
                <View style={[styles.iconWrap, { backgroundColor: active ? colors.primary : colors.secondary }]}>
                  <Feather name={opt.icon as any} size={26} color={active ? '#fff' : colors.primary} />
                </View>
                <View style={styles.textBlock}>
                  <Text style={[styles.optLabel, { color: colors.foreground }]}>{opt.label}</Text>
                  <Text style={[styles.optDesc, { color: colors.mutedForeground }]}>{opt.desc}</Text>
                </View>
                <View style={[styles.radio, { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primary : 'transparent' }]}>
                  {active && <Feather name="check" size={12} color="#fff" />}
                </View>
              </View>
              <View style={[styles.benefitRow, { backgroundColor: active ? colors.primary + '08' : colors.muted, borderRadius: 8 }]}>
                <Feather name="info" size={13} color={active ? colors.primary : colors.mutedForeground} />
                <Text style={[styles.benefit, { color: active ? colors.primary : colors.mutedForeground }]}>{opt.benefit}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <View style={[styles.footer, { borderTopColor: colors.border, paddingBottom: bottomPad + 16 }]}>
        <PrimaryButton label="Continue" onPress={handleContinue} disabled={!selected} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 20, gap: 14, paddingBottom: 20 },
  question: { fontSize: 17, fontFamily: 'Inter_600SemiBold', marginBottom: 4 },
  card: { borderWidth: 1.5, padding: 16, gap: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconWrap: { width: 52, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  textBlock: { flex: 1, gap: 3 },
  optLabel: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  optDesc: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  benefitRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 10 },
  benefit: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 17 },
  footer: { padding: 20, borderTopWidth: 1 },
});
