import React, { useEffect, useState } from 'react';
import { Image, ImageSourcePropType, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart, PouchType, getTotalSteps } from '@/context/CartContext';
import { StepIndicator } from '@/components/StepIndicator';
import { PrimaryButton } from '@/components/PrimaryButton';
import * as Haptics from 'expo-haptics';

/**
 * Plain pouches aren't configurable here — they're sold from the ready-stock
 * catalog (Stock Pouches tab), so the wizard only covers printed and kraft.
 */
const OPTIONS: { type: PouchType; label: string; desc: string; image: ImageSourcePropType; detail: string }[] = [
  { type: 'printed', label: 'Printed Pouches', desc: 'Custom Printing', image: require('@/assets/images/gold-standy-pouch.jpg'), detail: 'Full-colour flexographic or digital printing for brand identity.' },
  { type: 'kraft', label: 'Kraft Pouches', desc: 'Natural & Premium Look', image: require('@/assets/images/kraft-standy-pouch-brown.jpg'), detail: 'Eco-friendly kraft paper with a natural, premium finish.' },
];

const isSelectable = (type?: PouchType): type is PouchType =>
  !!type && OPTIONS.some((o) => o.type === type);

export default function PouchTypeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { preset } = useLocalSearchParams<{ preset?: PouchType }>();
  const { setConfig } = useCart();
  const [selected, setSelected] = useState<PouchType | null>(isSelectable(preset) ? preset : null);
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  // Older links may still carry preset=plain, which no longer maps to an option.
  useEffect(() => { if (isSelectable(preset)) setSelected(preset); }, [preset]);

  // Arriving from a home category tile narrows this step to that one type.
  const visibleOptions = isSelectable(preset) ? OPTIONS.filter((o) => o.type === preset) : OPTIONS;

  const handleSelect = (type: PouchType) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setSelected(type);
  };

  const handleContinue = () => {
    if (!selected) return;
    setConfig({ pouchType: selected });
    router.push('/configure/window-option');
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StepIndicator currentStep={1} totalSteps={getTotalSteps(selected ?? undefined)} label="Choose Pouch Type" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={[styles.question, { color: colors.foreground }]}>
          {visibleOptions.length === 1
            ? 'Confirm your pouch type'
            : 'Choose the type of pouch you need'}
        </Text>
        {visibleOptions.map((opt) => {
          const active = selected === opt.type;
          return (
            <TouchableOpacity
              key={opt.type}
              activeOpacity={0.82}
              style={[
                styles.card,
                {
                  backgroundColor: active ? colors.primary + '12' : colors.card,
                  borderColor: active ? colors.primary : colors.border,
                  borderRadius: colors.radius,
                },
              ]}
              onPress={() => handleSelect(opt.type)}
            >
              <View style={styles.cardLeft}>
                <View style={[styles.iconWrap, { backgroundColor: colors.secondary, overflow: 'hidden' }]}>
                  <Image source={opt.image} style={styles.optionImage} resizeMode="cover" />
                </View>
                <View style={styles.textBlock}>
                  <Text style={[styles.optLabel, { color: colors.foreground }]}>{opt.label}</Text>
                  <Text style={[styles.optDesc, { color: colors.mutedForeground }]}>{opt.desc}</Text>
                  <Text style={[styles.optDetail, { color: colors.mutedForeground }]}>{opt.detail}</Text>
                </View>
              </View>
              <View style={[styles.radio, { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primary : 'transparent' }]}>
                {active && <Feather name="check" size={12} color="#fff" />}
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
  scroll: { padding: 20, gap: 12, paddingBottom: 20 },
  question: { fontSize: 17, fontFamily: 'Inter_600SemiBold', marginBottom: 4 },
  card: { flexDirection: 'row', alignItems: 'center', padding: 16, borderWidth: 1.5, gap: 12 },
  cardLeft: { flex: 1, flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  iconWrap: { width: 52, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  optionImage: { width: '100%', height: '100%' },
  textBlock: { flex: 1, gap: 3 },
  optLabel: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  optDesc: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  optDetail: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 17, marginTop: 2 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  footer: { padding: 20, borderTopWidth: 1 },
});
