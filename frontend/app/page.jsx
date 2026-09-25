'use client';

import React from 'react';
import HeroSection from '@/components/HeroSection';

export default function HomePage() {
  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflowX: 'hidden', backgroundColor: '#02050c' }}>
      <HeroSection />
    </div>
  );
}

