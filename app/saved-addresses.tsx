import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
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
import { useAuth, Address } from '@/context/AuthContext';

export default function SavedAddressesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const { profile, addAddress, updateAddress, deleteAddress: removeAddress, setDefaultAddress } = useAuth();
  const addresses = profile?.addresses ?? [];

  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [draftLabel, setDraftLabel] = useState('');
  const [draftLine1, setDraftLine1] = useState('');
  const [draftCity, setDraftCity] = useState('');
  const [draftState, setDraftState] = useState('');
  const [draftPin, setDraftPin] = useState('');

  const openAdd = () => {
    setEditing(null);
    setDraftLabel(''); setDraftLine1(''); setDraftCity(''); setDraftState(''); setDraftPin('');
    setModal(true);
  };

  const openEdit = (addr: Address) => {
    setEditing(addr);
    setDraftLabel(addr.label); setDraftLine1(addr.line1); setDraftCity(addr.city); setDraftState(addr.state); setDraftPin(addr.pincode);
    setModal(true);
  };

  const saveAddress = async () => {
    const draft = { label: draftLabel || 'Address', line1: draftLine1, city: draftCity, state: draftState, pincode: draftPin };
    if (editing) {
      await updateAddress(editing.id, draft);
    } else {
      await addAddress(draft);
    }
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setModal(false);
  };

  const handleDelete = (id: string) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    removeAddress(id);
  };

  const setDefault = (id: string) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setDefaultAddress(id);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Saved Addresses</Text>
        <TouchableOpacity activeOpacity={0.75} onPress={openAdd} style={[styles.addBtn, { backgroundColor: colors.secondary, borderRadius: 8 }]}>
          <Feather name="plus" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 24 }]}>
        {addresses.length === 0 && (
          <View style={styles.empty}>
            <Feather name="map-pin" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No saved addresses</Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>Tap + to add a delivery address</Text>
          </View>
        )}
        {addresses.map((addr) => (
          <View key={addr.id} style={[styles.card, { backgroundColor: colors.card, borderColor: addr.isDefault ? colors.primary : colors.border, borderRadius: colors.radius }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.labelBadge, { backgroundColor: colors.secondary }]}>
                <Feather name="map-pin" size={13} color={colors.primary} />
                <Text style={[styles.labelText, { color: colors.primary }]}>{addr.label}</Text>
              </View>
              {addr.isDefault && (
                <View style={[styles.defaultBadge, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[styles.defaultText, { color: colors.primary }]}>Default</Text>
                </View>
              )}
              <View style={{ flex: 1 }} />
              <TouchableOpacity activeOpacity={0.7} onPress={() => openEdit(addr)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Feather name="edit-2" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.7} onPress={() => handleDelete(addr.id)} style={{ marginLeft: 14 }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Feather name="trash-2" size={16} color={colors.destructive} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.addrLine, { color: colors.foreground }]}>{addr.line1}</Text>
            <Text style={[styles.addrLine, { color: colors.mutedForeground }]}>{addr.city}, {addr.state} – {addr.pincode}</Text>
            {!addr.isDefault && (
              <TouchableOpacity activeOpacity={0.78} style={[styles.setDefaultBtn, { borderColor: colors.border, borderRadius: 8 }]} onPress={() => setDefault(addr.id)}>
                <Text style={[styles.setDefaultText, { color: colors.primary }]}>Set as Default</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>

      <Modal visible={modal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModal(false)}>
        <KeyboardAvoidingView style={[styles.modalRoot, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
            <TouchableOpacity activeOpacity={0.7} onPress={() => setModal(false)}>
              <Text style={[styles.modalCancel, { color: colors.mutedForeground }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>{editing ? 'Edit Address' : 'Add Address'}</Text>
            <TouchableOpacity activeOpacity={0.75} onPress={saveAddress}>
              <Text style={[styles.modalSave, { color: colors.primary }]}>Save</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
            {[
              { label: 'Label (Office / Warehouse)', value: draftLabel, setter: setDraftLabel, placeholder: 'Office' },
              { label: 'Address Line', value: draftLine1, setter: setDraftLine1, placeholder: 'Street, Area, Landmark' },
              { label: 'City', value: draftCity, setter: setDraftCity, placeholder: 'Bangalore' },
              { label: 'State', value: draftState, setter: setDraftState, placeholder: 'Karnataka' },
              { label: 'Pincode', value: draftPin, setter: setDraftPin, placeholder: '560001' },
            ].map((f) => (
              <View key={f.label} style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{f.label}</Text>
                <TextInput style={[styles.fieldInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]} value={f.value} onChangeText={f.setter} placeholder={f.placeholder} placeholderTextColor={colors.mutedForeground} />
              </View>
            ))}
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1, gap: 12 },
  title: { flex: 1, fontSize: 18, fontFamily: 'Inter_700Bold' },
  addBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 16, gap: 14 },
  empty: { alignItems: 'center', paddingVertical: 80, gap: 12 },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  emptyDesc: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  card: { padding: 16, borderWidth: 1.5, gap: 8 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  labelBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  labelText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  defaultBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  defaultText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  addrLine: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  setDefaultBtn: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1 },
  setDefaultText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  modalRoot: { flex: 1 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1 },
  modalTitle: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  modalCancel: { fontSize: 16, fontFamily: 'Inter_400Regular' },
  modalSave: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  modalScroll: { padding: 20, gap: 20 },
  fieldGroup: { gap: 6 },
  fieldLabel: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  fieldInput: { borderWidth: 1, borderRadius: 10, padding: 14, fontSize: 15, fontFamily: 'Inter_400Regular' },
});
