import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart, getPouchLabel } from '@/context/CartContext';
import * as Haptics from 'expo-haptics';

export default function CartScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { cart, removeFromCart, updateQuantity, cartTotal } = useCart();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const handleRemove = (id: string) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    removeFromCart(id);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>My Cart</Text>
        {cart.length > 0 && (
          <Text style={[styles.sub, { color: colors.mutedForeground }]}>
            {cart.length} item{cart.length !== 1 ? 's' : ''}
          </Text>
        )}
      </View>

      {cart.length === 0 ? (
        <View style={styles.empty}>
          <Feather name="shopping-cart" size={56} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Your cart is empty</Text>
          <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
            Customise pouches and add them to your cart
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.shopBtn,
              { backgroundColor: colors.primary, borderRadius: colors.radius, opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={() => router.push('/configure/pouch-type')}
          >
            <Text style={styles.shopBtnText}>Start Ordering</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.scroll, { paddingBottom: 16 }]}
          >
            {cart.map((item) => (
              <View
                key={item.id}
                style={[
                  styles.card,
                  { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius },
                ]}
              >
                <View style={styles.cardTop}>
                  <View style={[styles.icon, { backgroundColor: colors.secondary }]}>
                    <Feather name="package" size={22} color={colors.primary} />
                  </View>
                  <View style={styles.details}>
                    <Text style={[styles.itemName, { color: colors.foreground }]}>
                      {getPouchLabel(item.pouchType)}
                    </Text>
                    <Text style={[styles.itemSpec, { color: colors.mutedForeground }]}>
                      {item.windowOption === 'with' ? 'With Window' : 'No Window'} · {item.materialType === 'metalised' ? 'Metalised' : 'Non-Metalised'}
                    </Text>
                    <Text style={[styles.itemSpec, { color: colors.mutedForeground }]}>
                      {item.capacity} · {item.pouchSize}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => handleRemove(item.id)}
                    style={({ pressed }) => [styles.removeBtn, pressed && { opacity: 0.6 }]}
                  >
                    <Feather name="trash-2" size={18} color={colors.destructive} />
                  </Pressable>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <View style={styles.cardBottom}>
                  <View style={[styles.qtyControl, { borderColor: colors.border }]}>
                    <Pressable
                      onPress={() => updateQuantity(item.id, Math.max(1000, item.quantity - 1000))}
                      style={({ pressed }) => [styles.qtyBtn, pressed && { opacity: 0.6 }]}
                    >
                      <Feather name="minus" size={16} color={colors.foreground} />
                    </Pressable>
                    <Text style={[styles.qtyText, { color: colors.foreground }]}>
                      {item.quantity.toLocaleString('en-IN')}
                    </Text>
                    <Pressable
                      onPress={() => updateQuantity(item.id, item.quantity + 1000)}
                      style={({ pressed }) => [styles.qtyBtn, pressed && { opacity: 0.6 }]}
                    >
                      <Feather name="plus" size={16} color={colors.foreground} />
                    </Pressable>
                  </View>
                  <Text style={[styles.priceTag, { color: colors.primary }]}>
                    ₹{item.price.toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>
            ))}

            {/* GST Note */}
            <Text style={[styles.gstNote, { color: colors.mutedForeground }]}>
              GST extra as applicable
            </Text>
          </ScrollView>

          {/* Bottom Summary */}
          <View
            style={[
              styles.summary,
              {
                backgroundColor: colors.card,
                borderTopColor: colors.border,
                paddingBottom: bottomPad + 12,
              },
            ]}
          >
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Total Amount</Text>
              <Text style={[styles.summaryTotal, { color: colors.foreground }]}>
                ₹{cartTotal.toLocaleString('en-IN')}
              </Text>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.checkoutBtn,
                { backgroundColor: colors.primary, borderRadius: colors.radius, opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={() => router.push('/checkout')}
            >
              <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
              <Feather name="arrow-right" size={18} color="#fff" />
            </Pressable>
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
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  emptyDesc: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  shopBtn: { paddingHorizontal: 28, paddingVertical: 14, marginTop: 8 },
  shopBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  scroll: { padding: 16, gap: 12 },
  card: { padding: 16, borderWidth: 1, gap: 12 },
  cardTop: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  icon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  details: { flex: 1, gap: 3 },
  itemName: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  itemSpec: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  removeBtn: { padding: 4 },
  divider: { height: 1 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  qtyControl: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 8, overflow: 'hidden' },
  qtyBtn: { paddingHorizontal: 14, paddingVertical: 8 },
  qtyText: { paddingHorizontal: 12, fontSize: 14, fontFamily: 'Inter_600SemiBold', minWidth: 60, textAlign: 'center' },
  priceTag: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  gstNote: { textAlign: 'center', fontSize: 12, fontFamily: 'Inter_400Regular' },
  summary: { padding: 16, borderTopWidth: 1, gap: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  summaryTotal: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  checkoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52 },
  checkoutBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_600SemiBold' },
});
