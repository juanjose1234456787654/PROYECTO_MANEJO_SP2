import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/navigation/Navbar';
import { AppFooter } from '@/components/navigation/AppFooter';

export const metadata: Metadata = {
  title: 'EcuRutas - Sistema de Gestión y Venta de Pasajes',
  description: 'Plataforma interprovincial de transporte - UTA Manejo y Configuración de Software',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <AppFooter />
      </body>
    </html>
  );
}
