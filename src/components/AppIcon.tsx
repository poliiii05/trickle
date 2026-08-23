import React, { useEffect, useState } from 'react';
import { Image, View } from 'react-native';
import Apps from '../native/Apps';

const cache = new Map<string, string | null>();

export default function AppIcon({
  packageName,
  size = 40,
}: {
  packageName: string;
  size?: number;
}) {
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

  if (!uri) {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.22,
          backgroundColor: '#EFEEE9',
        }}
      />
    );
  }

  return (
    <Image
      source={{ uri }}
      style={{ width: size, height: size, borderRadius: size * 0.22 }}
    />
  );
}