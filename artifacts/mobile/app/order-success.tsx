import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

export default function OrderSuccessScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { orderId, orderKey } = useLocalSearchParams<{ orderId: string; orderKey: string }>();
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 7 }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start();
  }, []);

  const INFO = [
    { icon: 'mail', text: 'Confirmation email sent' },
    { icon: 'message-circle', text: 'WhatsApp notification sent' },
    { icon: 'clock', text: 'Expected delivery: 12–15 days' },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: topPad, paddingBottom: bottomPad + 24 }]}>
      <View style={styles.content}>
        <Animated.View style={[styles.iconCircle, { backgroundColor: colors.success + '20', transform: [{ scale: scaleAnim }] }]}>
          <View style={[styles.iconInner, { backgroundColor: colors.success }]}>
            <Feather name="check" size={48} color="#fff" />
          </View>
        </Animated.View>

        <Animated.View style={[styles.textBlock, { opacity: fadeAnim }]}>
          <Text style={[styles.successTitle, { color: colors.foreground }]}>Order Placed Successfully!</Text>
          {orderId ? <Text style={[styles.orderIdText, { color: colors.primary }]}>Order ID: {orderId}</Text> : null}
          <Text style={[styles.desc, { color: colors.mutedForeground }]}>
            We will send the order details to your email & WhatsApp.
          </Text>
        </Animated.View>

        <Animated.View style={[styles.cards, { opacity: fadeAnim }]}>
          {INFO.map((item) => (
            <View key={item.text} style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: 10 }]}>
              <Feather name={item.icon as any} size={16} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.foreground }]}>{item.text}</Text>
            </View>
          ))}
        </Animated.View>
      </View>

      <Animated.View style={[styles.buttons, { opacity: fadeAnim }]}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.primaryBtn, { backgroundColor: colors.primary, borderRadius: colors.radius }]}
          onPress={() => router.replace({ pathname: '/order-tracking', params: { orderId, orderKey } })}
        >
          <Feather name="list" size={18} color="#fff" />
          <Text style={styles.primaryBtnText}>View My Orders</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.75}
          style={[styles.secondaryBtn, { borderColor: colors.border, borderRadius: colors.radius }]}
          onPress={() => router.replace('/(tabs)/index')}
        >
          <Text style={[styles.secondaryBtnText, { color: colors.primary }]}>Continue Shopping</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'space-between' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 28 },
  iconCircle: { width: 160, height: 160, borderRadius: 80, alignItems: 'center', justifyContent: 'center' },
  iconInner: { width: 110, height: 110, borderRadius: 55, alignItems: 'center', justifyContent: 'center' },
  textBlock: { alignItems: 'center', gap: 8 },
  successTitle: { fontSize: 24, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  orderIdText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  desc: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 21 },
  cards: { width: '100%', gap: 10 },
  infoCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderWidth: 1 },
  infoText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  buttons: { paddingHorizontal: 24, gap: 12 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 52 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  secondaryBtn: { height: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  secondaryBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
});
