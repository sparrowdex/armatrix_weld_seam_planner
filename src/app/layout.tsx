import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Armatrix | Weld Seam Planner',
  description: 'Plan, simulate and export robotic weld jobs for Armatrix snake-arm robots, in the browser.',
  icons: {
    icon: '/images/logo/armatrix-symbol.svg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#111611',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-[#0D100D] text-[#F6F5EE] overflow-x-hidden select-none min-h-screen">
        {children}
      </body>
    </html>
  );
}

