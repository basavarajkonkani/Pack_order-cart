import React from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart, PouchType } from '@/context/CartContext';

const CATEGORIES: { type: PouchType; label: string; desc: string; icon: string }[] = [
  { type: 'plain', label: 'Plain Pouches', desc: 'No Printing', icon: 'package' },
  { type: 'printed', label: 'Printed Pouches', desc: 'Custom Printing', icon: 'printer' },
  { type: 'kraft', label: 'Kraft Pouches', desc: 'Natural & Premium', icon: 'layers' },
];

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { cart } = useCart();

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const handleCategory = (type: PouchType) => {
    router.push({ pathname: '/configure/pouch-type', params: { preset: type } });
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.primary,
            paddingTop: topPad + 12,
          },
        ]}
      >
        <View>
          <Text style={styles.greeting}>Hello, Customer</Text>
          <Text style={styles.subGreeting}>Good to see you again!</Text>
        </View>
        <Pressable
          onPress={() => router.push('/configure/pouch-type')}
          style={({ pressed }) => [styles.cartBtn, pressed && { opacity: 0.7 }]}
        >
          <Ionicons name="notifications-outline" size={24} color="#fff" />
          {cart.length > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.accent }]}>
              <Text style={styles.badgeText}>{cart.length}</Text>
            </View>
          )}
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: Platform.OS === 'web' ? 100 : 90 + insets.bottom },
        ]}
      >
        {/* Search Bar */}
        <Pressable
          style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => router.push('/configure/pouch-type')}
        >
          <Feather name="search" size={18} color={colors.mutedForeground} />
          <Text style={[styles.searchPlaceholder, { color: colors.mutedForeground }]}>
            Search for pouches, sizes...
          </Text>
        </Pressable>

        {/* Hero Banner */}
        <Pressable
          style={[styles.heroBanner, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/configure/pouch-type')}
        >
          <View style={styles.heroContent}>
            <Text style={styles.heroTag}>PREMIUM PACKAGING</Text>
            <Text style={styles.heroTitle}>For Every Product</Text>
            <Text style={styles.heroSub}>High Quality · Customizable · Reliable</Text>
            <View style={[styles.exploreBtn, { backgroundColor: colors.accent }]}>
              <Text style={styles.exploreBtnText}>Explore Now</Text>
            </View>
          </View>
          <View style={styles.heroImageContainer}>
            <Image
              source={require('@/assets/images/hero-banner.png')}
              style={styles.heroImage}
              resizeMode="cover"
            />
          </View>
        </Pressable>

        {/* Shop by Category */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Shop by Category</Text>
          <View style={styles.categories}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat.type}
                style={({ pressed }) => [
                  styles.categoryCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderRadius: colors.radius,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
                onPress={() => handleCategory(cat.type)}
              >
                <View style={[styles.categoryIcon, { backgroundColor: colors.secondary }]}>
                  <Feather name={cat.icon as any} size={22} color={colors.primary} />
                </View>
                <Text
                  style={[styles.categoryLabel, { color: colors.foreground }]}
                  numberOfLines={1}
                >
                  {cat.label.split(' ')[0]}
                </Text>
                <Text style={[styles.categoryDesc, { color: colors.mutedForeground }]} numberOfLines={1}>
                  {cat.desc}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Feature Highlights */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Why Choose Us</Text>
          <View style={styles.features}>
            {[
              { icon: 'shield', text: 'Quality Assured', sub: 'ISO certified materials' },
              { icon: 'truck', text: 'Fast Delivery', sub: '12-15 business days' },
              { icon: 'edit-2', text: 'Custom Print', sub: 'Full colour printing' },
            ].map((f) => (
              <View
                key={f.text}
                style={[
                  styles.featureCard,
                  { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius },
                ]}
              >
                <View style={[styles.featureIcon, { backgroundColor: colors.secondary }]}>
                  <Feather name={f.icon as any} size={20} color={colors.primary} />
                </View>
                <Text style={[styles.featureText, { color: colors.foreground }]}>{f.text}</Text>
                <Text style={[styles.featureSub, { color: colors.mutedForeground }]}>{f.sub}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Order CTA */}
        <Pressable
          style={({ pressed }) => [
            styles.ctaCard,
            { backgroundColor: colors.primary, borderRadius: colors.radius, opacity: pressed ? 0.9 : 1 },
          ]}
          onPress={() => router.push('/configure/pouch-type')}
        >
          <View>
            <Text style={styles.ctaTitle}>Start a New Order</Text>
            <Text style={styles.ctaSub}>Customise pouches in 6 easy steps</Text>
          </View>
          <View style={[styles.ctaArrow, { backgroundColor: colors.accent }]}>
            <Feather name="arrow-right" size={20} color="#fff" />
          </View>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 18,
  },
  greeting: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
  },
  subGreeting: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  cartBtn: { position: 'relative', padding: 4 },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 9, fontFamily: 'Inter_700Bold' },
  scroll: { paddingHorizontal: 16, paddingTop: 12, gap: 20 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 10,
    borderWidth: 1,
  },
  searchPlaceholder: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  heroBanner: {
    borderRadius: 16,
    overflow: 'hidden',
    flexDirection: 'row',
    height: 160,
  },
  heroContent: {
    flex: 1,
    padding: 18,
    justifyContent: 'center',
    gap: 4,
  },
  heroTag: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
  },
  heroSub: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.75)',
  },
  exploreBtn: {
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  exploreBtnText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  heroImageContainer: { width: 130, overflow: 'hidden' },
  heroImage: { width: 130, height: '100%' },
  section: { gap: 12 },
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
  },
  categories: { flexDirection: 'row', gap: 10 },
  categoryCard: {
    flex: 1,
    alignItems: 'center',
    padding: 14,
    borderWidth: 1,
    gap: 6,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryLabel: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
  },
  categoryDesc: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  features: { flexDirection: 'row', gap: 10 },
  featureCard: {
    flex: 1,
    padding: 14,
    borderWidth: 1,
    alignItems: 'center',
    gap: 6,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
  },
  featureSub: {
    fontSize: 9,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  ctaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  ctaTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
  },
  ctaSub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  ctaArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
