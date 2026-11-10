import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/navigation/Navbar';
import { AppFooter } from '@/components/navigation/AppFooter';
import { FloatingActions } from '@/components/ui/FloatingActions';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'EcuRutas — Cooperativa de Transportes y Turismo Interprovincial | Pasajes en Línea',
  description:
    'Compra tus pasajes de autobús en línea por todo el Ecuador: Baños de Agua Santa, Ambato, Quito, Guayaquil, Cuenca, Riobamba y Puyo. Selección de asientos VIP 2D, boletos con código QR firmado y descuentos oficiales ANT.',
  keywords: [
    'pasajes en línea ecuador',
    'cooperativa de transportes',
    'baños de agua santa',
    'ambato',
    'quito',
    'guayaquil',
    'transporte interprovincial',
    'boletos qr',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="scroll-smooth">
      <body className={`${jakarta.className} min-h-screen bg-slate-50 text-slate-900 antialiased flex flex-col`}>
        <FloatingActions />
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
        <AppFooter />
      </body>
    </html>
  );
}
