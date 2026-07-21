import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart, getPouchLabel } from '@/context/CartContext';

const STATUS_STEPS = ['confirmed', 'approved', 'production', 'printing', 'dispatched', 'delivered'];
const STATUS_LABELS: Record<string, string> = {
  confirmed: 'Order Confirmed',
  approved: 'Artwork Approved',
  production: 'Production Started',
  printing: 'Printing',
  dispatched: 'Dispatched',
  delivered: 'Delivered',
};
const STATUS_COLORS: Record<string, string> = {
  confirmed: '#1565D8',
  approved: '#7C3AED',
  production: '#D97706',
  printing: '#0891B2',
  dispatched: '#059669',
  delivered: '#16A34A',
};

export default function OrdersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { orders } = useCart();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>My Orders</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>{orders.length} order{orders.length !== 1 ? 's' : ''} placed</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: Platform.OS === 'web' ? 100 : 90 + insets.bottom },
        ]}
      >
        {orders.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="clipboard" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No orders yet</Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
              Your placed orders will appear here
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.emptyBtn,
                { backgroundColor: colors.primary, borderRadius: colors.radius, opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={() => router.push('/configure/pouch-type')}
            >
              <Text style={styles.emptyBtnText}>Place Your First Order</Text>
            </Pressable>
          </View>
        ) : (
          orders.map((order) => {
            const stepIndex = STATUS_STEPS.indexOf(order.status);
            const statusColor = STATUS_COLORS[order.status] ?? colors.primary;
            return (
              <Pressable
                key={order.id}
                style={({ pressed }) => [
                  styles.card,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderRadius: colors.radius,
                    opacity: pressed ? 0.92 : 1,
                  },
                ]}
                onPress={() =>
                  router.push({ pathname: '/order-tracking', params: { orderId: order.orderId, orderKey: order.id } })
                }
              >
                <View style={styles.cardTop}>
                  <View>
                    <Text style={[styles.orderId, { color: colors.foreground }]}>#{order.orderId}</Text>
                    <Text style={[styles.orderDate, { color: colors.mutedForeground }]}>
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                    <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                    <Text style={[styles.statusText, { color: statusColor }]}>{STATUS_LABELS[order.status]}</Text>
                  </View>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                {order.items.slice(0, 2).map((item) => (
                  <View key={item.id} style={styles.itemRow}>
                    <Feather name="package" size={14} color={colors.mutedForeground} />
                    <Text style={[styles.itemText, { color: colors.foreground }]}>
                      {getPouchLabel(item.pouchType)} – {item.windowOption === 'with' ? 'Window' : 'No Window'} · {item.materialType === 'metalised' ? 'Metalised' : 'Non-Metalised'} · {item.capacity}
                    </Text>
                  </View>
                ))}
                {order.items.length > 2 && (
                  <Text style={[styles.moreItems, { color: colors.mutedForeground }]}>
                    +{order.items.length - 2} more item{order.items.length - 2 > 1 ? 's' : ''}
                  </Text>
                )}

                <View style={styles.cardBottom}>
                  <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>Total</Text>
                  <Text style={[styles.totalAmt, { color: colors.primary }]}>
                    ₹{order.total.toLocaleString('en-IN')}
                  </Text>
                  <Feather name="chevron-right" size={16} color={colors.mutedForeground} style={{ marginLeft: 'auto' }} />
                </View>

                {/* Progress bar */}
                <View style={styles.progress}>
                  {STATUS_STEPS.map((s, i) => (
                    <View
                      key={s}
                      style={[
                        styles.progressSegment,
                        { backgroundColor: i <= stepIndex ? colors.primary : colors.border },
                        i === 0 && { borderTopLeftRadius: 3, borderBottomLeftRadius: 3 },
                        i === STATUS_STEPS.length - 1 && { borderTopRightRadius: 3, borderBottomRightRadius: 3 },
                      ]}
                    />
                  ))}
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1 },
  title: { fontSize: 24, fontFamily: 'Inter_700Bold' },
  sub: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 4 },
  scroll: { padding: 16, gap: 14 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80, gap: 12 },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  emptyDesc: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  emptyBtn: { paddingHorizontal: 24, paddingVertical: 14, marginTop: 8 },
  emptyBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  card: { padding: 16, borderWidth: 1, gap: 10 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderId: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  orderDate: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  divider: { height: 1 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemText: { fontSize: 12, fontFamily: 'Inter_400Regular', flex: 1 },
  moreItems: { fontSize: 11, fontFamily: 'Inter_400Regular', marginLeft: 22 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  totalLabel: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  totalAmt: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  progress: { flexDirection: 'row', height: 4, gap: 2, marginTop: 2 },
  progressSegment: { flex: 1, height: 4 },
});
