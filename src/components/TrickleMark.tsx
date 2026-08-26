import React from 'react';
import Svg, { Path, G } from 'react-native-svg';
import { useTheme } from '../theme';

export default function TrickleMark({ size = 22 }: { size?: number }) {
  const { colors } = useTheme();

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <G>
        <Path d="M6 3 H18 V5 H6 Z" fill={colors.primary} />
        <Path d="M6 19 H18 V21 H6 Z" fill={colors.primary} />
        <Path d="M8 6 H16 L12 12 Z" fill={colors.primary} />
        <Path d="M9.5 18 H14.5 L12 13.5 Z" fill={colors.primary} />
        <Path
          d="M7 5 L12 12 L7 19"
          stroke={colors.primary}
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity={0.45}
        />
        <Path
          d="M17 5 L12 12 L17 19"
          stroke={colors.primary}
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity={0.45}
        />
      </G>
    </Svg>
  );
}