import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart, calculatePrice, getMinOrder } from '@/context/CartContext';
import { StepIndicator } from '@/components/StepIndicator';
import { PrimaryButton } from '@/components/PrimaryButton';
import * as Haptics from 'expo-haptics';

export default function QuantityScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { config, setConfig } = useCart();
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const minOrder = getMinOrder(config.pouchType ?? 'plain');
  const [quantity, setQuantity] = useState(minOrder);
  const [artworkUpload, setArtworkUpload] = useState(false);

  const priceEstimate =
    config.pouchType && config.windowOption && config.materialType && config.capacity
      ? calculatePrice({
          pouchType: config.pouchType,
          windowOption: config.windowOption,
          materialType: config.materialType,
          capacity: config.capacity,
          quantity,
        })
      : 0;

  const step = 1000;

  const decrement = () => {
    if (quantity <= minOrder) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setQuantity(Math.max(minOrder, quantity - step));
  };

  const increment = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setQuantity(quantity + step);
  };

  const handleContinue = () => {
    setConfig({ quantity, artworkUpload });
    router.push('/configure/price-summary');
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StepIndicator currentStep={5} totalSteps={5} label="Quantity & Customisation" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={[styles.question, { color: colors.foreground }]}>
          Set your order quantity
        </Text>

        {/* Quantity Control */}
        <View style={[styles.qtyCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <Text style={[styles.qtyLabel, { color: colors.mutedForeground }]}>Quantity (pcs)</Text>
          <View style={styles.qtyRow}>
            <Pressable
              onPress={decrement}
              disabled={quantity <= minOrder}
              style={({ pressed }) => [
                styles.qtyBtn,
                { backgroundColor: colors.secondary, borderRadius: 10, opacity: quantity <= minOrder ? 0.4 : pressed ? 0.7 : 1 },
              ]}
            >
              <Feather name="minus" size={22} color={colors.primary} />
            </Pressable>
            <Text style={[styles.qtyValue, { color: colors.foreground }]}>
              {quantity.toLocaleString('en-IN')}
            </Text>
            <Pressable
              onPress={increment}
              style={({ pressed }) => [
                styles.qtyBtn,
                { backgroundColor: colors.secondary, borderRadius: 10, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Feather name="plus" size={22} color={colors.primary} />
            </Pressable>
          </View>
          <Text style={[styles.minNote, { color: colors.mutedForeground }]}>
            Minimum Order Quantity: {minOrder.toLocaleString('en-IN')} pcs
          </Text>
        </View>

        {/* Artwork Upload Toggle (for printed pouches) */}
        {config.pouchType === 'printed' && (
          <View style={[styles.artworkCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
            <View style={styles.artworkHeader}>
              <Feather name="upload" size={20} color={colors.primary} />
              <Text style={[styles.artworkTitle, { color: colors.foreground }]}>Artwork Upload</Text>
              <Text style={[styles.artworkSub, { color: colors.mutedForeground }]}>(For Printed Pouches)</Text>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.artworkUploadBtn,
                {
                  backgroundColor: artworkUpload ? colors.primary + '10' : colors.secondary,
                  borderColor: artworkUpload ? colors.primary : colors.border,
                  borderRadius: 10,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.selectionAsync();
                setArtworkUpload(!artworkUpload);
              }}
            >
              <Feather
                name={artworkUpload ? 'check-circle' : 'upload-cloud'}
                size={22}
                color={artworkUpload ? colors.primary : colors.mutedForeground}
              />
              <View>
                <Text style={[styles.uploadBtnText, { color: artworkUpload ? colors.primary : colors.foreground }]}>
                  {artworkUpload ? 'Artwork Marked Ready' : 'Upload Design File'}
                </Text>
                <Text style={[styles.uploadBtnSub, { color: colors.mutedForeground }]}>
                  PDF, AI, PNG, PSD (Max 50MB)
                </Text>
              </View>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.designHelpBtn, pressed && { opacity: 0.7 }]}>
              <Feather name="help-circle" size={16} color={colors.primary} />
              <Text style={[styles.designHelpText, { color: colors.primary }]}>Need Design Assistance?</Text>
            </Pressable>
          </View>
        )}

        {/* Live Price Estimate */}
        <View style={[styles.estimateCard, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30', borderRadius: colors.radius }]}>
          <View style={styles.estimateRow}>
            <Feather name="tag" size={16} color={colors.primary} />
            <Text style={[styles.estimateLabel, { color: colors.primary }]}>Estimated Price</Text>
            <Text style={[styles.estimatePrice, { color: colors.primary }]}>
              ₹{priceEstimate.toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={styles.estimateRow}>
            <Feather name="clock" size={16} color={colors.mutedForeground} />
            <Text style={[styles.estimateLabel, { color: colors.mutedForeground }]}>Delivery Time</Text>
            <Text style={[styles.estimateDelivery, { color: colors.mutedForeground }]}>12 – 15 Days</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.border, paddingBottom: bottomPad + 16 }]}>
        <PrimaryButton label="Calculate Price" onPress={handleContinue} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 20, gap: 16 },
  question: { fontSize: 17, fontFamily: 'Inter_600SemiBold', marginBottom: 4 },
  qtyCard: { padding: 20, borderWidth: 1, gap: 14 },
  qtyLabel: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  qtyBtn: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  qtyValue: { fontSize: 32, fontFamily: 'Inter_700Bold' },
  minNote: { fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  artworkCard: { padding: 16, borderWidth: 1, gap: 12 },
  artworkHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  artworkTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  artworkSub: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  artworkUploadBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderWidth: 1 },
  uploadBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  uploadBtnSub: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
  designHelpBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center' },
  designHelpText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  estimateCard: { padding: 16, borderWidth: 1, gap: 10 },
  estimateRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  estimateLabel: { flex: 1, fontSize: 13, fontFamily: 'Inter_500Medium' },
  estimatePrice: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  estimateDelivery: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  footer: { padding: 20, borderTopWidth: 1 },
});
