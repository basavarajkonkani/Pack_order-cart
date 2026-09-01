import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';

const PRIVACY_POLICY_URL = 'https://shop-cart-flow.web.app/privacy-policy.html';

export default function PrivacyPolicyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const openFullPolicy = async () => {
    await WebBrowser.openBrowserAsync(PRIVACY_POLICY_URL);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Privacy Policy</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 24 }]}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <Text style={[styles.heading, { color: colors.foreground }]}>Data Collection & Usage</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>
            We collect and process your personal information (name, phone number, address, GST details) to fulfill orders and provide customer support.
          </Text>

          <Text style={[styles.heading, { color: colors.foreground }]}>Information We Collect</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>
            • Contact details (phone, email, address){'\n'}
            • Order and payment information{'\n'}
            • Device information and analytics{'\n'}
            • GST details (optional, for invoicing)
          </Text>

          <Text style={[styles.heading, { color: colors.foreground }]}>How We Use Your Data</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>
            • Process and deliver your orders{'\n'}
            • Send order status notifications{'\n'}
            • Provide customer support{'\n'}
            • Improve our services{'\n'}
            • Comply with legal obligations
          </Text>

          <Text style={[styles.heading, { color: colors.foreground }]}>Data Security</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>
            Your data is stored securely on Firebase (Google Cloud Platform) with industry-standard encryption. We do not share your personal information with third parties except as required for order fulfillment and legal compliance.
          </Text>

          <Text style={[styles.heading, { color: colors.foreground }]}>Your Rights</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>
            You can request access to, correction of, or deletion of your personal data by contacting support@packorder.in.
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.linkBtn, { backgroundColor: colors.secondary, borderRadius: 10 }]}
          onPress={openFullPolicy}
        >
          <Text style={[styles.linkBtnText, { color: colors.primary }]}>View Full Privacy Policy</Text>
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
