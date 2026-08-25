import React, { useEffect, useMemo, useState } from 'react';
import { Image, View,} from 'react-native';
import Apps from '../native/Apps';
import { useTheme } from '../theme';

const cache = new Map<string, string | null>();

export default function AppIcon({
  packageName,
  size = 40,
}: {
  packageName: string;
  size?: number;
}) {
  const { colors } = useTheme();
  const [uri, setUri] = useState<string | null>(cache.get(packageName) ?? null);

  useEffect(() => {
    let alive = true;
    if (cache.has(packageName)) return;

    Apps.getAppIcon(packageName).then(result => {
      cache.set(packageName, result);
      if (alive) setUri(result);
    });

    return () => {
      alive = false;
    };
  }, [packageName]);

  const shape = useMemo(
    () => ({ width: size, height: size, borderRadius: size * 0.22 }),
    [size],
  );

  if (!uri) {
    return <View style={[shape, { backgroundColor: colors.surfaceAlt }]} />;
  }

  return <Image source={{ uri }} style={shape} />;
}