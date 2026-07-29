import React, { useState } from 'react';
import {
  Image,
  ImageSourcePropType,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart, PouchType } from '@/context/CartContext';

/**
 * Ready-stock pouches are all plain, so the Plain tile opens the stock catalog
 * instead of the custom-order wizard.
 */
type Category = {
  key: string;
  label: string;
  desc: string;
  image: ImageSourcePropType;
} & ({ target: 'stock' } | { target: 'configure'; type: PouchType });

const CATEGORIES: Category[] = [
  { key: 'plain', label: 'Plain Pouches', desc: 'No Printing', image: require('@/assets/images/silver-standy-pouch.jpg'), target: 'stock' },
  { key: 'printed', label: 'Printed Pouches', desc: 'Custom Printing', image: require('@/assets/images/gold-standy-pouch.jpg'), target: 'configure', type: 'printed' },
  { key: 'kraft', label: 'Kraft Pouches', desc: 'Natural & Premium', image: require('@/assets/images/kraft-standy-pouch-brown.jpg'), target: 'configure', type: 'kraft' },
];

const FEATURES = [
  { icon: 'shield', text: 'Quality Assured', sub: 'ISO certified materials' },
  { icon: 'truck', text: 'Fast Delivery', sub: '12-15 business days' },
  { icon: 'edit-2', text: 'Custom Print', sub: 'Full colour printing' },
];

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { cart } = useCart();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const [search, setSearch] = useState('');

  const handleSearchSubmit = () => {
    router.push({ pathname: '/(tabs)/products', params: search.trim() ? { q: search.trim() } : {} });
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: topPad + 12 }]}>
        {/* Brand row: wordmark sits on a white surface so the dark logo ink stays legible */}
        <View style={styles.brandRow}>
          <View style={styles.logoPlate}>
            <Image
              source={require('@/assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
              accessible
              accessibilityRole="image"
              accessibilityLabel="Pacmonk"
            />
          </View>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => router.push('/(tabs)/orders')}
            style={styles.cartBtn}
            accessibilityRole="button"
            accessibilityLabel={
              cart.length > 0
                ? `Notifications, ${cart.length} item${cart.length > 1 ? 's' : ''} in cart`
                : 'Notifications'
            }
          >
            <Ionicons name="notifications-outline" size={24} color="#fff" />
            {cart.length > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.accent }]}>
                <Text style={styles.badgeText}>{cart.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.headerContent}>
          <Text style={styles.greeting}>Hello, Customer</Text>
          <Text style={styles.subGreeting}>Good to see you again!</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Search Bar */}
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={18} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleSearchSubmit}
            placeholder="Search for pouches, sizes..."
            placeholderTextColor={colors.mutedForeground}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setSearch('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>

        {/* Hero Banner */}
        <TouchableOpacity
          activeOpacity={0.92}
          style={[styles.heroBanner, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/(tabs)/products')}
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
              source={require('@/assets/images/banner-3.jpg')}
              style={styles.heroImage}
              resizeMode="cover"
            />
          </View>
        </TouchableOpacity>

        {/* Shop by Category */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Shop by Category</Text>
          <View style={styles.categories}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.key}
                activeOpacity={0.78}
                style={[
                  styles.categoryCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderRadius: colors.radius,
                  },
                ]}
                onPress={() =>
                  cat.target === 'stock'
                    ? router.push('/(tabs)/products')
                    : router.push({ pathname: '/configure/pouch-type', params: { preset: cat.type } })
                }
              >
                <View style={[styles.categoryImageWrap, { backgroundColor: colors.secondary }]}>
                  <Image source={cat.image} style={styles.categoryImage} resizeMode="cover" />
                </View>
                <Text style={[styles.categoryLabel, { color: colors.foreground }]} numberOfLines={1}>
                  {cat.label.split(' ')[0]}
                </Text>
                <Text style={[styles.categoryDesc, { color: colors.mutedForeground }]} numberOfLines={1}>
                  {cat.desc}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Feature Highlights */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Why Choose Us</Text>
          <View style={styles.features}>
            {FEATURES.map((f) => (
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
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.ctaCard, { backgroundColor: colors.primary, borderRadius: colors.radius }]}
          onPress={() => router.push('/configure/pouch-type')}
        >
          <View>
            <Text style={styles.ctaTitle}>Start a New Order</Text>
            <Text style={styles.ctaSub}>Customise pouches in 5 easy steps</Text>
          </View>
          <View style={[styles.ctaArrow, { backgroundColor: colors.accent }]}>
            <Feather name="arrow-right" size={20} color="#fff" />
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 18,
    gap: 14,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  logoPlate: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    // Lifts the plate off the green so the wordmark reads as a brand lockup
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  // Native size is 180x35 (~5.14:1); keep that ratio so the wordmark never squashes
  logo: {
    width: 118,
    height: 23,
  },
  headerContent: {
    flex: 1,
  },
  greeting: { fontSize: 22, fontFamily: 'Inter_700Bold', color: '#fff' },
  subGreeting: { fontSize: 13, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  cartBtn: { position: 'relative', padding: 4 },
  badge: {
    position: 'absolute', top: 0, right: 0,
    width: 16, height: 16, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 9, fontFamily: 'Inter_700Bold' },
  scroll: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 20, gap: 20 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 14,
    borderRadius: 10, borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', height: '100%' },
  heroBanner: { borderRadius: 16, overflow: 'hidden', flexDirection: 'row', height: 160 },
  heroContent: { flex: 1, padding: 18, justifyContent: 'center', gap: 4 },
  heroTag: { fontSize: 10, fontFamily: 'Inter_700Bold', color: 'rgba(255,255,255,0.7)', letterSpacing: 1 },
  heroTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: '#fff' },
  heroSub: { fontSize: 11, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.75)' },
  exploreBtn: { marginTop: 8, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 6, alignSelf: 'flex-start' },
  exploreBtnText: { color: '#fff', fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  heroImageContainer: { width: 130, overflow: 'hidden' },
  heroImage: { width: 130, height: '100%' },
  section: { gap: 12 },
  sectionTitle: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  categories: { flexDirection: 'row', gap: 10 },
  categoryCard: { flex: 1, alignItems: 'center', padding: 14, borderWidth: 1, gap: 6 },
  categoryImageWrap: { width: 48, height: 48, borderRadius: 24, overflow: 'hidden' },
  categoryImage: { width: '100%', height: '100%' },
  categoryLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },
  categoryDesc: { fontSize: 10, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  features: { flexDirection: 'row', gap: 10 },
  featureCard: { flex: 1, padding: 14, borderWidth: 1, alignItems: 'center', gap: 6 },
  featureIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  featureText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },
  featureSub: { fontSize: 9, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  ctaCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  ctaTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#fff' },
  ctaSub: { fontSize: 12, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  ctaArrow: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
