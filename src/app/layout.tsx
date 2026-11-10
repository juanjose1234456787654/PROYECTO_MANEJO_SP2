import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/navigation/Navbar';
import { AppFooter } from '@/components/navigation/AppFooter';
import { FloatingActions } from '@/components/ui/FloatingActions';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'EcuRutas — Cooperativa de Transportes y Turismo Interprovincial | Boletería en Línea',
  description:
    'Venta de pasajes interprovinciales en Ecuador: Baños de Agua Santa, Ambato, Quito, Guayaquil, Cuenca, Riobamba y Puyo. Consulta horarios, elige asiento y descarga tu boleto electrónico con código QR.',
  keywords: [
    'boletos de bus ecuador',
    'cooperativa de transportes baños',
    'ambato baños horarios',
    'quito baños pasajes',
    'transporte interprovincial ant',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${jakarta.variable} ${inter.variable} scroll-smooth`}>
      <body className="min-h-screen bg-page text-neutral-900 font-sans antialiased flex flex-col">
        <FloatingActions />
        <Navbar />
        <Breadcrumbs />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <AppFooter />
      </body>
    </html>
  );
}
