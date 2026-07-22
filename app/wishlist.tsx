import React from 'react';
import { Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/context/AuthContext';
import { STOCK_PRODUCTS, getMinPrice } from '@/constants/stockProducts';

export default function WishlistScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { wishlist, toggleWishlist } = useAuth();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const products = STOCK_PRODUCTS.filter((p) => wishlist.includes(p.id));

  const handleRemove = (id: string) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleWishlist(id);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>My Wishlist</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 24 }]}>
        {products.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="heart" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Your wishlist is empty</Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
              Tap the heart icon on any product to save it here
            </Text>
            <TouchableOpacity
              activeOpacity={0.82}
              style={[styles.emptyBtn, { backgroundColor: colors.primary, borderRadius: colors.radius }]}
              onPress={() => router.push('/(tabs)/products')}
            >
              <Text style={styles.emptyBtnText}>Browse Products</Text>
            </TouchableOpacity>
          </View>
        ) : (
          products.map((p) => {
            const minPrice = getMinPrice(p);
            return (
              <TouchableOpacity
                key={p.id}
                activeOpacity={0.85}
                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}
                onPress={() => router.push({ pathname: '/stock-product/[id]', params: { id: p.id } })}
              >
                <Image source={p.image} style={[styles.image, { borderRadius: colors.radius - 4 }]} resizeMode="cover" />
                <View style={styles.info}>
                  <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>{p.name}</Text>
                  <Text style={[styles.price, { color: colors.success }]}>₹{minPrice.toFixed(2)}/pc</Text>
                  <Text style={[styles.moq, { color: colors.mutedForeground }]}>MOQ: {p.moq}</Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  onPress={() => handleRemove(p.id)}
                >
                  <Feather name="trash-2" size={18} color={colors.destructive} />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  title: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  scroll: { padding: 16, gap: 12 },
  empty: { alignItems: 'center', paddingVertical: 80, gap: 12 },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  emptyDesc: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', paddingHorizontal: 24 },
  emptyBtn: { paddingHorizontal: 24, paddingVertical: 14, marginTop: 8 },
  emptyBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  card: { flexDirection: 'row', alignItems: 'center', padding: 12, borderWidth: 1, gap: 12 },
  image: { width: 56, height: 56 },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  price: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  moq: { fontSize: 12, fontFamily: 'Inter_400Regular' },
});
