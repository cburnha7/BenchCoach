import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../lib/theme';

/**
 * The app backdrop: a real stadium photograph.
 *
 * To swap the image, replace assets/images/stadium.png. Ship it at least
 * 1290px wide so it stays sharp on large phones at 3x.
 *
 * The gradients on top are not decoration — a photograph has bright regions
 * wherever it happens to have them, and white text over an unmodified photo is
 * legible only by luck. These force a predictable dark field at the top and
 * bottom where the navigation and buttons live, while leaving the middle of
 * the image visible.
 */

type Props = {
  /** 0..1 — how strongly the photo reads. Lower it behind dense UI. */
  intensity?: number;
};

function StadiumBackdropBase({ intensity = 1 }: Props) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Image
        source={require('../../assets/images/stadium.png')}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        // Fills the frame from the centre, so the stand stays in view when the
        // aspect ratio doesn't match the device.
        contentPosition="center"
        transition={300}
      />

      {/* Overall knock-back, tinted toward the app's base so the photo sits
          inside the palette rather than fighting it. */}
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: theme.bg, opacity: 0.34 + (1 - intensity) * 0.4 },
        ]}
      />

      {/* Top scrim: protects the status bar and nav row. */}
      <LinearGradient
        colors={['rgba(7,11,20,0.92)', 'rgba(7,11,20,0.35)', 'rgba(7,11,20,0)']}
        locations={[0, 0.45, 1]}
        style={styles.top}
      />

      {/* Bottom scrim: protects the primary action button. */}
      <LinearGradient
        colors={['rgba(7,11,20,0)', 'rgba(7,11,20,0.72)', 'rgba(7,11,20,0.96)']}
        locations={[0, 0.55, 1]}
        style={styles.bottom}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  top: { position: 'absolute', top: 0, left: 0, right: 0, height: '34%' },
  bottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '46%' },
});

export const StadiumBackdrop = React.memo(StadiumBackdropBase);
