import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
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
import { PrimaryButton } from '@/components/PrimaryButton';
import { useAuth } from '@/context/AuthContext';
import * as Haptics from 'expo-haptics';

// Demo-only OTP — in production this would be generated & verified server-side.
const DEMO_OTP = '123456';
const RESEND_SECONDS = 30;
const OTP_LENGTH = 6;

type Step = 'phone' | 'otp';

// Removes the browser's native focus ring so our custom border is the only
// visual focus indicator (react-native-web maps this straight to CSS outline).
const noWebOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null;

export default function VerifyMobileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { updateProfile } = useAuth();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpFocused, setOtpFocused] = useState(false);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const otpInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const isPhoneValid = /^[6-9]\d{9}$/.test(phone);
  const isOtpValid = otp.length === OTP_LENGTH;

  const handlePhoneChange = (text: string) => {
    setPhone(text.replace(/[^0-9]/g, '').slice(0, 10));
    setError('');
  };

  const handleOtpChange = (text: string) => {
    setOtp(text.replace(/[^0-9]/g, '').slice(0, OTP_LENGTH));
    setError('');
  };

  const handleSendOtp = () => {
    if (!isPhoneValid) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }
    setSending(true);
    setError('');
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => {
      setSending(false);
      setStep('otp');
      setResendTimer(RESEND_SECONDS);
      setOtp('');
    }, 600);
  };

  const handleResend = () => {
    if (resendTimer > 0) return;
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setResendTimer(RESEND_SECONDS);
    setOtp('');
    setError('');
    otpInputRef.current?.focus();
  };

  const handleVerify = () => {
    if (!isOtpValid) {
      setError('Enter the 6-digit OTP');
      return;
    }
    setVerifying(true);
    setError('');
    setTimeout(async () => {
      setVerifying(false);
      if (otp !== DEMO_OTP) {
        setError('Incorrect OTP. Please try again.');
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Save the verified phone number to this device's Firebase profile
      // so it's tied to a real user id instead of just a route param.
      await updateProfile({ phone });
      router.replace({ pathname: '/checkout', params: { phone } });
    }, 500);
  };

  const handleBack = () => {
    if (step === 'otp') {
      setStep('phone');
      setOtp('');
      setError('');
    } else {
      router.back();
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity activeOpacity={0.7} onPress={handleBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>
          {step === 'phone' ? 'Verify Mobile Number' : 'Enter OTP'}
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.content}>
        {step === 'phone' ? (
          <>
            <View style={[styles.iconCircle, { backgroundColor: colors.success + '1A' }]}>
              <Feather name="smartphone" size={28} color={colors.success} />
            </View>
            <Text style={[styles.heading, { color: colors.foreground }]}>Enter Your Mobile Number</Text>
            <Text style={[styles.subheading, { color: colors.mutedForeground }]}>
              We'll send you an OTP to verify and proceed with checkout
            </Text>

            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Mobile Number *</Text>
            <View
              style={[
                styles.inputRow,
                {
                  backgroundColor: colors.card,
                  borderColor: error ? colors.destructive : phoneFocused ? colors.primary : colors.border,
                  borderWidth: phoneFocused || error ? 2 : 1,
                },
              ]}
            >
              <Feather name="phone" size={16} color={phoneFocused ? colors.primary : colors.mutedForeground} />
              <Text style={[styles.prefix, { color: colors.foreground }]}>+91</Text>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <TextInput
                style={[styles.input, { color: colors.foreground }, noWebOutline]}
                value={phone}
                onChangeText={handlePhoneChange}
                onFocus={() => setPhoneFocused(true)}
                onBlur={() => setPhoneFocused(false)}
                placeholder="9876543210"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="number-pad"
                maxLength={10}
                autoFocus
              />
              {isPhoneValid && (
                <Feather name="check-circle" size={18} color={colors.success} />
              )}
            </View>

            {error ? (
              <View style={styles.errorRow}>
                <Feather name="alert-circle" size={13} color={colors.destructive} />
                <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
              </View>
            ) : (
              <View style={[styles.infoBox, { backgroundColor: colors.secondary, borderRadius: 10 }]}>
                <Feather name="info" size={14} color={colors.primary} />
                <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                  Enter your 10-digit mobile number without country code
                </Text>
              </View>
            )}

            <View style={styles.spacer} />

            <PrimaryButton
              label={sending ? 'Sending OTP...' : 'Send OTP'}
              onPress={handleSendOtp}
              loading={sending}
              disabled={!isPhoneValid}
              variant="success"
            />

            <View style={[styles.secureBox, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: 10 }]}>
              <Feather name="shield" size={14} color={colors.mutedForeground} />
              <Text style={[styles.secureText, { color: colors.mutedForeground }]}>
                Your mobile number is secure and will only be used for order verification
              </Text>
            </View>
          </>
        ) : (
          <>
            <View style={[styles.iconCircle, { backgroundColor: colors.success + '1A' }]}>
              <Feather name="message-circle" size={28} color={colors.success} />
            </View>
            <Text style={[styles.heading, { color: colors.foreground }]}>Enter Verification Code</Text>
            <Text style={[styles.subheading, { color: colors.mutedForeground }]}>
              We've sent a 6-digit OTP to +91 {phone}
            </Text>

            {/* Segmented OTP boxes — tapping any box focuses the hidden input */}
            <TouchableOpacity
              activeOpacity={1}
              style={styles.otpRow}
              onPress={() => otpInputRef.current?.focus()}
            >
              {Array.from({ length: OTP_LENGTH }).map((_, i) => {
                const digit = otp[i];
                const isActiveBox = otpFocused && i === otp.length;
                const filled = !!digit;
                return (
                  <View
                    key={i}
                    style={[
                      styles.otpBox,
                      {
                        backgroundColor: colors.card,
                        borderColor: error
                          ? colors.destructive
                          : isActiveBox
                          ? colors.primary
                          : filled
                          ? colors.success
                          : colors.border,
                        borderWidth: isActiveBox ? 2 : 1.5,
                      },
                    ]}
                  >
                    <Text style={[styles.otpDigit, { color: colors.foreground }]}>{digit ?? ''}</Text>
                  </View>
                );
              })}
              <TextInput
                ref={otpInputRef}
                style={styles.hiddenOtpInput}
                value={otp}
                onChangeText={handleOtpChange}
                onFocus={() => setOtpFocused(true)}
                onBlur={() => setOtpFocused(false)}
                keyboardType="number-pad"
                maxLength={OTP_LENGTH}
                autoFocus
                caretHidden
              />
            </TouchableOpacity>

            {error ? (
              <View style={styles.errorRow}>
                <Feather name="alert-circle" size={13} color={colors.destructive} />
                <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
              </View>
            ) : (
              <View style={[styles.infoBox, { backgroundColor: colors.secondary, borderRadius: 10 }]}>
                <Feather name="info" size={14} color={colors.primary} />
                <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                  Demo OTP: {DEMO_OTP}
                </Text>
              </View>
            )}

            <View style={styles.resendRow}>
              <Text style={[styles.resendLabel, { color: colors.mutedForeground }]}>Didn't receive the code?</Text>
              <TouchableOpacity activeOpacity={0.7} onPress={handleResend} disabled={resendTimer > 0}>
                <Text style={[styles.resendAction, { color: resendTimer > 0 ? colors.mutedForeground : colors.primary }]}>
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.spacer} />

            <PrimaryButton
              label={verifying ? 'Verifying...' : 'Verify & Continue'}
              onPress={handleVerify}
              loading={verifying}
              disabled={!isOtpValid}
              variant="success"
            />

            <TouchableOpacity activeOpacity={0.7} style={styles.changeNumberBtn} onPress={handleBack}>
              <Feather name="edit-2" size={13} color={colors.primary} />
              <Text style={[styles.changeNumberText, { color: colors.primary }]}>Change Mobile Number</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={{ paddingBottom: bottomPad }} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1,
  },
  title: { flex: 1, fontSize: 17, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  content: { padding: 24, alignItems: 'center', gap: 8 },
  iconCircle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  heading: { fontSize: 19, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  subheading: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 19, marginBottom: 12 },
  fieldLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold', alignSelf: 'flex-start', marginTop: 8, marginBottom: 8, width: '100%' },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%',
    borderRadius: 12, paddingHorizontal: 14, height: 54,
  },
  prefix: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  divider: { width: 1, height: 22 },
  input: { flex: 1, fontSize: 16, fontFamily: 'Inter_600SemiBold', height: '100%', letterSpacing: 0.5 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginTop: 8 },
  errorText: { fontSize: 12.5, fontFamily: 'Inter_500Medium' },
  infoBox: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, width: '100%', marginTop: 10 },
  infoText: { flex: 1, fontSize: 12.5, fontFamily: 'Inter_500Medium' },
  spacer: { height: 16 },
  secureBox: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, width: '100%', borderWidth: 1, marginTop: 16 },
  secureText: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 17 },
  otpRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, width: '100%', marginTop: 4, position: 'relative' },
  otpBox: {
    width: 46, height: 54, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  otpDigit: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  hiddenOtpInput: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    opacity: 0,
  },
  resendRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 },
  resendLabel: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  resendAction: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  changeNumberBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16 },
  changeNumberText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
});
