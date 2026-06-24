'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';

export default function ThemedIcon() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // resolvedTheme is only known after hydration, and a manual theme toggle
  // can't be observed via a <picture><source prefers-color-scheme> swap.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  return (
    <Image
      src={mounted && resolvedTheme === 'dark' ? '/logos/icon-dark.jpg' : '/logos/icon-light.jpg'}
      width={40}
      height={40}
      alt="Icon"
    />
  );
}
