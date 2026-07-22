import React, { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart, MaterialType } from '@/context/CartContext';
import { StepIndicator } from '@/components/StepIndicator';
import { PrimaryButton } from '@/components/PrimaryButton';
import * as Haptics from 'expo-haptics';

const OPTIONS: { value: MaterialType; label: string; desc: string; icon: string; pros: string[] }[] = [
  {
    value: 'metalised',
    label: 'Metalised',
    desc: 'Better protection. Keeps product fresh for longer.',
    icon: 'shield',
    pros: ['Superior barrier properties', 'UV & moisture resistant', 'Premium shelf appearance'],
  },
  {
    value: 'non-metalised',
    label: 'Non-Metalised',
    desc: 'More transparency. Good for product visibility.',
    icon: 'aperture',
    pros: ['Higher transparency', 'Lighter weight', 'Eco-friendly option'],
  },
];

export default function MaterialTypeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { setConfig } = useCart();
  const [selected, setSelected] = useState<MaterialType | null>(null);
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const handleSelect = (v: MaterialType) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setSelected(v);
  };

  const handleContinue = () => {
    if (!selected) return;
    setConfig({ materialType: selected });
    router.push('/configure/capacity');
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StepIndicator currentStep={3} totalSteps={5} label="Material Type" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={[styles.question, { color: colors.foreground }]}>
          Select material combination
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
              <View style={styles.prosList}>
                {opt.pros.map((p) => (
                  <View key={p} style={styles.proRow}>
                    <Feather name="check-circle" size={13} color={active ? colors.primary : colors.mutedForeground} />
                    <Text style={[styles.proText, { color: active ? colors.foreground : colors.mutedForeground }]}>{p}</Text>
                  </View>
                ))}
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
  card: { borderWidth: 1.5, padding: 16, gap: 14 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconWrap: { width: 52, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  textBlock: { flex: 1, gap: 3 },
  optLabel: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  optDesc: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  prosList: { gap: 7, marginLeft: 4 },
  proRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  proText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  footer: { padding: 20, borderTopWidth: 1 },
});
