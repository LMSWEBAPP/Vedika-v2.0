'use client';

import React from 'react';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import Footer from '@/components/Footer';

export default function HomePage() {
  return (
    <main style={{ minHeight: '100vh', position: 'relative', overflowX: 'hidden', backgroundColor: '#02050c' }}>
      <Header />
      <HeroSection />
      <Footer />
    </main>
  );
}
