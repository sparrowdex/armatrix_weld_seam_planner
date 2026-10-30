import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Armatrix | Autonomous Robotic Weld Seam Planner',
  description: 'CAD/CAM Weld Seam Planning & Motion Control for Armatrix Snake-Arm Robots',
  icons: {
    icon: '/favicon.ico',
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
      <body className="antialiased bg-[#0D100D] text-[#F6F5EE] overflow-hidden select-none">
        {children}
      </body>
    </html>
  );
}

