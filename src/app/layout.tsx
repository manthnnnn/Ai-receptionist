import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Clinic AI — 24/7 AI Phone Receptionist for Healthcare Clinics',
  description: 'Automate clinic incoming phone calls, doctor availability checks, and appointment bookings with sub-800ms natural voice AI.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} bg-black text-white antialiased selection:bg-[#FF5500] selection:text-white`}>
        {children}
      </body>
    </html>
  );
}
