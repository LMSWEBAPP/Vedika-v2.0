'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import './resources.css';
import ResourcesHub from '@/components/ResourcesHub';
import ResourcesLibrary from '@/components/ResourcesLibrary';
import ResourcesCheatSheets from '@/components/ResourcesCheatSheets';
import ResourcesMarkdownCheatSheet from '@/components/ResourcesMarkdownCheatSheet';
import ResourcesDSA from '@/components/ResourcesDSA';
import ResourcesDSACompanyWise from '@/components/ResourcesDSACompanyWise';
import ResourcesDSAResources from '@/components/ResourcesDSAResources';

function ResourcesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const paramView = searchParams.get('view') || 'home';
  const paramId = searchParams.get('id') || '';

  const [view, setView] = useState(paramView);
  const [params, setParams] = useState({ id: paramId });

  useEffect(() => {
    const v = searchParams.get('view') || 'home';
    setView(v);
    if (searchParams.get('id')) {
      setParams({ id: searchParams.get('id') });
    }
  }, [searchParams]);

  const navigateTo = (newView, viewParams = {}) => {
    setView(newView);
    setParams(viewParams);
    const query = new URLSearchParams();
    if (newView !== 'home') query.set('view', newView);
    if (viewParams.id) query.set('id', viewParams.id);
    const qStr = query.toString();
    router.push(`/resources${qStr ? `?${qStr}` : ''}`, { scroll: false });
  };

  const renderView = () => {
    switch (view) {
      case 'home':
        return <ResourcesHub navigateTo={navigateTo} />;
      case 'library':
        return <ResourcesLibrary navigateTo={navigateTo} />;
      case 'cheatsheets':
        return <ResourcesCheatSheets navigateTo={navigateTo} />;
      case 'cheatsheet':
        return <ResourcesMarkdownCheatSheet navigateTo={navigateTo} cheatSheetId={params.id} />;
      case 'dsa':
        return <ResourcesDSA navigateTo={navigateTo} />;
      case 'dsa/company':
        return <ResourcesDSACompanyWise navigateTo={navigateTo} />;
      case 'dsa/resources':
        return <ResourcesDSAResources navigateTo={navigateTo} />;
      default:
        return <ResourcesHub navigateTo={navigateTo} />;
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      width: '100%',
      overflowY: 'auto'
    }}>
      {renderView()}
    </div>
  );
}

export default function ResourcesPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--muted)', fontSize: 14 }}>Loading resources...</div>
      </div>
    }>
      <ResourcesContent />
    </Suspense>
  );
}
