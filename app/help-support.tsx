import React, { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

const FAQS = [
  { q: 'What is the minimum order quantity?', a: 'Plain and Kraft pouches: 1,000 pcs. Printed pouches: 5,000 pcs. This ensures cost-effective production runs.' },
  { q: 'How long does delivery take?', a: 'Standard delivery is 12–15 business days from artwork approval. Kraft pouches ship faster at 10–12 days.' },
  { q: 'Can I see a sample before placing a bulk order?', a: 'Yes! Sample pouches are available for ₹299 (adjusted against your first bulk order). Raise a request via Design Assistance.' },
  { q: 'What file format do you need for artwork?', a: 'We accept PDF, AI (Adobe Illustrator), PSD (Photoshop), and PNG at 300 DPI or higher. Minimum 50 mm bleed area.' },
  { q: 'Is GST invoice provided?', a: 'Yes. A GST-compliant tax invoice is generated for every order. Add your GST number in Profile to get it attached.' },
  { q: 'How do I track my order?', a: 'Go to My Orders → tap any order card to see real-time status updates through the 6-stage production timeline.' },
];

const CONTACT = [
  { icon: 'phone', label: 'Call Us', sub: '+91 98765 00001', color: '#15803D' },
  { icon: 'message-circle', label: 'WhatsApp', sub: '+91 98765 00001', color: '#16A34A' },
  { icon: 'mail', label: 'Email', sub: 'support@packorder.in', color: '#7C3AED' },
];

export default function HelpSupportScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const [expanded, setExpanded] = useState<number | null>(null);

  const toggle = (i: number) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setExpanded(expanded === i ? null : i);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Help & Support</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 24 }]}>
        <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Contact Us</Text>
        <View style={styles.contactRow}>
          {CONTACT.map((c) => (
            <TouchableOpacity
              key={c.label}
              activeOpacity={0.8}
              style={[styles.contactCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}
              onPress={() => { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            >
              <View style={[styles.contactIcon, { backgroundColor: c.color + '18' }]}>
                <Feather name={c.icon as any} size={22} color={c.color} />
              </View>
              <Text style={[styles.contactLabel, { color: colors.foreground }]}>{c.label}</Text>
              <Text style={[styles.contactSub, { color: colors.mutedForeground }]}>{c.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.hoursCard, { backgroundColor: colors.secondary, borderRadius: colors.radius }]}>
          <Feather name="clock" size={16} color={colors.primary} />
          <View>
            <Text style={[styles.hoursTitle, { color: colors.foreground }]}>Support Hours</Text>
            <Text style={[styles.hoursSub, { color: colors.mutedForeground }]}>Mon – Sat: 9:00 AM – 6:30 PM IST</Text>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Frequently Asked Questions</Text>
        <View style={[styles.faqContainer, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          {FAQS.map((faq, i) => (
            <View key={i}>
              <TouchableOpacity activeOpacity={0.78} style={styles.faqHeader} onPress={() => toggle(i)}>
                <Text style={[styles.faqQ, { color: colors.foreground, flex: 1 }]}>{faq.q}</Text>
                <Feather name={expanded === i ? 'chevron-up' : 'chevron-down'} size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
              {expanded === i && (
                <View style={[styles.faqBody, { borderTopColor: colors.border }]}>
                  <Text style={[styles.faqA, { color: colors.mutedForeground }]}>{faq.a}</Text>
                </View>
              )}
              {i < FAQS.length - 1 && <View style={[styles.faqDivider, { backgroundColor: colors.border }]} />}
            </View>
          ))}
        </View>

        <View style={[styles.escalationCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <Text style={[styles.escalationTitle, { color: colors.foreground }]}>Still need help?</Text>
          <Text style={[styles.escalationDesc, { color: colors.mutedForeground }]}>
            Email us at{' '}
            <Text style={{ color: colors.primary, fontFamily: 'Inter_600SemiBold' }}>support@packorder.in</Text>
            {' '}with your order ID and we'll respond within 4 business hours.
          </Text>
          <TouchableOpacity
            activeOpacity={0.78}
            style={[styles.emailBtn, { backgroundColor: colors.secondary, borderRadius: 10 }]}
            onPress={() => { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          >
            <Feather name="mail" size={16} color={colors.primary} />
            <Text style={[styles.emailBtnText, { color: colors.primary }]}>Send Email</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1, gap: 12 },
  title: { flex: 1, fontSize: 18, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  scroll: { padding: 16, gap: 16 },
  sectionLabel: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  contactRow: { flexDirection: 'row', gap: 10 },
  contactCard: { flex: 1, padding: 14, borderWidth: 1, alignItems: 'center', gap: 8 },
  contactIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  contactLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },
  contactSub: { fontSize: 10, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  hoursCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  hoursTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  hoursSub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  faqContainer: { borderWidth: 1, overflow: 'hidden' },
  faqHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  faqQ: { fontSize: 14, fontFamily: 'Inter_500Medium', lineHeight: 20 },
  faqBody: { paddingHorizontal: 16, paddingBottom: 16, borderTopWidth: 1 },
  faqA: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 20, marginTop: 10 },
  faqDivider: { height: 1 },
  escalationCard: { padding: 16, borderWidth: 1, gap: 12 },
  escalationTitle: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  escalationDesc: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  emailBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12 },
  emailBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
});
