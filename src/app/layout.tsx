import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/navigation/Navbar';

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
        <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} EcuRutas - UTA Manejo y Configuración de Software (SP2)
        </footer>
      </body>
    </html>
  );
}
