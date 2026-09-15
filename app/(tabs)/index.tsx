import React, { useState, useEffect, useRef } from 'react';
import {
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { AppCategory } from '@/lib/categories';
import { useCategories } from '@/hooks/useCategories';
import { CategorySkeleton } from '@/components/CategorySkeleton';
import { OptimizedImage } from '@/components/OptimizedImage';
import { prefetchImages } from '@/lib/imageOptimization';

const PLACEHOLDER_IMAGE = require('@/assets/images/logo.png');

// Banner carousel images
const BANNERS = [
  require('@/assets/images/Home Banner.png'),
  require('@/assets/images/Home Banner 2.png'),
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// Calculate heights based on actual image aspect ratios to prevent cropping
// Home banners are 1536x1024 (3:2 ratio)
const BANNER_HEIGHT = Math.round((SCREEN_WIDTH - 32) * (2/3)); // Maintain 3:2 aspect ratio
// Custom banner is 1774x887 (2:1 ratio)
const CUSTOM_BANNER_HEIGHT = Math.round((SCREEN_WIDTH - 32) * (1/2)); // Maintain 2:1 aspect ratio

const FEATURES = [
  { icon: 'shield', text: 'Quality Assured', sub: 'ISO certified materials' },
  { icon: 'truck', text: 'Fast Delivery', sub: '12-15 business days' },
  { icon: 'edit-2', text: 'Custom Print', sub: 'Full colour printing' },
];

const VALUE_PROPS = [
  {
    icon: 'star',
    title: 'Quality Assurance',
    desc: 'Our rigorous quality control processes ensure that every product meets the highest standards of performance and reliability.',
  },
  {
    icon: 'check-circle',
    title: 'Innovative Designs',
    desc: 'We stay ahead of industry trends with innovative packaging designs that enhance product appeal and functionality.',
  },
  {
    icon: 'zap',
    title: 'Competitive Pricing',
    desc: 'We offer competitive pricing without compromising on quality, making premium packaging solutions accessible to businesses of all sizes.',
  },
  {
    icon: 'check-square',
    title: 'Fast Turnaround',
    desc: 'With our efficient production capabilities, we ensure timely delivery of your orders, helping you meet your deadlines with ease.',
  },
];

/**
 * Determines where tapping a category tile navigates.
 * - Stock categories (bopp-bags, standup-pouches, kraft-pouches) → stock catalog filtered by category
 * - "plain" id → stock catalog (all products, legacy support)
 * - anything else → configure wizard with the id passed as `preset`
 */
function getCategoryTarget(cat: AppCategory) {
  const lowerName = cat.name.toLowerCase();
  const lowerDesc = (cat.description || '').toLowerCase();
  const isStockCategory = 
    cat.id === 'plain' || 
    cat.id === 'bopp-bags' ||
    cat.id === 'standup-pouches' ||
    cat.id === 'kraft-pouches' ||
    cat.id === 'container' ||
    lowerName.includes('bopp') || 
    lowerName.includes('standup') || 
    lowerName.includes('standy') || 
    lowerName.includes('kraft') || 
    lowerName.includes('container') ||
    lowerName.includes('center') ||
    lowerName.includes('seal') ||
    lowerDesc.includes('stock') ||
    lowerDesc.includes('ready') ||
    lowerDesc.includes('container');
  
  if (isStockCategory) {
    return () => router.push({ 
      pathname: '/(tabs)/products', 
      params: cat.id === 'plain' ? {} : { categoryId: cat.id } 
    });
  }
  return () =>
    router.push({ pathname: '/configure/pouch-type', params: { preset: cat.id } });
}

/** Returns the image source for a category — remote URL or placeholder. */
function getCategoryImage(cat: AppCategory) {
  if (cat.imageUrl) return { uri: cat.imageUrl };
  return PLACEHOLDER_IMAGE;
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { cart } = useCart();
  const { profile } = useAuth();
  const topPad = Platform.OS === 'web' ? 8 : insets.top + 8;
  const [search, setSearch] = useState('');
  
  // Banner carousel state
  const [activeBanner, setActiveBanner] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Use React Query for cached category fetching
  const { data: categories = [], isLoading: catsLoading } = useCategories();

  // Auto-scroll banners every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveBanner((prev) => {
        const next = (prev + 1) % BANNERS.length;
        if (scrollViewRef.current && Platform.OS !== 'web') {
          scrollViewRef.current.scrollTo({
            x: next * (SCREEN_WIDTH - 32),
            animated: true,
          });
        }
        return next;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Prefetch category images in the background for faster rendering
  useEffect(() => {
    if (categories.length > 0) {
      const imageUrls = categories
        .map((cat) => cat.imageUrl)
        .filter((url): url is string => !!url);
      
      if (imageUrls.length > 0) {
        prefetchImages(imageUrls);
      }
    }
  }, [categories]);

  const handleSearchSubmit = () => {
    router.push({ pathname: '/(tabs)/products', params: search.trim() ? { q: search.trim() } : {} });
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: topPad }]}>
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
          <Text style={styles.greeting}>Hello, {profile?.name || 'Customer'}</Text>
          <Text style={styles.subGreeting}>Good to see you again!</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: 100 }]}
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

        {/* Banner Carousel */}
        <View style={styles.bannerSection}>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const slideIndex = Math.round(
                event.nativeEvent.contentOffset.x / (SCREEN_WIDTH - 32)
              );
              setActiveBanner(slideIndex);
            }}
            decelerationRate="fast"
            snapToInterval={SCREEN_WIDTH - 32}
            snapToAlignment="center"
            contentContainerStyle={styles.bannerScroll}
          >
            {BANNERS.map((banner, index) => (
              <TouchableOpacity
                key={index}
                activeOpacity={0.9}
                style={styles.bannerSlide}
                onPress={() => router.push('/(tabs)/products')}
              >
                <Image
                  source={banner}
                  style={styles.bannerImage}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          {/* Pagination Dots */}
          <View style={styles.paginationDots}>
            {BANNERS.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  {
                    backgroundColor: activeBanner === index ? colors.primary : colors.border,
                    width: activeBanner === index ? 24 : 8,
                  },
                ]}
              />
            ))}
          </View>
        </View>

        {/* Shop by Category */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Shop by Category</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}
            decelerationRate="fast"
            snapToInterval={Platform.OS === 'ios' ? 110 : undefined}
            snapToAlignment="start"
          >
            {catsLoading ? (
              // Show skeleton loaders while loading
              <>
                <CategorySkeleton />
                <CategorySkeleton />
                <CategorySkeleton />
              </>
            ) : (
              categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  activeOpacity={0.78}
                  style={[
                    styles.categoryCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      borderRadius: colors.radius,
                    },
                  ]}
                  onPress={getCategoryTarget(cat)}
                >
                  <View style={[styles.categoryImageWrap, { backgroundColor: colors.secondary }]}>
                    <OptimizedImage
                      source={getCategoryImage(cat)}
                      style={styles.categoryImage}
                      resizeMode="cover"
                      showLoader={false}
                    />
                  </View>
                  <Text style={[styles.categoryLabel, { color: colors.foreground }]} numberOfLines={1}>
                    {cat.name.split(' ')[0]}
                  </Text>
                  <Text style={[styles.categoryDesc, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {cat.description ?? ''}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>

        {/* Custom Printed Banner - Below Categories */}
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.customBanner}
          onPress={() => router.push('/(tabs)/products')}
        >
          <Image
            source={require('@/assets/images/custom printed banner.png')}
            style={styles.customBannerImage}
            resizeMode="contain"
          />
        </TouchableOpacity>

        {/* Value Propositions */}
        <View style={styles.section}>
          <View style={styles.valuePropsGrid}>
            {VALUE_PROPS.map((prop) => (
              <View
                key={prop.title}
                style={[
                  styles.valuePropCard,
                  { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius },
                ]}
              >
                <View style={[styles.valuePropIcon, { backgroundColor: colors.primary + '15' }]}>
                  <Feather name={prop.icon as any} size={24} color={colors.primary} />
                </View>
                <Text style={[styles.valuePropTitle, { color: colors.foreground }]}>{prop.title}</Text>
                <Text style={[styles.valuePropDesc, { color: colors.mutedForeground }]}>{prop.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* About Section */}
        <View style={[styles.aboutCard, { backgroundColor: colors.secondary, borderRadius: colors.radius }]}>
          <Text style={[styles.aboutText, { color: colors.foreground }]}>
            At PacMonk, we specialize in providing innovative, high-quality flexible packaging solutions tailored to meet the diverse needs of our clients. With a commitment to excellence and sustainability, we offer a wide range of products that cater to various industries, ensuring your products are protected, preserved, and presented in the best possible way.
          </Text>
        </View>

        {/* Contact Section */}
        <View style={styles.section}>
          <View style={styles.contactGrid}>
            {/* Home Online Shopping */}
            <View style={[styles.contactCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
              <View style={[styles.contactIconWrap, { backgroundColor: colors.primary + '15' }]}>
                <Feather name="shopping-bag" size={24} color={colors.primary} />
              </View>
              <View style={styles.contactInfo}>
                <Text style={[styles.contactLabel, { color: colors.mutedForeground }]}>Home Online Shopping</Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => Linking.openURL('tel:+919986291863')}
                >
                  <Text style={[styles.contactValue, { color: colors.foreground }]}>+91 9986291863</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Support Center */}
            <View style={[styles.contactCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
              <View style={[styles.contactIconWrap, { backgroundColor: colors.accent + '15' }]}>
                <Feather name="phone" size={24} color={colors.accent} />
              </View>
              <View style={styles.contactInfo}>
                <Text style={[styles.contactLabel, { color: colors.mutedForeground }]}>Support Center</Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => Linking.openURL('tel:+919986291863')}
                >
                  <Text style={[styles.contactValue, { color: colors.foreground }]}>+91 9986291863</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Store Locations */}
            <View style={[styles.contactCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
              <View style={[styles.contactIconWrap, { backgroundColor: colors.success + '15' }]}>
                <Feather name="map-pin" size={24} color={colors.success} />
              </View>
              <View style={styles.contactInfo}>
                <Text style={[styles.contactLabel, { color: colors.mutedForeground }]}>Store Locations</Text>
                <Text style={[styles.contactValue, { color: colors.foreground }]}>View all 5 stores</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button - Always Visible */}
      <View
        style={[
          styles.fabContainer,
          {
            // Position just above tab bar (56px tab height + insets + 8px small margin)
            bottom: 56 + insets.bottom + 8,
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/(tabs)/products')}
          accessibilityRole="button"
          accessibilityLabel="Start New Order"
        >
          <Feather name="plus" size={24} color="#fff" />
          <Text style={styles.fabText}>Start New Order</Text>
        </TouchableOpacity>
      </View>
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
    paddingVertical: 4,
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
  
  // Banner Carousel Styles
  bannerSection: {
    position: 'relative',
    height: BANNER_HEIGHT,
    backgroundColor: '#f5f5f5',
  },
  bannerScroll: {
    paddingRight: Platform.OS === 'web' ? 0 : 16,
  },
  bannerSlide: {
    width: SCREEN_WIDTH - 32,
    height: BANNER_HEIGHT,
    marginRight: 0,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  paginationDots: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  
  // Custom Printed Banner - Below Categories
  customBanner: {
    width: '100%',
    height: CUSTOM_BANNER_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  customBannerImage: {
    width: '100%',
    height: '100%',
  },
  
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
  categoriesScroll: { 
    paddingRight: 16,
    gap: 10,
  },
  categoryCard: { 
    width: 100,
    alignItems: 'center', 
    padding: 14, 
    borderWidth: 1, 
    gap: 6 
  },
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
  valuePropsGrid: { gap: 12 },
  valuePropCard: { padding: 18, borderWidth: 1, gap: 10 },
  valuePropIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start' },
  valuePropTitle: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  valuePropDesc: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  aboutCard: { padding: 18 },
  aboutText: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 20, textAlign: 'center' },
  contactGrid: { gap: 12 },
  contactCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderWidth: 1, gap: 14 },
  contactIconWrap: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  contactInfo: { flex: 1, gap: 2 },
  contactLabel: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  contactValue: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  
  // Floating Action Button
  fabContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
});
