'use client';

import React, { useEffect, useState } from 'react';
import { IconArrowUp, IconMessageCircle } from '@/components/ui/Icons';

export function FloatingActions() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? Math.min(100, Math.max(0, (scrollTop / docHeight) * 100)) : 0;
      setScrollProgress(progress);
      setShowBackToTop(scrollTop > 320);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <div
        className="fixed top-0 left-0 right-0 h-1 z-[60] bg-transparent pointer-events-none"
        aria-hidden="true"
      >
        <div
          className="h-full bg-brand-700 transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2.5">
        {showBackToTop && (
          <button
            type="button"
            onClick={scrollToTop}
            aria-label="Volver al inicio de la página"
            title="Volver arriba"
            className="w-10 h-10 rounded-lg bg-white text-brand-700 border border-brand-200 shadow-md hover:bg-brand-700 hover:text-white transition-all duration-150 flex items-center justify-center active:scale-95"
          >
            <IconArrowUp size={18} />
          </button>
        )}

        <a
          href="https://wa.me/593991234567?text=Hola%20EcuRutas%2C%20solicito%20informaci%C3%B3n%20sobre%20frecuencias%20y%20boletos"
          target="_blank"
          rel="noreferrer"
          aria-label="Atención al pasajero por WhatsApp"
          title="Central de atención por WhatsApp"
          className="flex items-center gap-2 bg-brand-700 hover:bg-brand-800 text-white px-4 py-2.5 rounded-lg shadow-lg border border-brand-800 transition-all duration-150 active:scale-95"
        >
          <IconMessageCircle size={17} />
          <span className="text-xs font-bold tracking-wide hidden sm:inline">
            Central WhatsApp
          </span>
        </a>
      </div>
    </>
  );
}
