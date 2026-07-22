import React from 'react';
import { Stack } from 'expo-router';
import { useColors } from '@/hooks/useColors';

export default function ConfigureLayout() {
  const colors = useColors();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.primary,
        headerTitleStyle: { fontFamily: 'Inter_600SemiBold', color: colors.foreground },
        headerShadowVisible: false,
        headerBackTitle: 'Back',
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="pouch-type" options={{ title: 'Select Pouch Type' }} />
      <Stack.Screen name="window-option" options={{ title: 'Window Option' }} />
      <Stack.Screen name="material-type" options={{ title: 'Material Type' }} />
      <Stack.Screen name="capacity" options={{ title: 'Select Capacity' }} />
      <Stack.Screen name="quantity" options={{ title: 'Quantity & Customisation' }} />
      <Stack.Screen name="price-summary" options={{ title: 'Price Summary' }} />
    </Stack>
  );
}
