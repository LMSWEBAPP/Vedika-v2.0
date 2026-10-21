import { Outfit, Space_Grotesk, Cinzel, Poppins } from 'next/font/google';
import './globals.css';
import '@/components/MermaidDiagram.css';
import LayoutWrapper from '@/components/LayoutWrapper';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space',
  display: 'swap',
});

const cinzel = Cinzel({
  subsets: ['latin'],
  variable: '--font-royal',
  display: 'swap',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata = {
  title: 'VEDIKA AI TUTOR — Next-Gen Adaptive Cognitive Intelligence',
  description: 'Experience the future of personalized education with Vedika AI Tutor. Real-time voice reasoning, adaptive concept modeling, and 24/7 interactive mastery.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${outfit.variable} ${spaceGrotesk.variable} ${cinzel.variable} ${poppins.variable}`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var theme = localStorage.getItem('theme') || 'dark';
            document.documentElement.setAttribute('data-theme', theme);
          })();
        `}} />
      </head>
      <body style={{ margin: 0, padding: 0, backgroundColor: 'var(--bg)' }} suppressHydrationWarning>
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}
