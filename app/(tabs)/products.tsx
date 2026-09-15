import React, { useEffect, useMemo, useState } from 'react';
import { Image, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { getMinPrice } from '@/constants/stockProducts';
import { fetchProducts } from '@/lib/products';
import { useCategories } from '@/hooks/useCategories';
import * as Haptics from 'expo-haptics';

export default function ProductsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { cart } = useCart();
  const { isWishlisted, toggleWishlist } = useAuth();
  const { q, categoryId } = useLocalSearchParams<{ q?: string; categoryId?: string }>();
  const topPad = Platform.OS === 'web' ? 8 : insets.top + 8;
  const [search, setSearch] = useState(q ?? '');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  });

  // Fetch categories for dynamic filters
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();

  useEffect(() => {
    if (q) setSearch(q);
  }, [q]);

  const filteredProducts = useMemo(() => {
    let filtered = products;
    
    // Filter by URL categoryId if provided (takes precedence)
    if (categoryId) {
      filtered = filtered.filter((p) => {
        const productCategoryId = (p as any).categoryId;
        return productCategoryId === categoryId;
      });
    }
    // Filter by selected category filter (only if not 'all' and no URL categoryId)
    else if (selectedFilter !== 'all') {
      filtered = filtered.filter((p) => {
        const productCategoryId = (p as any).categoryId;
        // Only show products that match the selected category
        return productCategoryId === selectedFilter;
      });
    }
    
    // Then apply search filter if search query exists
    const query = search.trim().toLowerCase();
    if (query) {
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(query) ||
        p.material.toLowerCase().includes(query) ||
        p.desc.toLowerCase().includes(query) ||
        (p.sizes ?? []).some((s) => s.label.toLowerCase().includes(query) || s.code.toLowerCase().includes(query))
      );
    }
    
    // Sort by sortOrder field (lower numbers first), then by product name
    filtered.sort((a, b) => {
      const orderA = (a as any).sortOrder ?? 999;
      const orderB = (b as any).sortOrder ?? 999;
      if (orderA !== orderB) return orderA - orderB;
      return a.name.localeCompare(b.name);
    });
    
    return filtered;
  }, [search, products, categoryId, selectedFilter]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, paddingTop: topPad, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push('/(tabs)')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Ready Stock Products</Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push('/(tabs)/cart')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.cartBtn}
        >
          <Feather name="shopping-cart" size={22} color={colors.foreground} />
          {cart.length > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.accent }]}>
              <Text style={styles.badgeText}>{cart.length > 9 ? '9+' : cart.length}</Text>
            </View>
          )}
        </TouchableOpacity>
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

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {/* Always show "All" first */}
          <TouchableOpacity
            activeOpacity={0.7}
            style={[
              styles.filterChip,
              {
                backgroundColor: selectedFilter === 'all' ? colors.primary : colors.card,
                borderColor: selectedFilter === 'all' ? colors.primary : colors.border,
              },
            ]}
            onPress={() => {
              if (Platform.OS !== 'web') Haptics.selectionAsync();
              setSelectedFilter('all');
            }}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: selectedFilter === 'all' ? '#fff' : colors.foreground },
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          {/* Render dynamic categories */}
          {!categoriesLoading && categories.map((category) => {
            const isActive = selectedFilter === category.id;
            return (
              <TouchableOpacity
                key={category.id}
                activeOpacity={0.7}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isActive ? colors.primary : colors.card,
                    borderColor: isActive ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => {
                  if (Platform.OS !== 'web') Haptics.selectionAsync();
                  setSelectedFilter(category.id);
                }}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: isActive ? '#fff' : colors.foreground },
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Info Banner */}
        <View style={[styles.banner, { backgroundColor: colors.success + '1A' }]}>
          <Feather name="truck" size={18} color={colors.success} />
          <Text style={[styles.bannerText, { color: colors.success }]}>
            Ready to ship! Plain pouches without custom printing. Ships within 24 hours.
          </Text>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          {categoryId 
            ? `FILTERED BY CATEGORY (${filteredProducts.length})`
            : selectedFilter !== 'all'
            ? `${categories.find(c => c.id === selectedFilter)?.name.toUpperCase() || 'FILTERED'} (${filteredProducts.length})`
            : search.trim() 
            ? `SEARCH RESULTS (${filteredProducts.length})` 
            : `AVAILABLE PRODUCTS (${filteredProducts.length})`}
        </Text>

        {filteredProducts.length === 0 && (
          <View style={styles.emptyState}>
            <Feather name="search" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No pouches found</Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
              Try a different search term
            </Text>
          </View>
        )}

        {filteredProducts.map((p) => {
          const minPrice = getMinPrice(p);
          return (
            <TouchableOpacity
              key={p.id}
              activeOpacity={0.85}
              style={[
                styles.card,
                { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius },
              ]}
              onPress={() => router.push({ pathname: '/stock-product/[id]', params: { id: p.id } })}
            >
              <View style={[styles.imageWrap, { borderTopLeftRadius: colors.radius, borderTopRightRadius: colors.radius }]}>
                <Image source={p.image} style={styles.productImage} resizeMode="cover" />
                <TouchableOpacity
                  activeOpacity={0.75}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={[styles.wishlistBtn, { backgroundColor: colors.card }]}
                  onPress={(e) => {
                    e.stopPropagation();
                    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    toggleWishlist(p.id);
                  }}
                >
                  <Feather
                    name="heart"
                    size={16}
                    color={isWishlisted(p.id) ? colors.destructive : colors.mutedForeground}
                    style={isWishlisted(p.id) ? { opacity: 1 } : { opacity: 0.7 }}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.cardBody}>
                <View style={styles.nameRow}>
                  <Text style={[styles.productName, { color: colors.foreground }]}>{p.name}</Text>
                  <Text style={[styles.price, { color: colors.success }]}>₹{minPrice.toFixed(2)}/pc</Text>
                </View>

                <Text style={[styles.desc, { color: colors.mutedForeground }]} numberOfLines={2}>
                  {p.desc}
                </Text>

                {/* Show available colors if product has colors */}
                {(p as any).colors && (p as any).colors.length > 0 && (
                  <View style={styles.colorsRow}>
                    <Feather name="circle" size={12} color={colors.mutedForeground} />
                    <Text style={[styles.colorsText, { color: colors.mutedForeground }]}>
                      {(p as any).colors.filter((c: any) => c.available).length} colors available
                    </Text>
                  </View>
                )}

                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Feather name="maximize-2" size={12} color={colors.mutedForeground} />
                    <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{p.size}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Feather name="layers" size={12} color={colors.mutedForeground} />
                    <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{p.micron}µ</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Feather name="package" size={12} color={colors.mutedForeground} />
                    <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{p.material}</Text>
                  </View>
                </View>

                <View style={styles.badgeRow}>
                  <View style={[styles.tagBadge, { backgroundColor: colors.success + '1A' }]}>
                    <Feather name="disc" size={11} color={colors.success} />
                    <Text style={[styles.tagBadgeText, { color: colors.success }]}>MOQ: {p.moq}</Text>
                  </View>
                  {p.inStock && (
                    <View style={[styles.tagBadge, { backgroundColor: colors.success + '1A' }]}>
                      <Feather name="check-circle" size={11} color={colors.success} />
                      <Text style={[styles.tagBadgeText, { color: colors.success }]}>In Stock</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  title: { flex: 1, fontSize: 17, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  cartBtn: { position: 'relative', padding: 2 },
  badge: {
    position: 'absolute', top: -4, right: -6,
    minWidth: 16, height: 16, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 9, fontFamily: 'Inter_700Bold' },
  scroll: { padding: 16, gap: 14, paddingBottom: 20 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, height: 48,
    borderRadius: 10, borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', height: '100%' },
  filterScroll: {
    paddingRight: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  filterChipText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyTitle: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  emptyDesc: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12 },
  bannerText: { flex: 1, fontSize: 12.5, fontFamily: 'Inter_500Medium', lineHeight: 18 },
  sectionLabel: { fontSize: 12, fontFamily: 'Inter_700Bold', letterSpacing: 0.5, marginTop: 2 },
  card: { borderWidth: 1, overflow: 'hidden' },
  imageWrap: { width: '100%', height: 160, backgroundColor: '#1A1A1A', overflow: 'hidden', position: 'relative' },
  wishlistBtn: {
    position: 'absolute', top: 10, right: 10,
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  productImage: { width: '100%', height: '100%' },
  cardBody: { padding: 14, gap: 8 },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  productName: { fontSize: 16, fontFamily: 'Inter_700Bold', flex: 1 },
  price: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  desc: { fontSize: 12.5, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  colorsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  colorsText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  metaRow: { flexDirection: 'row', gap: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 2 },
  tagBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 6 },
  tagBadgeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
});
