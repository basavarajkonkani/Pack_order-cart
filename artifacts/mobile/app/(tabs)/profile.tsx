import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '@/context/CartContext';

const MENU = [
  { icon: 'clipboard', label: 'My Orders', route: '/(tabs)/orders' as const },
  { icon: 'shopping-cart', label: 'My Cart', route: '/(tabs)/cart' as const },
  { icon: 'map-pin', label: 'Saved Addresses', route: null },
  { icon: 'file-text', label: 'GST Details', route: null },
  { icon: 'headphones', label: 'Need Design Assistance?', route: null },
  { icon: 'help-circle', label: 'Help & Support', route: null },
];

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { orders, cartTotal } = useCart();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.headerBg, { backgroundColor: colors.primary, paddingTop: topPad + 12 }]}>
        <View style={styles.avatarRow}>
          <View style={[styles.avatar, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Feather name="user" size={32} color="#fff" />
          </View>
          <View style={styles.avatarInfo}>
            <Text style={styles.name}>Customer Name</Text>
            <Text style={styles.email}>customer@business.com</Text>
          </View>
          <Pressable style={({ pressed }) => [styles.editBtn, pressed && { opacity: 0.7 }]}>
            <Feather name="edit-2" size={18} color="#fff" />
          </Pressable>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{orders.length}</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: 'rgba(255,255,255,0.3)' }]} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>
              ₹{orders.reduce((s, o) => s + o.total, 0).toLocaleString('en-IN')}
            </Text>
            <Text style={styles.statLabel}>Total Spent</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: 'rgba(255,255,255,0.3)' }]} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>
              {orders.filter((o) => o.status === 'delivered').length}
            </Text>
            <Text style={styles.statLabel}>Delivered</Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: Platform.OS === 'web' ? 100 : 90 + insets.bottom },
        ]}
      >
        {/* GST Info */}
        <View style={[styles.gstCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <Feather name="info" size={16} color={colors.primary} />
          <View style={styles.gstInfo}>
            <Text style={[styles.gstTitle, { color: colors.foreground }]}>GST Benefits Available</Text>
            <Text style={[styles.gstSub, { color: colors.mutedForeground }]}>Save 18% GST on your business orders</Text>
          </View>
          <Pressable style={({ pressed }) => [styles.addGstBtn, { backgroundColor: colors.secondary, borderRadius: 8, opacity: pressed ? 0.8 : 1 }]}>
            <Text style={[styles.addGstText, { color: colors.primary }]}>Add GST</Text>
          </Pressable>
        </View>

        {/* Menu */}
        <View style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          {MENU.map((item, i) => (
            <React.Fragment key={item.label}>
              <Pressable
                style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.7 }]}
                onPress={() => item.route ? router.push(item.route) : null}
              >
                <View style={[styles.menuIcon, { backgroundColor: colors.secondary }]}>
                  <Feather name={item.icon as any} size={18} color={colors.primary} />
                </View>
                <Text style={[styles.menuLabel, { color: colors.foreground }]}>{item.label}</Text>
                <Feather name="chevron-right" size={18} color={colors.mutedForeground} style={{ marginLeft: 'auto' }} />
              </Pressable>
              {i < MENU.length - 1 && (
                <View style={[styles.menuDivider, { backgroundColor: colors.border, marginLeft: 58 }]} />
              )}
            </React.Fragment>
          ))}
        </View>

        {/* Quick Order */}
        <Pressable
          style={({ pressed }) => [
            styles.quickOrder,
            { backgroundColor: colors.primary, borderRadius: colors.radius, opacity: pressed ? 0.9 : 1 },
          ]}
          onPress={() => router.push('/configure/pouch-type')}
        >
          <Feather name="plus-circle" size={22} color="#fff" />
          <Text style={styles.quickOrderText}>Start a New Order</Text>
          <Feather name="arrow-right" size={18} color="rgba(255,255,255,0.7)" style={{ marginLeft: 'auto' }} />
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerBg: { paddingHorizontal: 20, paddingBottom: 20, gap: 16 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  avatarInfo: { flex: 1, gap: 3 },
  name: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#fff' },
  email: { fontSize: 13, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.75)' },
  editBtn: { padding: 6 },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statNum: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#fff' },
  statLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.7)' },
  statDivider: { width: 1, height: 32 },
  scroll: { padding: 16, gap: 14 },
  gstCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderWidth: 1, gap: 10 },
  gstInfo: { flex: 1, gap: 2 },
  gstTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  gstSub: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  addGstBtn: { paddingHorizontal: 12, paddingVertical: 7 },
  addGstText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  menuCard: { borderWidth: 1, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  menuIcon: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  menuDivider: { height: 1 },
  quickOrder: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  quickOrderText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#fff' },
});
