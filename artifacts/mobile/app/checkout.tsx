import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '@/context/CartContext';
import { PrimaryButton } from '@/components/PrimaryButton';
import * as Haptics from 'expo-haptics';

type PaymentMethod = 'upi' | 'bank' | 'credit';

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string; sub: string; icon: string }[] = [
  { value: 'upi', label: 'UPI / QR', sub: 'Instant payment via UPI apps', icon: 'smartphone' },
  { value: 'bank', label: 'Bank Transfer', sub: 'NEFT / RTGS / IMPS', icon: 'credit-card' },
  { value: 'credit', label: 'Credit Terms', sub: 'For existing customers', icon: 'file-text' },
];

export default function CheckoutScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { cart, cartTotal, placeOrder } = useCart();
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const [address, setAddress] = useState('No. 12, 3rd Cross, Peenya Industrial Area,\nBangalore – 560058, Karnataka');
  const [gstNumber, setGstNumber] = useState('29ABCDE01234F1Z5');
  const [payment, setPayment] = useState<PaymentMethod>('upi');
  const [loading, setLoading] = useState(false);

  const handlePlaceOrder = async () => {
    if (!address || !gstNumber) return;
    setLoading(true);
    if (Platform.OS !== 'web') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    const order = placeOrder(address, gstNumber, payment);
    setLoading(false);
    router.replace({ pathname: '/order-success', params: { orderId: order.orderId, orderKey: order.id } });
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Checkout</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Delivery Address */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <View style={styles.sectionHeader}>
            <Feather name="map-pin" size={16} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Delivery Address</Text>
            <Pressable style={({ pressed }) => [styles.changeBtn, { backgroundColor: colors.secondary, borderRadius: 6, opacity: pressed ? 0.7 : 1 }]}>
              <Text style={[styles.changeBtnText, { color: colors.primary }]}>Change</Text>
            </Pressable>
          </View>
          <TextInput
            style={[styles.addressInput, { color: colors.foreground, borderColor: colors.border }]}
            value={address}
            onChangeText={setAddress}
            multiline
            numberOfLines={3}
            placeholder="Enter delivery address"
            placeholderTextColor={colors.mutedForeground}
          />
        </View>

        {/* GST Details */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <View style={styles.sectionHeader}>
            <Feather name="file-text" size={16} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>GST Details</Text>
            <Pressable style={({ pressed }) => [styles.changeBtn, { backgroundColor: colors.secondary, borderRadius: 6, opacity: pressed ? 0.7 : 1 }]}>
              <Text style={[styles.changeBtnText, { color: colors.primary }]}>Change</Text>
            </Pressable>
          </View>
          <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>GST Number</Text>
          <TextInput
            style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
            value={gstNumber}
            onChangeText={setGstNumber}
            placeholder="Enter GST number"
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="characters"
          />
        </View>

        {/* Payment Method */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <View style={styles.sectionHeader}>
            <Feather name="credit-card" size={16} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Payment Method</Text>
          </View>
          {PAYMENT_OPTIONS.map((opt) => {
            const active = payment === opt.value;
            return (
              <Pressable
                key={opt.value}
                style={({ pressed }) => [
                  styles.paymentOption,
                  {
                    backgroundColor: active ? colors.primary + '10' : 'transparent',
                    borderColor: active ? colors.primary : colors.border,
                    borderRadius: 10,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
                onPress={() => {
                  if (Platform.OS !== 'web') Haptics.selectionAsync();
                  setPayment(opt.value);
                }}
              >
                <View style={[styles.paymentIcon, { backgroundColor: active ? colors.primary : colors.secondary }]}>
                  <Feather name={opt.icon as any} size={16} color={active ? '#fff' : colors.primary} />
                </View>
                <View style={styles.paymentText}>
                  <Text style={[styles.paymentLabel, { color: colors.foreground }]}>{opt.label}</Text>
                  <Text style={[styles.paymentSub, { color: colors.mutedForeground }]}>{opt.sub}</Text>
                </View>
                <View style={[styles.radio, { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primary : 'transparent' }]}>
                  {active && <Feather name="check" size={11} color="#fff" />}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Order Summary */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <View style={styles.sectionHeader}>
            <Feather name="shopping-cart" size={16} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Order Summary</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>{cart.length} item{cart.length !== 1 ? 's' : ''}</Text>
            <Text style={[styles.summaryValue, { color: colors.foreground }]}>₹{cartTotal.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>GST</Text>
            <Text style={[styles.summaryValue, { color: colors.mutedForeground }]}>As applicable</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryRow}>
            <Text style={[styles.totalLabel, { color: colors.foreground }]}>Total Amount</Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>₹{cartTotal.toLocaleString('en-IN')}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.border, paddingBottom: bottomPad + 12 }]}>
        <PrimaryButton
          label="Place Order"
          onPress={handlePlaceOrder}
          loading={loading}
          disabled={!address || !gstNumber || cart.length === 0}
          variant="accent"
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: { width: 36, alignItems: 'flex-start' },
  title: { flex: 1, fontSize: 18, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  scroll: { padding: 16, gap: 14, paddingBottom: 20 },
  section: { padding: 16, borderWidth: 1, gap: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { flex: 1, fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  changeBtn: { paddingHorizontal: 10, paddingVertical: 5 },
  changeBtnText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  addressInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    minHeight: 72,
    textAlignVertical: 'top',
  },
  inputLabel: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  paymentOption: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderWidth: 1.5, marginBottom: 8 },
  paymentIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  paymentText: { flex: 1 },
  paymentLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  paymentSub: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 1 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  summaryValue: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  divider: { height: 1 },
  totalLabel: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  totalValue: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  footer: { padding: 16, borderTopWidth: 1 },
});
