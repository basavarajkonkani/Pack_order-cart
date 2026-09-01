import React, { useState } from 'react';
import { Image, ImageProps, View, StyleSheet, ActivityIndicator } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface OptimizedImageProps extends ImageProps {
  showLoader?: boolean;
}

/**
 * Optimized image component with progressive loading.
 * Shows a loading indicator while the image loads, then fades in smoothly.
 */
export function OptimizedImage({ showLoader = true, style, ...props }: OptimizedImageProps) {
  const [loading, setLoading] = useState(true);
  const colors = useColors();

  return (
    <View style={style}>
      {loading && showLoader && (
        <View style={[StyleSheet.absoluteFill, styles.loaderContainer]}>
          <ActivityIndicator size="small" color={colors.mutedForeground} />
        </View>
      )}
      <Image
        {...props}
        style={style}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={() => setLoading(false)}
        fadeDuration={300}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
});
