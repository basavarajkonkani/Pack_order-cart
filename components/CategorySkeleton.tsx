import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useColors } from '@/hooks/useColors';

/**
 * Skeleton loader for category cards.
 * Shows an animated placeholder while categories are loading.
 */
export function CategorySkeleton() {
  const colors = useColors();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <View
      style={[
        styles.skeleton,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: colors.radius,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.skeletonImage,
          { backgroundColor: colors.secondary, opacity },
        ]}
      />
      <Animated.View
        style={[
          styles.skeletonText,
          { backgroundColor: colors.secondary, opacity },
        ]}
      />
      <Animated.View
        style={[
          styles.skeletonSubtext,
          { backgroundColor: colors.secondary, opacity },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    width: 100,
    alignItems: 'center',
    padding: 14,
    borderWidth: 1,
    gap: 6,
  },
  skeletonImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  skeletonText: {
    width: 60,
    height: 12,
    borderRadius: 6,
  },
  skeletonSubtext: {
    width: 80,
    height: 10,
    borderRadius: 5,
  },
});
