'use client';

import CoursePage from '@/components/CoursePage';
import { T } from '@/lib/lms-data';

export default function CoursesRoute() {
  return (
    <div style={{
      minHeight: 'calc(100vh - 64px)',
      background: 'var(--bg)',
      color: T.text,
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <CoursePage completed={{}} />
    </div>
  );
}
