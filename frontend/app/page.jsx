'use client';

import React from 'react';
import HeroSection from '@/components/HeroSection';

export default function HomePage() {
  return (
    <div className="home-page-container" style={{ width: '100%', position: 'relative', backgroundColor: '#02050c' }}>
      <HeroSection />
    </div>
  );
}

