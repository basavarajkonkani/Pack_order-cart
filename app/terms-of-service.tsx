import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';

const TERMS_URL = 'https://shop-cart-flow.web.app/terms-of-service.html';

export default function TermsOfServiceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const openFullTerms = async () => {
    await WebBrowser.openBrowserAsync(TERMS_URL);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Terms of Service</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 24 }]}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <Text style={[styles.heading, { color: colors.foreground }]}>Acceptance of Terms</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>
            By accessing and using PackOrder, you accept and agree to be bound by these Terms of Service. If you do not agree, please discontinue use of the app.
          </Text>

          <Text style={[styles.heading, { color: colors.foreground }]}>Order Placement</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>
            • Minimum order quantities apply: Plain/Kraft pouches (1,000 pcs), Printed pouches (5,000 pcs){'\n'}
            • Orders are confirmed after artwork approval{'\n'}
            • Payment terms vary by customer type{'\n'}
            • All prices are exclusive of GST
          </Text>

          <Text style={[styles.heading, { color: colors.foreground }]}>Cancellation & Returns</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>
            • Orders can be cancelled within 24 hours of placement{'\n'}
            • Custom printed orders cannot be cancelled after artwork approval{'\n'}
            • Defective products can be returned within 7 days of delivery{'\n'}
            • Refunds are processed within 10-14 business days
          </Text>

          <Text style={[styles.heading, { color: colors.foreground }]}>Intellectual Property</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>
            You retain ownership of artwork and designs submitted. By placing an order, you grant us permission to manufacture products using your designs. You confirm that your designs do not infringe on third-party intellectual property rights.
          </Text>

          <Text style={[styles.heading, { color: colors.foreground }]}>Limitation of Liability</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>
            We are not liable for delays caused by factors beyond our control (natural disasters, supplier issues, etc.). Our maximum liability is limited to the order value.
          </Text>

          <Text style={[styles.heading, { color: colors.foreground }]}>Dispute Resolution</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>
            Any disputes shall be resolved through arbitration in Bangalore, India, in accordance with Indian law.
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.linkBtn, { backgroundColor: colors.secondary, borderRadius: 10 }]}
          onPress={openFullTerms}
        >
          <Text style={[styles.linkBtnText, { color: colors.primary }]}>View Full Terms of Service</Text>
          <Feather name="external-link" size={16} color={colors.primary} />
        </TouchableOpacity>

        <Text style={[styles.footer, { color: colors.mutedForeground }]}>
          Last updated: August 2026
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1, gap: 12 },
  title: { flex: 1, fontSize: 18, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  scroll: { padding: 16 },
  card: { padding: 16, borderWidth: 1, gap: 16 },
  heading: { fontSize: 15, fontFamily: 'Inter_700Bold', marginTop: 8 },
  body: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  linkBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, marginTop: 8 },
  linkBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  footer: { fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center', marginTop: 16 },
});
