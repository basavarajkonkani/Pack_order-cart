import React, { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert, Share } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart, getItemTitle, getItemSpec } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { generateInvoiceHTML, generateInvoiceText } from '@/lib/invoiceGenerator';
import { fetchBusinessSettings } from '@/lib/businessSettings';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const TIMELINE = [
  { key: 'confirmed', label: 'Order Confirmed', icon: 'check-circle' },
  { key: 'approved', label: 'Artwork Approved', icon: 'image' },
  { key: 'production', label: 'Production Started', icon: 'settings' },
  { key: 'printing', label: 'Printing', icon: 'printer' },
  { key: 'dispatched', label: 'Dispatched', icon: 'truck' },
  { key: 'delivered', label: 'Delivered', icon: 'package' },
];

const STATUS_DATES = [
  '20 May 2026, 10:15 AM',
  '21 May 2026, 03:15 PM',
  '22 May 2026, 09:00 AM',
  '24 May 2026, 11:30 AM',
  '28 May 2026',
  '30 May 2026',
];

export default function OrderTrackingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { orderId, orderKey } = useLocalSearchParams<{ orderId: string; orderKey: string }>();
  const { orders } = useCart();
  const { profile } = useAuth();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const [loadingInvoice, setLoadingInvoice] = useState(false);

  const order = orders.find((o) => o.id === orderKey) ?? orders.find((o) => o.orderId === orderId);
  const currentStep = TIMELINE.findIndex((t) => t.key === (order?.status ?? 'confirmed'));

  const handleViewInvoice = async () => {
    if (!order) return;
    
    setLoadingInvoice(true);
    try {
      const businessSettings = await fetchBusinessSettings();
      const invoiceHTML = await generateInvoiceHTML({
        order,
        businessSettings,
        customerName: profile?.name,
        customerEmail: profile?.email,
        customerPhone: profile?.phone,
      });

      if (Platform.OS === 'web') {
        // For web, open in new window
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(invoiceHTML);
          printWindow.document.close();
        }
      } else {
        // For mobile, use expo-print to generate PDF
        const { uri } = await Print.printToFileAsync({ html: invoiceHTML });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: `Invoice ${order.orderId}`,
            UTI: 'com.adobe.pdf',
          });
        } else {
          Alert.alert('Invoice Generated', 'Invoice has been saved but sharing is not available on this device.');
        }
      }
    } catch (error) {
      console.error('Failed to generate invoice:', error);
      Alert.alert('Error', 'Failed to generate invoice. Please try again.');
    } finally {
      setLoadingInvoice(false);
    }
  };

  const handleShareInvoice = async () => {
    if (!order) return;
    
    try {
      const businessSettings = await fetchBusinessSettings();
      const invoiceText = generateInvoiceText({
        order,
        businessSettings,
        customerName: profile?.name,
      });

      await Share.share({
        message: invoiceText,
        title: `Invoice ${order.orderId}`,
      });
    } catch (error) {
      console.error('Failed to share invoice:', error);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/(tabs)/orders')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Order Tracking</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 24 }]}>
        {/* Order Header */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <View style={styles.orderMeta}>
            <View>
              <Text style={[styles.orderIdLabel, { color: colors.mutedForeground }]}>Order ID</Text>
              <Text style={[styles.orderIdValue, { color: colors.primary }]}>{order?.orderId ?? orderId ?? 'PCH0000'}</Text>
            </View>
            <View style={styles.orderDateBlock}>
              <Text style={[styles.orderIdLabel, { color: colors.mutedForeground }]}>Order Date</Text>
              <Text style={[styles.dateValue, { color: colors.foreground }]}>
                {order
                  ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                  : '20 May 2026'}
              </Text>
            </View>
          </View>
        </View>

        {/* Timeline */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Order Progress</Text>
          {TIMELINE.map((step, i) => {
            const done = i <= currentStep;
            const isCurrent = i === currentStep;
            return (
              <View key={step.key} style={styles.timelineItem}>
                <View style={styles.lineCol}>
                  <View style={[styles.dot, { backgroundColor: done ? colors.primary : colors.border }]}>
                    {done && <Feather name="check" size={10} color="#fff" />}
                  </View>
                  {i < TIMELINE.length - 1 && (
                    <View style={[styles.connector, { backgroundColor: i < currentStep ? colors.primary : colors.border }]} />
                  )}
                </View>
                <View style={[styles.timelineContent, { marginBottom: i < TIMELINE.length - 1 ? 20 : 0 }]}>
                  <View style={styles.timelineRow}>
                    <Feather name={step.icon as any} size={16} color={done ? colors.primary : colors.mutedForeground} />
                    <Text style={[styles.stepLabel, { color: done ? colors.foreground : colors.mutedForeground, fontFamily: isCurrent ? 'Inter_700Bold' : 'Inter_500Medium' }]}>
                      {step.label}
                    </Text>
                    {isCurrent && (
                      <View style={[styles.activeBadge, { backgroundColor: colors.primary + '20' }]}>
                        <Text style={[styles.activeBadgeText, { color: colors.primary }]}>Current</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.stepDate, { color: colors.mutedForeground }]}>
                    {done ? STATUS_DATES[i] : `Expected: ${STATUS_DATES[i]}`}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Order Items */}
        {order && order.items.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Items Ordered</Text>
            {order.items.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <View style={[styles.itemIcon, { backgroundColor: colors.secondary }]}>
                  <Feather name="package" size={18} color={colors.primary} />
                </View>
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemName, { color: colors.foreground }]}>{getItemTitle(item)}</Text>
                  <Text style={[styles.itemSpec, { color: colors.mutedForeground }]}>{getItemSpec(item)}</Text>
                  <Text style={[styles.itemSpec, { color: colors.mutedForeground }]}>Qty: {item.quantity.toLocaleString('en-IN')} pcs</Text>
                </View>
                <Text style={[styles.itemPrice, { color: colors.primary }]}>₹{item.price.toLocaleString('en-IN')}</Text>
              </View>
            ))}
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            {order.subtotal && order.gstAmount && order.totalAmount ? (
              <>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Subtotal</Text>
                  <Text style={[styles.summaryValue, { color: colors.foreground }]}>₹{order.subtotal.toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>GST ({order.gstPercentage}%)</Text>
                  <Text style={[styles.summaryValue, { color: colors.foreground }]}>₹{order.gstAmount.toLocaleString('en-IN')}</Text>
                </View>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <View style={styles.totalRow}>
                  <Text style={[styles.totalLabel, { color: colors.foreground }]}>Grand Total</Text>
                  <Text style={[styles.totalValue, { color: colors.primary }]}>₹{order.totalAmount.toLocaleString('en-IN')}</Text>
                </View>
              </>
            ) : (
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: colors.foreground }]}>Total</Text>
                <Text style={[styles.totalValue, { color: colors.primary }]}>₹{order.total.toLocaleString('en-IN')}</Text>
              </View>
            )}
          </View>
        )}

        {/* Invoice Actions */}
        {order && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>GST Invoice</Text>
            <View style={styles.invoiceActions}>
              <TouchableOpacity
                activeOpacity={0.78}
                style={[styles.invoiceBtn, { backgroundColor: colors.primary, borderRadius: colors.radius }]}
                onPress={handleViewInvoice}
                disabled={loadingInvoice}
              >
                <Feather name={loadingInvoice ? 'loader' : 'file-text'} size={18} color="#fff" />
                <Text style={styles.invoiceBtnText}>{loadingInvoice ? 'Generating...' : 'View Invoice'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.78}
                style={[styles.invoiceBtn, styles.invoiceBtnSecondary, { borderColor: colors.border, borderRadius: colors.radius, backgroundColor: colors.card }]}
                onPress={handleShareInvoice}
              >
                <Feather name="share-2" size={18} color={colors.primary} />
                <Text style={[styles.invoiceBtnText, { color: colors.primary }]}>Share Invoice</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Support */}
        <TouchableOpacity
          activeOpacity={0.78}
          style={[styles.supportBtn, { borderColor: colors.border, borderRadius: colors.radius, backgroundColor: colors.card }]}
          onPress={() => router.push('/help-support')}
        >
          <Feather name="headphones" size={18} color={colors.primary} />
          <Text style={[styles.supportText, { color: colors.primary }]}>Need Help? Contact Support</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  title: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  scroll: { padding: 16, gap: 14 },
  card: { padding: 16, borderWidth: 1, gap: 14 },
  orderMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  orderDateBlock: { alignItems: 'flex-end' },
  orderIdLabel: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  orderIdValue: { fontSize: 17, fontFamily: 'Inter_700Bold', marginTop: 2 },
  dateValue: { fontSize: 13, fontFamily: 'Inter_600SemiBold', marginTop: 2 },
  sectionTitle: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  timelineItem: { flexDirection: 'row', gap: 14 },
  lineCol: { alignItems: 'center', width: 20 },
  dot: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  connector: { width: 2, flex: 1, marginTop: 4 },
  timelineContent: { flex: 1 },
  timelineRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepLabel: { fontSize: 14, flex: 1 },
  activeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  activeBadgeText: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  stepDate: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 3, marginLeft: 24 },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  itemIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  itemInfo: { flex: 1, gap: 2 },
  itemName: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  itemSpec: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  itemPrice: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  divider: { height: 1 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  summaryValue: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  totalValue: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  invoiceActions: { flexDirection: 'row', gap: 10 },
  invoiceBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14 },
  invoiceBtnSecondary: { borderWidth: 1 },
  invoiceBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  supportBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 14, borderWidth: 1 },
  supportText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
});
