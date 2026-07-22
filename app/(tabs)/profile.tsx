import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
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
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import * as Haptics from 'expo-haptics';

const MENU = [
  { icon: 'clipboard', label: 'My Orders', route: '/(tabs)/orders' as const },
  { icon: 'shopping-cart', label: 'My Cart', route: '/(tabs)/cart' as const },
  { icon: 'heart', label: 'My Wishlist', route: '/wishlist' as const },
  { icon: 'map-pin', label: 'Saved Addresses', route: '/saved-addresses' as const },
  { icon: 'file-text', label: 'GST Details', route: '/gst-details' as const },
  { icon: 'headphones', label: 'Need Design Assistance?', route: '/design-assistance' as const },
  { icon: 'help-circle', label: 'Help & Support', route: '/help-support' as const },
];

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { orders } = useCart();
  const { profile, updateProfile } = useAuth();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  // Profile fields — sourced from Firestore via AuthContext, with sensible defaults.
  const name = profile?.name || 'Customer Name';
  const email = profile?.email || 'customer@business.com';
  const phone = profile?.phone || '+91 98765 43210';
  const company = profile?.company || '';
  const gstNumber = profile?.gstNumber || '';

  // Modal state
  const [editModal, setEditModal] = useState(false);
  const [gstModal, setGstModal] = useState(false);

  // Draft state for edit
  const [draftName, setDraftName] = useState(name);
  const [draftEmail, setDraftEmail] = useState(email);
  const [draftPhone, setDraftPhone] = useState(phone);
  const [draftCompany, setDraftCompany] = useState(company);
  const [draftGst, setDraftGst] = useState(gstNumber);

  const openEdit = () => {
    setDraftName(name);
    setDraftEmail(email);
    setDraftPhone(phone);
    setDraftCompany(company);
    setEditModal(true);
  };

  const saveProfile = async () => {
    await updateProfile({ name: draftName, email: draftEmail, phone: draftPhone, company: draftCompany });
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setEditModal(false);
  };

  const saveGst = async () => {
    await updateProfile({ gstNumber: draftGst });
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setGstModal(false);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.headerBg, { backgroundColor: colors.primary, paddingTop: topPad + 12 }]}>
        <View style={styles.avatarRow}>
          <View style={[styles.avatar, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Feather name="user" size={32} color="#fff" />
          </View>
          <View style={styles.avatarInfo}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.emailText}>{email}</Text>
            {company ? <Text style={styles.company}>{company}</Text> : null}
          </View>
          <TouchableOpacity activeOpacity={0.7} style={styles.editBtn} onPress={openEdit}>
            <Feather name="edit-2" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{orders.length}</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: 'rgba(255,255,255,0.3)' }]} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>
              ₹{orders.reduce((s, o) => s + o.total, 0).toLocaleString('en-IN')}
            </Text>
            <Text style={styles.statLabel}>Total Spent</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: 'rgba(255,255,255,0.3)' }]} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>
              {orders.filter((o) => o.status === 'delivered').length}
            </Text>
            <Text style={styles.statLabel}>Delivered</Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: Platform.OS === 'web' ? 100 : 90 + insets.bottom },
        ]}
      >
        {/* GST Info Card */}
        <View style={[styles.gstCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <Feather name="info" size={16} color={colors.primary} />
          <View style={styles.gstInfo}>
            <Text style={[styles.gstTitle, { color: colors.foreground }]}>
              {gstNumber ? `GST: ${gstNumber}` : 'GST Benefits Available'}
            </Text>
            <Text style={[styles.gstSub, { color: colors.mutedForeground }]}>
              {gstNumber ? 'Registered for business orders' : 'Save 18% GST on your business orders'}
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.addGstBtn, { backgroundColor: colors.secondary, borderRadius: 8 }]}
            onPress={() => { setDraftGst(gstNumber); setGstModal(true); }}
          >
            <Text style={[styles.addGstText, { color: colors.primary }]}>
              {gstNumber ? 'Edit' : 'Add GST'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Menu */}
        <View style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          {MENU.map((item, i) => (
            <React.Fragment key={item.label}>
              <TouchableOpacity activeOpacity={0.75} style={styles.menuItem} onPress={() => router.push(item.route)}>
                <View style={[styles.menuIcon, { backgroundColor: colors.secondary }]}>
                  <Feather name={item.icon as any} size={18} color={colors.primary} />
                </View>
                <Text style={[styles.menuLabel, { color: colors.foreground }]}>{item.label}</Text>
                <Feather name="chevron-right" size={18} color={colors.mutedForeground} style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>
              {i < MENU.length - 1 && (
                <View style={[styles.menuDivider, { backgroundColor: colors.border, marginLeft: 58 }]} />
              )}
            </React.Fragment>
          ))}
        </View>

        {/* Quick Order */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.quickOrder, { backgroundColor: colors.primary, borderRadius: colors.radius }]}
          onPress={() => router.push('/configure/pouch-type')}
        >
          <Feather name="plus-circle" size={22} color="#fff" />
          <Text style={styles.quickOrderText}>Start a New Order</Text>
          <Feather name="arrow-right" size={18} color="rgba(255,255,255,0.7)" style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={editModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setEditModal(false)}>
        <KeyboardAvoidingView
          style={[styles.modalRoot, { backgroundColor: colors.background }]}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.modalHeader, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
            <Pressable onPress={() => setEditModal(false)} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
              <Text style={[styles.modalCancel, { color: colors.mutedForeground }]}>Cancel</Text>
            </Pressable>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Edit Profile</Text>
            <Pressable onPress={saveProfile} style={({ pressed }) => [pressed && { opacity: 0.7 }]}>
              <Text style={[styles.modalSave, { color: colors.primary }]}>Save</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            {[
              { label: 'Full Name', value: draftName, setter: setDraftName, placeholder: 'Enter your name' },
              { label: 'Email Address', value: draftEmail, setter: setDraftEmail, placeholder: 'your@email.com' },
              { label: 'Phone Number', value: draftPhone, setter: setDraftPhone, placeholder: '+91 XXXXX XXXXX' },
              { label: 'Company Name', value: draftCompany, setter: setDraftCompany, placeholder: 'Your Business Pvt Ltd' },
            ].map((field) => (
              <View key={field.label} style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{field.label}</Text>
                <TextInput
                  style={[styles.fieldInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
                  value={field.value}
                  onChangeText={field.setter}
                  placeholder={field.placeholder}
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>
            ))}
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* GST Modal */}
      <Modal visible={gstModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setGstModal(false)}>
        <KeyboardAvoidingView
          style={[styles.modalRoot, { backgroundColor: colors.background }]}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.modalHeader, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
            <Pressable onPress={() => setGstModal(false)} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
              <Text style={[styles.modalCancel, { color: colors.mutedForeground }]}>Cancel</Text>
            </Pressable>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>GST Details</Text>
            <Pressable onPress={saveGst} style={({ pressed }) => [pressed && { opacity: 0.7 }]}>
              <Text style={[styles.modalSave, { color: colors.primary }]}>Save</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={[styles.gstInfoBox, { backgroundColor: colors.secondary, borderRadius: colors.radius }]}>
              <Feather name="info" size={16} color={colors.primary} />
              <Text style={[styles.gstInfoBoxText, { color: colors.mutedForeground }]}>
                Adding your GST number enables you to claim input tax credit on packaging material purchases.
              </Text>
            </View>
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>GST Number</Text>
              <TextInput
                style={[styles.fieldInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
                value={draftGst}
                onChangeText={setDraftGst}
                placeholder="e.g. 29ABCDE01234F1Z5"
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="characters"
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerBg: { paddingHorizontal: 20, paddingBottom: 20, gap: 16 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  avatarInfo: { flex: 1, gap: 2 },
  name: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#fff' },
  emailText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.75)' },
  company: { fontSize: 12, fontFamily: 'Inter_500Medium', color: 'rgba(255,255,255,0.6)' },
  editBtn: { padding: 8, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.15)' },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statNum: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#fff' },
  statLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.7)' },
  statDivider: { width: 1, height: 32 },
  scroll: { padding: 16, gap: 14 },
  gstCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderWidth: 1, gap: 10 },
  gstInfo: { flex: 1, gap: 2 },
  gstTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  gstSub: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  addGstBtn: { paddingHorizontal: 12, paddingVertical: 7 },
  addGstText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  menuCard: { borderWidth: 1, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  menuIcon: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  menuDivider: { height: 1 },
  quickOrder: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  quickOrderText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  // Modal
  modalRoot: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  modalCancel: { fontSize: 16, fontFamily: 'Inter_400Regular' },
  modalSave: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  modalScroll: { padding: 20, gap: 20 },
  fieldGroup: { gap: 6 },
  fieldLabel: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  fieldInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  gstInfoBox: { flexDirection: 'row', gap: 10, padding: 14, alignItems: 'flex-start' },
  gstInfoBoxText: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 20 },
});
