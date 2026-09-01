import React from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart, getItemTitle, getItemSpec } from '@/context/CartContext';
import * as Haptics from 'expo-haptics';

export default function CartScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { cart, removeFromCart, updateQuantity, cartTotal } = useCart();
  const topPad = Platform.OS === 'web' ? 8 : insets.top + 8;

  const handleRemove = (id: string) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    removeFromCart(id);
  };

  const handleDecrement = (id: string, current: number, step: number) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateQuantity(id, Math.max(step, current - step));
  };

  const handleIncrement = (id: string, current: number, step: number) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateQuantity(id, current + step);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, paddingTop: topPad, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>My Cart</Text>
        {cart.length > 0 && (
          <Text style={[styles.sub, { color: colors.mutedForeground }]}>
            {cart.length} item{cart.length !== 1 ? 's' : ''}
          </Text>
        )}
      </View>

      {/* Empty State */}
      {cart.length === 0 ? (
        <View style={styles.empty}>
          <Feather name="shopping-cart" size={56} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Your cart is empty</Text>
          <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
            Customise pouches and add them to your cart
          </Text>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.shopBtn, { backgroundColor: colors.primary, borderRadius: colors.radius }]}
            onPress={() => router.push('/configure/pouch-type')}
          >
            <Text style={styles.shopBtnText}>Start Ordering</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Items list — flex: 1 ensures it doesn't bleed past the checkout bar */}
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            {cart.map((item) => {
              const step = item.kind === 'stock' ? 100 : 1000;
              return (
              <View
                key={item.id}
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderRadius: colors.radius,
                  },
                ]}
              >
                {/* Top row */}
                <View style={styles.cardTop}>
                  <View style={[styles.icon, { backgroundColor: colors.secondary }]}>
                    <Feather name="package" size={22} color={colors.primary} />
                  </View>
                  <View style={styles.details}>
                    <Text style={[styles.itemName, { color: colors.foreground }]}>
                      {getItemTitle(item)}
                    </Text>
                    <Text style={[styles.itemSpec, { color: colors.mutedForeground }]}>
                      {getItemSpec(item)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    onPress={() => handleRemove(item.id)}
                    style={styles.removeBtn}
                  >
                    <Feather name="trash-2" size={20} color={colors.destructive} />
                  </TouchableOpacity>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                {/* Bottom row: qty + price */}
                <View style={styles.cardBottom}>
                  <View style={[styles.qtyControl, { borderColor: colors.border }]}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleDecrement(item.id, item.quantity, step)}
                      style={styles.qtyBtn}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Feather name="minus" size={16} color={colors.foreground} />
                    </TouchableOpacity>
                    <Text style={[styles.qtyText, { color: colors.foreground }]}>
                      {item.quantity.toLocaleString('en-IN')}
                    </Text>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleIncrement(item.id, item.quantity, step)}
                      style={styles.qtyBtn}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Feather name="plus" size={16} color={colors.foreground} />
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.priceTag, { color: colors.primary }]}>
                    ₹{item.price.toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>
              );
            })}

            <Text style={[styles.gstNote, { color: colors.mutedForeground }]}>
              * GST extra as applicable
            </Text>
          </ScrollView>

          {/* Sticky checkout bar — sibling of ScrollView, never overlaps */}
          <View
            style={[
              styles.summary,
              {
                backgroundColor: colors.card,
                borderTopColor: colors.border,
              },
            ]}
          >
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
                Total Amount
              </Text>
              <Text style={[styles.summaryTotal, { color: colors.foreground }]}>
                ₹{cartTotal.toLocaleString('en-IN')}
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.85}
              style={[
                styles.checkoutBtn,
                { backgroundColor: colors.primary, borderRadius: colors.radius },
              ]}
              onPress={() => router.push('/verify-mobile')}
            >
              <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
              <Feather name="arrow-right" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1 },
  title: { fontSize: 24, fontFamily: 'Inter_700Bold' },
  sub: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 4 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
  emptyTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  emptyDesc: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  shopBtn: { paddingHorizontal: 28, paddingVertical: 14, marginTop: 8 },
  shopBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  /* ScrollView must flex so summary bar is never covered */
  scrollView: { flex: 1 },
  scroll: { padding: 16, gap: 12, paddingBottom: 20 },
  card: { padding: 16, borderWidth: 1, gap: 12 },
  cardTop: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  icon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  details: { flex: 1, gap: 4 },
  itemName: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  itemSpec: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  removeBtn: { padding: 4 },
  divider: { height: 1 },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  qtyBtn: { paddingHorizontal: 14, paddingVertical: 10 },
  qtyText: {
    paddingHorizontal: 10,
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    minWidth: 70,
    textAlign: 'center',
  },
  priceTag: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  gstNote: { textAlign: 'center', fontSize: 12, fontFamily: 'Inter_400Regular' },
  summary: {
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  summaryTotal: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
  },
  checkoutBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_600SemiBold' },
});
