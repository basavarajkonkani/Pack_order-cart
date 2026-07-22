import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

const SERVICES = [
  { icon: 'pen-tool', label: 'Logo Design', desc: 'Professional logo for your brand' },
  { icon: 'layers', label: 'Pouch Label Design', desc: 'Print-ready artwork for your pouches' },
  { icon: 'image', label: 'Brand Style Guide', desc: 'Consistent colors, fonts, and assets' },
  { icon: 'refresh-cw', label: 'Artwork Revision', desc: 'Tweaks to your existing artwork' },
];

export default function DesignAssistanceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!selectedService) return;
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.card, paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
          <TouchableOpacity activeOpacity={0.7} onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.foreground }]}>Design Assistance</Text>
          <View style={{ width: 22 }} />
        </View>
        <View style={styles.successContainer}>
          <View style={[styles.successIcon, { backgroundColor: '#16A34A20' }]}>
            <Feather name="check-circle" size={52} color="#16A34A" />
          </View>
          <Text style={[styles.successTitle, { color: colors.foreground }]}>Request Submitted!</Text>
          <Text style={[styles.successDesc, { color: colors.mutedForeground }]}>
            Our design team will reach out within 24 hours to discuss your requirements.
          </Text>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.backHomeBtn, { backgroundColor: colors.primary, borderRadius: colors.radius }]}
            onPress={() => router.replace('/(tabs)')}
          >
            <Text style={styles.backHomeBtnText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={[styles.root, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { backgroundColor: colors.card, paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Design Assistance</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 24 }]} keyboardShouldPersistTaps="handled">
        <View style={[styles.heroBanner, { backgroundColor: colors.primary + '0D', borderRadius: colors.radius, borderColor: colors.primary + '20', borderWidth: 1 }]}>
          <Feather name="feather" size={32} color={colors.primary} />
          <Text style={[styles.heroTitle, { color: colors.primary }]}>Professional Design Help</Text>
          <Text style={[styles.heroDesc, { color: colors.mutedForeground }]}>
            Our in-house design team creates print-ready artwork for your pouches. Starting at ₹999.
          </Text>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Select a Service</Text>
        {SERVICES.map((svc) => {
          const active = selectedService === svc.label;
          return (
            <TouchableOpacity
              key={svc.label}
              activeOpacity={0.82}
              style={[
                styles.serviceCard,
                {
                  backgroundColor: active ? colors.primary + '0D' : colors.card,
                  borderColor: active ? colors.primary : colors.border,
                  borderRadius: colors.radius,
                },
              ]}
              onPress={() => { setSelectedService(svc.label); if (Platform.OS !== 'web') Haptics.selectionAsync(); }}
            >
              <View style={[styles.svcIcon, { backgroundColor: active ? colors.primary : colors.secondary }]}>
                <Feather name={svc.icon as any} size={20} color={active ? '#fff' : colors.primary} />
              </View>
              <View style={styles.svcText}>
                <Text style={[styles.svcLabel, { color: colors.foreground }]}>{svc.label}</Text>
                <Text style={[styles.svcDesc, { color: colors.mutedForeground }]}>{svc.desc}</Text>
              </View>
              <View style={[styles.radio, { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primary : 'transparent' }]}>
                {active && <Feather name="check" size={11} color="#fff" />}
              </View>
            </TouchableOpacity>
          );
        })}

        <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Tell Us More (optional)</Text>
        <TextInput
          style={[styles.messageInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
          value={message}
          onChangeText={setMessage}
          placeholder="Describe your brand, colors, style preferences..."
          placeholderTextColor={colors.mutedForeground}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <TouchableOpacity
          activeOpacity={selectedService ? 0.85 : 1}
          style={[styles.submitBtn, { backgroundColor: selectedService ? colors.primary : colors.border, borderRadius: colors.radius }]}
          onPress={handleSubmit}
          disabled={!selectedService}
        >
          <Feather name="send" size={18} color="#fff" />
          <Text style={styles.submitText}>Request Design Help</Text>
        </TouchableOpacity>

        <Text style={[styles.footNote, { color: colors.mutedForeground }]}>
          Our team typically responds within 24 business hours via WhatsApp or email.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1, gap: 12 },
  title: { flex: 1, fontSize: 18, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  scroll: { padding: 16, gap: 16 },
  heroBanner: { padding: 20, alignItems: 'center', gap: 8 },
  heroTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  heroDesc: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20 },
  sectionLabel: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  serviceCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderWidth: 1.5 },
  svcIcon: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  svcText: { flex: 1 },
  svcLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  svcDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  messageInput: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 14, fontFamily: 'Inter_400Regular', minHeight: 100 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 52 },
  submitText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  footNote: { fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 18 },
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  successIcon: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center' },
  successTitle: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  successDesc: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 21 },
  backHomeBtn: { marginTop: 8, paddingHorizontal: 28, paddingVertical: 14 },
  backHomeBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_600SemiBold' },
});
