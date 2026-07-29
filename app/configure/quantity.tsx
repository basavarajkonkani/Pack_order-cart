import React, { useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart, calculatePrice, getMinOrder, getTotalSteps, hasMaterialStep } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { ArtworkError, formatFileSize, pickArtwork, uploadArtwork, UploadedArtwork } from '@/lib/artwork';
import { StepIndicator } from '@/components/StepIndicator';
import { PrimaryButton } from '@/components/PrimaryButton';
import * as Haptics from 'expo-haptics';

export default function QuantityScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { config, setConfig } = useCart();
  const { user } = useAuth();
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const minOrder = getMinOrder(config.pouchType ?? 'plain');
  const [quantity, setQuantity] = useState(minOrder);
  const [artwork, setArtwork] = useState<UploadedArtwork | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const step = 1000;

  const handlePickArtwork = async () => {
    setUploadError(null);
    if (!user) {
      setUploadError('Please sign in to upload your artwork.');
      return;
    }
    try {
      const picked = await pickArtwork();
      if (!picked) return;
      if (Platform.OS !== 'web') Haptics.selectionAsync();
      setUploading(true);
      setArtwork(await uploadArtwork(picked, user.uid));
    } catch (err) {
      console.warn('[artwork] upload failed:', err);
      setUploadError(
        err instanceof ArtworkError
          ? err.message
          : 'Upload failed. Check your connection and try again.'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveArtwork = () => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setArtwork(null);
    setUploadError(null);
  };

  const materialReady = !hasMaterialStep(config.pouchType) || !!config.materialType;

  const priceEstimate =
    config.pouchType && config.windowOption && materialReady && config.capacity
      ? calculatePrice({
          pouchType: config.pouchType,
          windowOption: config.windowOption,
          materialType: config.materialType,
          capacity: config.capacity,
          quantity,
        })
      : 0;

  const decrement = () => {
    if (quantity <= minOrder) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setQuantity(Math.max(minOrder, quantity - step));
  };

  const increment = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setQuantity(quantity + step);
  };

  const handleContinue = () => {
    setConfig({
      quantity,
      artworkUpload: !!artwork,
      artworkUrl: artwork?.url,
      artworkName: artwork?.name,
      artworkSize: artwork?.size,
    });
    router.push('/configure/price-summary');
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StepIndicator
        currentStep={getTotalSteps(config.pouchType)}
        totalSteps={getTotalSteps(config.pouchType)}
        label="Quantity & Customisation"
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={[styles.question, { color: colors.foreground }]}>Set your order quantity</Text>

        {/* Quantity Control */}
        <View style={[styles.qtyCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <Text style={[styles.qtyLabel, { color: colors.mutedForeground }]}>Quantity (pcs)</Text>
          <View style={styles.qtyRow}>
            <TouchableOpacity
              activeOpacity={quantity <= minOrder ? 1 : 0.7}
              onPress={decrement}
              disabled={quantity <= minOrder}
              style={[styles.qtyBtn, { backgroundColor: colors.secondary, borderRadius: 10, opacity: quantity <= minOrder ? 0.4 : 1 }]}
            >
              <Feather name="minus" size={22} color={colors.primary} />
            </TouchableOpacity>
            <Text style={[styles.qtyValue, { color: colors.foreground }]}>
              {quantity.toLocaleString('en-IN')}
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={increment}
              style={[styles.qtyBtn, { backgroundColor: colors.secondary, borderRadius: 10 }]}
            >
              <Feather name="plus" size={22} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.minNote, { color: colors.mutedForeground }]}>
            Minimum Order: {minOrder.toLocaleString('en-IN')} pcs
          </Text>
        </View>

        {/* Artwork Upload (printed pouches) */}
        {config.pouchType === 'printed' && (
          <View style={[styles.artworkCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
            <View style={styles.artworkHeader}>
              <Feather name="upload" size={20} color={colors.primary} />
              <Text style={[styles.artworkTitle, { color: colors.foreground }]}>Artwork Upload</Text>
              <Text style={[styles.artworkSub, { color: colors.mutedForeground }]}>(For Printed Pouches)</Text>
            </View>

            {artwork ? (
              <View
                style={[
                  styles.artworkUploadBtn,
                  { backgroundColor: colors.primary + '12', borderColor: colors.primary, borderRadius: 10 },
                ]}
              >
                <Feather name="file-text" size={22} color={colors.primary} />
                <View style={styles.artworkFileMeta}>
                  <Text style={[styles.uploadBtnText, { color: colors.primary }]} numberOfLines={1}>
                    {artwork.name}
                  </Text>
                  <Text style={[styles.uploadBtnSub, { color: colors.mutedForeground }]}>
                    {[formatFileSize(artwork.size), 'Uploaded'].filter(Boolean).join(' · ')}
                  </Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleRemoveArtwork}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${artwork.name}`}
                >
                  <Feather name="x-circle" size={20} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                activeOpacity={0.8}
                disabled={uploading}
                onPress={handlePickArtwork}
                accessibilityRole="button"
                accessibilityLabel="Upload design or reference file"
                style={[
                  styles.artworkUploadBtn,
                  { backgroundColor: colors.secondary, borderColor: colors.border, borderRadius: 10, opacity: uploading ? 0.7 : 1 },
                ]}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Feather name="upload-cloud" size={22} color={colors.mutedForeground} />
                )}
                <View style={styles.artworkFileMeta}>
                  <Text style={[styles.uploadBtnText, { color: colors.foreground }]}>
                    {uploading ? 'Uploading…' : 'Upload Design or Reference File'}
                  </Text>
                  <Text style={[styles.uploadBtnSub, { color: colors.mutedForeground }]}>PDF, AI, PNG, JPG, PSD (Max 50MB)</Text>
                </View>
              </TouchableOpacity>
            )}

            {uploadError && (
              <Text style={[styles.artworkError, { color: colors.destructive }]}>{uploadError}</Text>
            )}

            <TouchableOpacity activeOpacity={0.7} style={styles.designHelpBtn}>
              <Feather name="help-circle" size={16} color={colors.primary} />
              <Text style={[styles.designHelpText, { color: colors.primary }]}>Need Design Assistance?</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Live Price Estimate */}
        <View style={[styles.estimateCard, { backgroundColor: colors.primary + '0D', borderColor: colors.primary + '30', borderRadius: colors.radius }]}>
          <View style={styles.estimateRow}>
            <Feather name="tag" size={16} color={colors.primary} />
            <Text style={[styles.estimateLabel, { color: colors.primary }]}>Estimated Price</Text>
            <Text style={[styles.estimatePrice, { color: colors.primary }]}>₹{priceEstimate.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.estimateRow}>
            <Feather name="clock" size={16} color={colors.mutedForeground} />
            <Text style={[styles.estimateLabel, { color: colors.mutedForeground }]}>Delivery Time</Text>
            <Text style={[styles.estimateDelivery, { color: colors.mutedForeground }]}>12 – 15 Days</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.border, paddingBottom: bottomPad + 16 }]}>
        <PrimaryButton label="Calculate Price" onPress={handleContinue} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 20, gap: 16, paddingBottom: 20 },
  question: { fontSize: 17, fontFamily: 'Inter_600SemiBold', marginBottom: 4 },
  qtyCard: { padding: 20, borderWidth: 1, gap: 14 },
  qtyLabel: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  qtyBtn: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  qtyValue: { fontSize: 32, fontFamily: 'Inter_700Bold' },
  minNote: { fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  artworkCard: { padding: 16, borderWidth: 1, gap: 12 },
  artworkHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  artworkTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  artworkSub: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  artworkUploadBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderWidth: 1 },
  artworkFileMeta: { flex: 1 },
  artworkError: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  uploadBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  uploadBtnSub: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
  designHelpBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center' },
  designHelpText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  estimateCard: { padding: 16, borderWidth: 1, gap: 10 },
  estimateRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  estimateLabel: { flex: 1, fontSize: 13, fontFamily: 'Inter_500Medium' },
  estimatePrice: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  estimateDelivery: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  footer: { padding: 20, borderTopWidth: 1 },
});
