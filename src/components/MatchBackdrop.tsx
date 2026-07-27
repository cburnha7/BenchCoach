import React from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import {
  Canvas,
  LinearGradient,
  RadialGradient,
  Rect,
  vec,
} from '@shopify/react-native-skia';
import { theme } from '../lib/theme';

/**
 * Depth for the match screen — no scenery.
 *
 * During a game the pitch has to be the brightest, most obvious thing on
 * screen, so this does the opposite of the stadium backdrop: it darkens the
 * edges and lifts the centre, which makes the field read as an object resting
 * on a surface rather than a rectangle pasted onto a flat colour.
 *
 * Three layers, all in the app's existing surface colours:
 *   1. a vertical gradient, lighter under the controls at top
 *   2. a soft pool of light behind where the pitch sits
 *   3. corner falloff so the chrome at the edges recedes
 */
function MatchBackdropBase() {
  const { width: W, height: H } = useWindowDimensions();

  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      <Rect x={0} y={0} width={W} height={H}>
        <LinearGradient
          start={vec(0, 0)}
          end={vec(0, H)}
          colors={[theme.surfaceAlt, theme.bg, '#070a12']}
          positions={[0, 0.42, 1]}
        />
      </Rect>

      {/* Light pooling behind the pitch. */}
      <Rect x={0} y={0} width={W} height={H}>
        <RadialGradient
          c={vec(W / 2, H * 0.52)}
          r={W * 0.95}
          colors={['rgba(43,117,68,0.10)', 'rgba(43,117,68,0.03)', '#00000000']}
          positions={[0, 0.5, 1]}
        />
      </Rect>

      {/* Corner falloff. */}
      <Rect x={0} y={0} width={W} height={H}>
        <RadialGradient
          c={vec(W / 2, H * 0.5)}
          r={Math.max(W, H) * 0.72}
          colors={['#00000000', '#00000040', '#00000080']}
          positions={[0.5, 0.84, 1]}
        />
      </Rect>
    </Canvas>
  );
}

export const MatchBackdrop = React.memo(MatchBackdropBase);
