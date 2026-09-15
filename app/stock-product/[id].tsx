import React, { useEffect, useMemo, useState } from 'react';
import { Image, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { StockSize } from '@/constants/stockProducts';
import { fetchProduct } from '@/lib/products';
import { PrimaryButton } from '@/components/PrimaryButton';
import * as Haptics from 'expo-haptics';

const QUICK_QUANTITIES = [100, 500, 1000, 2000, 5000];

export default function StockProductDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useAuth();
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => fetchProduct(id ?? ''),
    enabled: !!id,
  });

  const [selectedSize, setSelectedSize] = useState<StockSize | undefined>(undefined);
  const [quantity, setQuantity] = useState<number>(100);
  const [quantityText, setQuantityText] = useState<string>('100');
  const [selectedColor, setSelectedColor] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (product && !selectedSize) {
      setSelectedSize(product.sizes[0]);
      setQuantity(product.moq);
      setQuantityText(String(product.moq));
      // Auto-select first available color if colors exist
      const availableColors = (product as any).colors?.filter((c: any) => c.available) || [];
      if (availableColors.length > 0) {
        setSelectedColor(availableColors[0].name);
      }
    }
  }, [product, selectedSize]);

  const minPrice = useMemo(
    () => (product && product.sizes.length > 0 ? Math.min(...product.sizes.map((s) => s.pricePerPiece)) : 0),
    [product]
  );

  if (isLoading) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: colors.foreground, fontFamily: 'Inter_600SemiBold' }}>Loading...</Text>
      </View>
    );
  }

  if (!product || !selectedSize) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: colors.foreground, fontFamily: 'Inter_600SemiBold' }}>Product not found</Text>
      </View>
    );
  }

  const moq = product.moq;
  const subtotal = Math.round(selectedSize.pricePerPiece * quantity * 100) / 100;

  const handleSelectSize = (size: StockSize) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setSelectedSize(size);
  };

  const setQty = (value: number) => {
    const clamped = Math.max(moq, value);
    setQuantity(clamped);
    setQuantityText(String(clamped));
  };

  const decrement = () => {
    if (quantity <= moq) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setQty(quantity - moq);
  };

  const increment = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setQty(quantity + moq);
  };

  const handleQuantityInput = (text: string) => {
    const numeric = text.replace(/[^0-9]/g, '');
    setQuantityText(numeric);
    if (numeric === '') return;
    setQuantity(parseInt(numeric, 10));
  };

  const handleQuantityBlur = () => {
    setQty(quantity || moq);
  };

  const handleAddToCart = () => {
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addToCart({
      kind: 'stock',
      productId: product.id,
      productName: product.name,
      productImage: product.image,
      productColor: selectedColor, // Include selected color
      sizeCode: selectedSize.code,
      sizeLabel: selectedSize.label,
      sizeWeight: selectedSize.weight,
      pricePerPiece: selectedSize.pricePerPiece,
      quantity,
      price: subtotal,
    });
    router.push('/(tabs)/cart');
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Product Details</Text>
        <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/(tabs)/cart')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Feather name="shopping-cart" size={22} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Hero Image */}
        <View style={[styles.imageWrap, { borderRadius: colors.radius }]}>
          <Image source={product.image} style={styles.productImage} resizeMode="cover" />
          <TouchableOpacity
            activeOpacity={0.75}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={[styles.wishlistBtn, { backgroundColor: colors.card }]}
            onPress={() => {
              if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              toggleWishlist(product.id);
            }}
          >
            <Feather
              name="heart"
              size={18}
              color={isWishlisted(product.id) ? colors.destructive : colors.mutedForeground}
            />
          </TouchableOpacity>
        </View>

        {/* Title & Price */}
        <View style={styles.titleBlock}>
          <Text style={[styles.productName, { color: colors.foreground }]}>{product.name}</Text>
          <Text style={[styles.startingLabel, { color: colors.mutedForeground }]}>Starting From</Text>
          <Text style={[styles.startingPrice, { color: colors.success }]}>₹{minPrice.toFixed(2)}</Text>
          <Text style={[styles.desc, { color: colors.mutedForeground }]}>{product.desc}</Text>
          <View style={styles.badgeRow}>
            {product.inStock && (
              <View style={[styles.tagBadge, { backgroundColor: colors.success + '1A' }]}>
                <Feather name="check-circle" size={11} color={colors.success} />
                <Text style={[styles.tagBadgeText, { color: colors.success }]}>In Stock</Text>
              </View>
            )}
            <View style={[styles.tagBadge, { backgroundColor: colors.success + '1A' }]}>
              <Feather name="disc" size={11} color={colors.success} />
              <Text style={[styles.tagBadgeText, { color: colors.success }]}>MOQ: {product.moq}</Text>
            </View>
          </View>
        </View>

        {/* Available Colors */}
        {(product as any).colors && (product as any).colors.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Available Colors</Text>
            <View style={styles.colorList}>
              {(product as any).colors
                .filter((color: any) => color.available)
                .map((color: any) => {
                  const active = selectedColor === color.name;
                  return (
                    <TouchableOpacity
                      key={color.name}
                      activeOpacity={0.7}
                      style={[
                        styles.colorChip,
                        {
                          backgroundColor: active ? colors.primary + '15' : colors.card,
                          borderColor: active ? colors.primary : colors.border,
                          borderRadius: colors.radius,
                        },
                      ]}
                      onPress={() => {
                        if (Platform.OS !== 'web') Haptics.selectionAsync();
                        setSelectedColor(color.name);
                      }}
                    >
                      {color.hexCode && (
                        <View
                          style={[
                            styles.colorDot,
                            {
                              backgroundColor: color.hexCode,
                              borderColor: colors.border,
                            },
                          ]}
                        />
                      )}
                      <Text style={[styles.colorName, { color: active ? colors.primary : colors.foreground }]}>
                        {color.name}
                      </Text>
                      {active && <Feather name="check-circle" size={16} color={colors.primary} />}
                    </TouchableOpacity>
                  );
                })}
            </View>
            <Text style={[styles.colorNote, { color: colors.mutedForeground }]}>
              {(product as any).colors.filter((c: any) => !c.available).length > 0 &&
                `${(product as any).colors.filter((c: any) => !c.available).length} color(s) currently unavailable`}
            </Text>
          </View>
        )}

        {/* Select Size */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Select Size</Text>
          <View style={styles.sizeList}>
            {product.sizes.map((size) => {
              const active = selectedSize.code === size.code;
              return (
                <TouchableOpacity
                  key={size.code}
                  activeOpacity={0.82}
                  style={[
                    styles.sizeCard,
                    {
                      backgroundColor: active ? colors.primary + '12' : colors.card,
                      borderColor: active ? colors.primary : colors.border,
                      borderRadius: colors.radius,
                    },
                  ]}
                  onPress={() => handleSelectSize(size)}
                >
                  <View style={styles.sizeTextBlock}>
                    <Text style={[styles.sizeLabel, { color: colors.foreground }]}>{size.label}</Text>
                    <Text style={[styles.sizeSub, { color: colors.mutedForeground }]}>
                      {size.code} - {size.weight}
                    </Text>
                  </View>
                  <Text style={[styles.sizePrice, { color: colors.foreground }]}>₹{size.pricePerPiece.toFixed(2)}</Text>
                  <View style={[styles.radio, { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primary : 'transparent' }]}>
                    {active && <Feather name="check" size={11} color="#fff" />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Specifications */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Specifications</Text>
          {[
            { label: 'Micron', value: `${product.micron}` },
            { label: 'Material', value: product.material },
            { label: 'Sealing', value: product.sealing },
            { label: 'Heat Resistance', value: product.heatResistance },
          ].map((row) => (
            <View key={row.label} style={styles.specRow}>
              <Text style={[styles.specLabel, { color: colors.mutedForeground }]}>{row.label}</Text>
              <Text style={[styles.specValue, { color: colors.foreground }]}>{row.value}</Text>
            </View>
          ))}
        </View>

        {/* Delivery Info */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Delivery Information</Text>
          <View style={[styles.deliveryCard, { backgroundColor: colors.success + '14', borderRadius: colors.radius }]}>
            <View style={styles.deliveryRow}>
              <Feather name="truck" size={16} color={colors.success} />
              <Text style={[styles.deliveryText, { color: colors.success }]}>Ships within 24 hours</Text>
            </View>
            <View style={styles.deliveryRow}>
              <Feather name="package" size={16} color={colors.success} />
              <Text style={[styles.deliveryText, { color: colors.success }]}>Plain pouches without custom printing</Text>
            </View>
          </View>
        </View>

        {/* Quantity */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quantity (pieces)</Text>
          <View style={styles.qtyRow}>
            <TouchableOpacity
              activeOpacity={quantity <= moq ? 1 : 0.7}
              onPress={decrement}
              disabled={quantity <= moq}
              style={[styles.qtyBtn, { backgroundColor: colors.success, borderRadius: 10, opacity: quantity <= moq ? 0.4 : 1 }]}
            >
              <Feather name="minus" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={[styles.qtyInputWrap, { borderColor: colors.border, borderRadius: 10 }]}>
              <TextInput
                style={[styles.qtyValue, { color: colors.foreground }]}
                value={quantityText}
                onChangeText={handleQuantityInput}
                onBlur={handleQuantityBlur}
                keyboardType="number-pad"
                textAlign="center"
              />
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={increment}
              style={[styles.qtyBtn, { backgroundColor: colors.success, borderRadius: 10 }]}
            >
              <Feather name="plus" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.quickQtyRow}>
            {QUICK_QUANTITIES.map((q) => {
              const active = quantity === q;
              return (
                <TouchableOpacity
                  key={q}
                  activeOpacity={0.8}
                  style={[
                    styles.quickQtyBtn,
                    {
                      backgroundColor: active ? colors.success : colors.secondary,
                      borderRadius: 8,
                    },
                  ]}
                  onPress={() => {
                    if (Platform.OS !== 'web') Haptics.selectionAsync();
                    setQty(q);
                  }}
                >
                  <Text style={[styles.quickQtyText, { color: active ? '#fff' : colors.primary }]}>
                    {q.toLocaleString('en-IN')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={[styles.subtotalRow, { borderColor: colors.border }]}>
            <Text style={[styles.subtotalLabel, { color: colors.mutedForeground }]}>Subtotal</Text>
            <Text style={[styles.subtotalValue, { color: colors.foreground }]}>
              ₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.border, paddingBottom: bottomPad + 16, backgroundColor: colors.card }]}>
        <View style={styles.footerLeft}>
          <Text style={[styles.footerTotalLabel, { color: colors.mutedForeground }]}>Total</Text>
          <Text style={[styles.footerTotalValue, { color: colors.foreground }]}>
            ₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          <Text style={[styles.footerUnits, { color: colors.mutedForeground }]}>{quantity.toLocaleString('en-IN')} units</Text>
        </View>
        <View style={styles.footerBtn}>
          <PrimaryButton label="Add to Cart" onPress={handleAddToCart} variant="accent" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  title: { flex: 1, fontSize: 17, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  scroll: { padding: 16, gap: 18, paddingBottom: 20 },
  imageWrap: { width: '100%', height: 220, overflow: 'hidden', backgroundColor: '#1A1A1A', position: 'relative' },
  wishlistBtn: {
    position: 'absolute', top: 12, right: 12,
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  productImage: { width: '100%', height: '100%' },
  titleBlock: { gap: 4 },
  productName: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  startingLabel: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 4 },
  startingPrice: { fontSize: 24, fontFamily: 'Inter_700Bold' },
  desc: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 19, marginTop: 4 },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  tagBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 6 },
  tagBadgeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  section: { gap: 10 },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  colorList: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  colorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1.5,
  },
  colorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
  },
  colorName: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  colorNote: { fontSize: 12, fontFamily: 'Inter_400Regular', fontStyle: 'italic', marginTop: 4 },
  sizeList: { gap: 10 },
  sizeCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderWidth: 1.5, gap: 10 },
  sizeTextBlock: { flex: 1, gap: 2 },
  sizeLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  sizeSub: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  sizePrice: { fontSize: 15, fontFamily: 'Inter_700Bold', marginRight: 4 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  card: { padding: 16, borderWidth: 1, gap: 10 },
  specRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  specLabel: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  specValue: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  deliveryCard: { padding: 14, gap: 8 },
  deliveryRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  deliveryText: { fontSize: 12.5, fontFamily: 'Inter_500Medium' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  qtyInputWrap: { flex: 1, height: 48, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  qtyValue: { 
    fontSize: 17, 
    fontFamily: 'Inter_700Bold',
    width: '100%',
    borderWidth: 0,
  },
  quickQtyRow: { flexDirection: 'row', gap: 8 },
  quickQtyBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
  quickQtyText: { fontSize: 12.5, fontFamily: 'Inter_600SemiBold' },
  subtotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1 },
  subtotalLabel: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  subtotalValue: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  footer: { flexDirection: 'row', alignItems: 'center', padding: 16, borderTopWidth: 1, gap: 14 },
  footerLeft: { gap: 1 },
  footerTotalLabel: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  footerTotalValue: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  footerUnits: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  footerBtn: { flex: 1 },
});
