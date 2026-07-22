import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart, calculatePrice, getPouchLabel, getCapacitySize } from '@/context/CartContext';
import { PrimaryButton } from '@/components/PrimaryButton';
import * as Haptics from 'expo-haptics';

export default function PriceSummaryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { config, addToCart, resetConfig } = useCart();
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const isComplete = config.pouchType && config.windowOption && config.materialType && config.capacity && config.quantity;

  const price = isComplete
    ? calculatePrice({
        pouchType: config.pouchType!,
        windowOption: config.windowOption!,
        materialType: config.materialType!,
        capacity: config.capacity!,
        quantity: config.quantity!,
      })
    : 0;

  const rows = [
    { label: 'Pouch Type', value: config.pouchType ? getPouchLabel(config.pouchType) : '–' },
    { label: 'Window Option', value: config.windowOption === 'with' ? 'With Window' : config.windowOption === 'without' ? 'Without Window' : '–' },
    { label: 'Material', value: config.materialType === 'metalised' ? 'Metalised' : config.materialType === 'non-metalised' ? 'Non-Metalised' : '–' },
    { label: 'Capacity', value: config.capacity ?? '–' },
    { label: 'Pouch Size', value: config.capacity ? getCapacitySize(config.capacity) : '–' },
    { label: 'Quantity', value: config.quantity ? `${config.quantity.toLocaleString('en-IN')} pcs` : '–' },
  ];

  const handleAddToCart = () => {
    if (!isComplete) return;
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addToCart({
      pouchType: config.pouchType!,
      windowOption: config.windowOption!,
      materialType: config.materialType!,
      capacity: config.capacity!,
      quantity: config.quantity!,
      price,
      pouchSize: getCapacitySize(config.capacity!),
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
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: colors.mutedForeground }]}>Base Price</Text>
            <Text style={[styles.rowValue, { color: colors.foreground }]}>₹{Math.round(price * 0.85).toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: colors.mutedForeground }]}>Customisation</Text>
            <Text style={[styles.rowValue, { color: colors.foreground }]}>₹{Math.round(price * 0.15).toLocaleString('en-IN')}</Text>
          </View>
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
              {config.pouchType === 'printed' ? '5,000' : '1,000'} pcs
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
