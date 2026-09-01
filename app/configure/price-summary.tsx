import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart, calculatePrice, getPouchLabel, getCapacitySize, hasMaterialStep } from '@/context/CartContext';
import { PrimaryButton } from '@/components/PrimaryButton';
import { usePrintedPricing } from '@/hooks/usePrintedPricing';
import { calculatePrintedPrice, getCombinationKey } from '@/lib/printedPouchPricing';
import * as Haptics from 'expo-haptics';

export default function PriceSummaryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { config, addToCart, resetConfig } = useCart();
  const { pricing } = usePrintedPricing();
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const materialRequired = hasMaterialStep(config.pouchType);
  const isComplete =
    config.pouchType && config.windowOption && config.capacity && config.quantity &&
    (!materialRequired || config.materialType);

  // Printed pouches use live Firestore pricing; plain/kraft use the static calculatePrice.
  const price = isComplete
    ? config.pouchType === 'printed'
      ? calculatePrintedPrice(
          {
            windowOption: config.windowOption!,
            materialType: config.materialType,
            capacity: config.capacity!,
            quantity: config.quantity!,
          },
          pricing,
        )
      : calculatePrice({
          pouchType: config.pouchType!,
          windowOption: config.windowOption!,
          materialType: config.materialType,
          capacity: config.capacity!,
          quantity: config.quantity!,
        })
    : 0;

  // Accurate breakdown for printed pouches using live pricing.
  // For plain/kraft we keep the simple 85/15 cosmetic split since those
  // prices are fixed and not broken down by add-on.
  const breakdown: { label: string; amount: number; included: boolean }[] = (() => {
    if (config.pouchType !== 'printed' || !isComplete) return [];
    const mult = pricing.capacityMultipliers[config.capacity!] ?? 1.0;
    const qty = config.quantity!;
    // Use the combination key to get the exact price for this selection
    const comboKey = getCombinationKey(config.windowOption!, config.materialType);
    const comboPricePerPiece = pricing.combinations[comboKey];
    const basePricePerPiece = pricing.combinations.noWindowNonMetal;

    const baseCost      = Math.round(basePricePerPiece * mult * qty);
    const windowCost    = config.windowOption === 'with'
      ? Math.round((pricing.combinations.windowNonMetal - pricing.combinations.noWindowNonMetal) * mult * qty)
      : 0;
    const metalisedCost = config.materialType === 'metalised'
      ? Math.round((comboPricePerPiece - (config.windowOption === 'with' ? pricing.combinations.windowNonMetal : pricing.combinations.noWindowNonMetal)) * mult * qty)
      : 0;

    return [
      { label: 'Base Cost',       amount: baseCost,      included: true },
      { label: config.windowOption === 'with' ? 'Window Add-on' : 'Without Window',   amount: windowCost,    included: config.windowOption === 'with' },
      { label: config.materialType === 'metalised' ? 'Metalised Add-on' : 'Non-Metalised', amount: metalisedCost, included: config.materialType === 'metalised' },
    ];
  })();

  const rows = [
    { label: 'Pouch Type', value: config.pouchType ? getPouchLabel(config.pouchType) : '–' },
    { label: 'Window Option', value: config.windowOption === 'with' ? 'With Window' : config.windowOption === 'without' ? 'Without Window' : '–' },
    ...(materialRequired
      ? [{ label: 'Material', value: config.materialType === 'metalised' ? 'Metalised' : config.materialType === 'non-metalised' ? 'Non-Metalised' : '–' }]
      : []),
    { label: 'Capacity', value: config.capacity ?? '–' },
    { label: 'Pouch Size', value: config.capacity ? getCapacitySize(config.capacity) : '–' },
    { label: 'Quantity', value: config.quantity ? `${config.quantity.toLocaleString('en-IN')} pcs` : '–' },
    ...(config.pouchType === 'printed'
      ? [{ label: 'Artwork', value: config.artworkName ?? 'Not attached' }]
      : []),
  ];

  const handleAddToCart = () => {
    if (!isComplete) return;
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addToCart({
      pouchType: config.pouchType!,
      windowOption: config.windowOption!,
      ...(materialRequired ? { materialType: config.materialType! } : {}),
      capacity: config.capacity!,
      quantity: config.quantity!,
      price,
      pouchSize: getCapacitySize(config.capacity!),
      ...(config.artworkUrl
        ? { artworkUrl: config.artworkUrl, artworkName: config.artworkName, artworkSize: config.artworkSize }
        : {}),
    });
    resetConfig();
    router.push('/(tabs)/cart');
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Configuration Summary */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Your Product Selection</Text>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          {rows.map((row) => (
            <View key={row.label} style={styles.row}>
              <Text style={[styles.rowLabel, { color: colors.mutedForeground }]}>{row.label}</Text>
              <Text style={[styles.rowValue, { color: colors.foreground }]}>{row.value}</Text>
            </View>
          ))}
        </View>

        {/* Price Breakdown */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Price Summary</Text>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          {config.pouchType === 'printed' && breakdown.length > 0
            ? breakdown.map((item) => (
                <View key={item.label} style={styles.row}>
                  <Text style={[styles.rowLabel, { color: item.included ? colors.mutedForeground : colors.mutedForeground }]}>{item.label}</Text>
                  <Text style={[styles.rowValue, { color: item.included ? colors.foreground : colors.mutedForeground }]}>
                    {item.included ? `₹${item.amount.toLocaleString('en-IN')}` : 'Not included'}
                  </Text>
                </View>
              ))
            : (
              <>
                <View style={styles.row}>
                  <Text style={[styles.rowLabel, { color: colors.mutedForeground }]}>Base Price</Text>
                  <Text style={[styles.rowValue, { color: colors.foreground }]}>₹{Math.round(price * 0.85).toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={[styles.rowLabel, { color: colors.mutedForeground }]}>Customisation</Text>
                  <Text style={[styles.rowValue, { color: colors.foreground }]}>₹{Math.round(price * 0.15).toLocaleString('en-IN')}</Text>
                </View>
              </>
            )
          }
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.row}>
            <Text style={[styles.totalLabel, { color: colors.foreground }]}>Estimated Price</Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>₹{price.toLocaleString('en-IN')}</Text>
          </View>
          <Text style={[styles.gstNote, { color: colors.mutedForeground }]}>* GST extra as applicable</Text>
        </View>

        {/* Delivery Info */}
        <View style={[styles.infoRow, { backgroundColor: colors.secondary, borderRadius: colors.radius }]}>
          <View style={styles.infoItem}>
            <Feather name="clock" size={18} color={colors.primary} />
            <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Delivery Time</Text>
            <Text style={[styles.infoValue, { color: colors.primary }]}>12 – 15 Days</Text>
          </View>
          <View style={[styles.infoDiv, { backgroundColor: colors.border }]} />
          <View style={styles.infoItem}>
            <Feather name="package" size={18} color={colors.primary} />
            <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Min. Order</Text>
            <Text style={[styles.infoValue, { color: colors.primary }]}>
              {config.pouchType === 'printed'
                ? pricing.minOrderQuantity.toLocaleString('en-IN')
                : '1,000'} pcs
            </Text>
          </View>
        </View>

        {/* Edit Config */}
        <TouchableOpacity
          activeOpacity={0.78}
          style={[styles.editBtn, { borderColor: colors.border, borderRadius: colors.radius }]}
          onPress={() => router.push('/configure/pouch-type')}
        >
          <Feather name="edit-2" size={16} color={colors.primary} />
          <Text style={[styles.editText, { color: colors.primary }]}>Edit Configuration</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.border, paddingBottom: bottomPad + 16 }]}>
        <PrimaryButton label="Add to Cart" onPress={handleAddToCart} disabled={!isComplete} variant="accent" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 16, gap: 14, paddingBottom: 20 },
  card: { padding: 16, borderWidth: 1, gap: 12 },
  cardTitle: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  divider: { height: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  rowValue: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  totalLabel: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  totalValue: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  gstNote: { fontSize: 11, fontFamily: 'Inter_400Regular', textAlign: 'right' },
  infoRow: { flexDirection: 'row', padding: 16, gap: 16 },
  infoItem: { flex: 1, alignItems: 'center', gap: 4 },
  infoLabel: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  infoValue: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  infoDiv: { width: 1 },
  editBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderWidth: 1 },
  editText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  footer: { padding: 20, borderTopWidth: 1 },
});
