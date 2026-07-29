import React, { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart, Capacity, getCapacitySize, getTotalSteps, hasMaterialStep } from '@/context/CartContext';
import { StepIndicator } from '@/components/StepIndicator';
import { PrimaryButton } from '@/components/PrimaryButton';
import * as Haptics from 'expo-haptics';

const CAPS: { value: Capacity; label: string; popular?: boolean }[] = [
  { value: '50g', label: '50g' },
  { value: '100g', label: '100g' },
  { value: '250g', label: '250g', popular: true },
  { value: '500g', label: '500g' },
  { value: '1kg', label: '1kg' },
];

export default function CapacityScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { config, setConfig } = useCart();
  const [selected, setSelected] = useState<Capacity | null>(null);
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const handleSelect = (v: Capacity) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setSelected(v);
  };

  const handleContinue = () => {
    if (!selected) return;
    setConfig({ capacity: selected, pouchSize: getCapacitySize(selected) });
    router.push('/configure/quantity');
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StepIndicator
        currentStep={hasMaterialStep(config.pouchType) ? 4 : 3}
        totalSteps={getTotalSteps(config.pouchType)}
        label="Capacity / Size"
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={[styles.question, { color: colors.foreground }]}>Choose the capacity / size</Text>

        <View style={styles.grid}>
          {CAPS.map((cap) => {
            const active = selected === cap.value;
            return (
              <TouchableOpacity
                key={cap.value}
                activeOpacity={0.8}
                style={[
                  styles.capCard,
                  {
                    backgroundColor: active ? colors.primary : colors.card,
                    borderColor: active ? colors.primary : colors.border,
                    borderRadius: colors.radius,
                  },
                ]}
                onPress={() => handleSelect(cap.value)}
              >
                {cap.popular && (
                  <View style={[styles.popularBadge, { backgroundColor: colors.accent }]}>
                    <Text style={styles.popularText}>Popular</Text>
                  </View>
                )}
                <Text style={[styles.capLabel, { color: active ? '#fff' : colors.foreground }]}>
                  {cap.label}
                </Text>
                <Text style={[styles.capSize, { color: active ? 'rgba(255,255,255,0.75)' : colors.mutedForeground }]}>
                  {getCapacitySize(cap.value)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {selected && (
          <View style={[styles.selectedInfo, { backgroundColor: colors.secondary, borderRadius: colors.radius }]}>
            <Feather name="info" size={16} color={colors.primary} />
            <View>
              <Text style={[styles.infoTitle, { color: colors.primary }]}>Selected: {selected}</Text>
              <Text style={[styles.infoSub, { color: colors.mutedForeground }]}>
                Pouch Size (W×H): {getCapacitySize(selected)}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
      <View style={[styles.footer, { borderTopColor: colors.border, paddingBottom: bottomPad + 16 }]}>
        <PrimaryButton label="Continue" onPress={handleContinue} disabled={!selected} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 20, gap: 16, paddingBottom: 20 },
  question: { fontSize: 17, fontFamily: 'Inter_600SemiBold', marginBottom: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  capCard: {
    width: '30%', minWidth: 90, aspectRatio: 1,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, gap: 4, position: 'relative', overflow: 'hidden',
  },
  popularBadge: { position: 'absolute', top: 0, right: 0, paddingHorizontal: 6, paddingVertical: 3, borderBottomLeftRadius: 6 },
  popularText: { fontSize: 8, fontFamily: 'Inter_700Bold', color: '#fff' },
  capLabel: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  capSize: { fontSize: 10, fontFamily: 'Inter_400Regular', textAlign: 'center', paddingHorizontal: 4 },
  selectedInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  infoTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  infoSub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  footer: { padding: 20, borderTopWidth: 1 },
});
