import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PouchType } from '@/context/CartContext';

const PRODUCTS = [
  {
    type: 'plain' as PouchType,
    name: 'Plain Pouches',
    desc: 'No Printing – clean, minimal, and cost-effective stand-up pouches.',
    icon: 'package',
    minOrder: '1,000 pcs',
    delivery: '12–15 Days',
    priceFrom: '₹1,500',
    tags: ['Food Grade', 'Multiple Sizes'],
  },
  {
    type: 'printed' as PouchType,
    name: 'Printed Pouches',
    desc: 'Full colour custom printing for your brand identity.',
    icon: 'printer',
    minOrder: '5,000 pcs',
    delivery: '12–15 Days',
    priceFrom: '₹15,000',
    tags: ['Custom Print', 'Brand Ready'],
  },
  {
    type: 'kraft' as PouchType,
    name: 'Kraft Pouches',
    desc: 'Natural kraft paper with an eco-friendly, premium look.',
    icon: 'layers',
    minOrder: '1,000 pcs',
    delivery: '10–12 Days',
    priceFrom: '₹2,000',
    tags: ['Eco Friendly', 'Natural Look'],
  },
];

export default function ProductsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Our Products</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>Choose a category to start your order</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: Platform.OS === 'web' ? 100 : 90 + insets.bottom },
        ]}
      >
        {PRODUCTS.map((p) => (
          <Pressable
            key={p.type}
            style={({ pressed }) => [
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
            onPress={() => router.push({ pathname: '/configure/pouch-type', params: { preset: p.type } })}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.iconWrap, { backgroundColor: colors.secondary }]}>
                <Feather name={p.icon as any} size={28} color={colors.primary} />
              </View>
              <View style={styles.cardTitles}>
                <Text style={[styles.productName, { color: colors.foreground }]}>{p.name}</Text>
                <View style={styles.tags}>
                  {p.tags.map((t) => (
                    <View key={t} style={[styles.tag, { backgroundColor: colors.secondary }]}>
                      <Text style={[styles.tagText, { color: colors.primary }]}>{t}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
            </View>

            <Text style={[styles.productDesc, { color: colors.mutedForeground }]}>{p.desc}</Text>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.cardMeta}>
              <View style={styles.metaItem}>
                <Feather name="package" size={13} color={colors.mutedForeground} />
                <Text style={[styles.metaText, { color: colors.mutedForeground }]}>Min {p.minOrder}</Text>
              </View>
              <View style={styles.metaItem}>
                <Feather name="clock" size={13} color={colors.mutedForeground} />
                <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{p.delivery}</Text>
              </View>
              <Text style={[styles.price, { color: colors.primary }]}>From {p.priceFrom}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  title: { fontSize: 24, fontFamily: 'Inter_700Bold' },
  sub: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 4 },
  scroll: { padding: 16, gap: 14 },
  card: { padding: 16, borderWidth: 1, gap: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitles: { flex: 1, gap: 4 },
  productName: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  tags: { flexDirection: 'row', gap: 6 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  tagText: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  productDesc: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 19 },
  divider: { height: 1 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  price: { marginLeft: 'auto', fontSize: 14, fontFamily: 'Inter_700Bold' },
});
