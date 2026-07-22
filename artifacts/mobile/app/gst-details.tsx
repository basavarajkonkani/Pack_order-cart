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

const GST_BENEFITS = [
  { icon: 'percent', text: 'Claim 18% input tax credit on packaging materials' },
  { icon: 'file-text', text: 'Auto-generated GST invoices for every order' },
  { icon: 'download', text: 'Download GSTR-2B compliant purchase reports' },
  { icon: 'shield', text: 'Verified supplier — eligible for ITC claims' },
];

export default function GstDetailsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const [gstNumber, setGstNumber] = useState('29ABCDE01234F1Z5');
  const [companyName, setCompanyName] = useState('My Business Pvt Ltd');
  const [address, setAddress] = useState('No. 12, 3rd Cross, Peenya Industrial Area, Bangalore – 560058');
  const [saved, setSaved] = useState(true);
  const [editing, setEditing] = useState(false);

  const handleSave = () => {
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaved(true);
    setEditing(false);
  };

  return (
    <KeyboardAvoidingView style={[styles.root, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { backgroundColor: colors.card, paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>GST Details</Text>
        <TouchableOpacity activeOpacity={0.75} onPress={() => editing ? handleSave() : setEditing(true)} style={styles.editTopBtn}>
          <Text style={[styles.editTopText, { color: colors.primary }]}>{editing ? 'Save' : 'Edit'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 24 }]}>
        <View style={[styles.benefitsCard, { backgroundColor: colors.primary + '0D', borderColor: colors.primary + '30', borderRadius: colors.radius }]}>
          <Text style={[styles.benefitsTitle, { color: colors.primary }]}>GST Benefits</Text>
          {GST_BENEFITS.map((b) => (
            <View key={b.text} style={styles.benefitRow}>
              <View style={[styles.benefitIcon, { backgroundColor: colors.primary + '15' }]}>
                <Feather name={b.icon as any} size={14} color={colors.primary} />
              </View>
              <Text style={[styles.benefitText, { color: colors.foreground }]}>{b.text}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <Text style={[styles.formTitle, { color: colors.foreground }]}>Registered Details</Text>
          {[
            { label: 'GST Number', value: gstNumber, setter: setGstNumber, placeholder: '29ABCDE01234F1Z5', caps: true as const },
            { label: 'Company Name', value: companyName, setter: setCompanyName, placeholder: 'Your Business Pvt Ltd', caps: false as const },
            { label: 'Registered Address', value: address, setter: setAddress, placeholder: 'Full registered address', caps: false as const },
          ].map((field) => (
            <View key={field.label} style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{field.label}</Text>
              {editing ? (
                <TextInput
                  style={[styles.fieldInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                  value={field.value}
                  onChangeText={field.setter}
                  placeholder={field.placeholder}
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize={field.caps ? 'characters' : 'words'}
                />
              ) : (
                <Text style={[styles.fieldValue, { color: colors.foreground }]}>{field.value || '–'}</Text>
              )}
            </View>
          ))}
          {saved && !editing && (
            <View style={[styles.verifiedBadge, { backgroundColor: '#16A34A20', borderRadius: 8 }]}>
              <Feather name="check-circle" size={16} color="#16A34A" />
              <Text style={[styles.verifiedText, { color: '#16A34A' }]}>GST details saved</Text>
            </View>
          )}
        </View>

        <View style={[styles.noteCard, { backgroundColor: colors.secondary, borderRadius: colors.radius }]}>
          <Feather name="info" size={14} color={colors.mutedForeground} />
          <Text style={[styles.noteText, { color: colors.mutedForeground }]}>
            Your GST details are used to generate tax invoices for all orders. These details must match your GST registration certificate.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1, gap: 12 },
  title: { flex: 1, fontSize: 18, fontFamily: 'Inter_700Bold' },
  editTopBtn: { paddingHorizontal: 4 },
  editTopText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  scroll: { padding: 16, gap: 14 },
  benefitsCard: { padding: 16, borderWidth: 1, gap: 12 },
  benefitsTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  benefitIcon: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  benefitText: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 19 },
  formCard: { padding: 16, borderWidth: 1, gap: 16 },
  formTitle: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  fieldGroup: { gap: 6 },
  fieldLabel: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  fieldInput: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14, fontFamily: 'Inter_400Regular' },
  fieldValue: { fontSize: 15, fontFamily: 'Inter_500Medium', lineHeight: 22 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12 },
  verifiedText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  noteCard: { flexDirection: 'row', gap: 10, padding: 14, alignItems: 'flex-start' },
  noteText: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 19 },
});
