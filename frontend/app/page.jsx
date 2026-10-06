'use client';

import React from 'react';
import HeroSection from '@/components/HeroSection';

export default function HomePage() {
  return (
    <div style={{ minHeight: '100%', width: '100%', position: 'relative', overflowX: 'hidden', backgroundColor: '#02050c' }}>
      <HeroSection />
    </div>
  );
}

