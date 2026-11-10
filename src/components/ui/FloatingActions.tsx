'use client';

import React, { useEffect, useState } from 'react';

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
      {/* Barra superior de progreso de lectura / scroll */}
      <div
        className="fixed top-0 left-0 right-0 h-1 z-[60] bg-transparent pointer-events-none"
        aria-hidden="true"
      >
        <div
          className="h-full bg-gradient-to-r from-red-700 via-red-600 to-amber-400 transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Botones flotantes inferiores (WhatsApp + Volver arriba) */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
        {showBackToTop && (
          <button
            type="button"
            onClick={scrollToTop}
            aria-label="Volver arriba"
            title="Volver al inicio de la página"
            className="w-11 h-11 rounded-full bg-white text-red-700 border border-red-200 shadow-lg hover:bg-red-700 hover:text-white transition-all duration-200 flex items-center justify-center font-bold text-lg active:scale-95 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            ↑
          </button>
        )}

        <a
          href="https://wa.me/593991234567?text=Hola%20EcuRutas%2C%20deseo%20informaci%C3%B3n%20sobre%20horarios%20y%20pasajes"
          target="_blank"
          rel="noreferrer"
          aria-label="Contactar por WhatsApp"
          title="Atención al cliente por WhatsApp"
          className="group flex items-center gap-2.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-full shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-emerald-400"
        >
          <span className="text-lg leading-none">💬</span>
          <span className="text-xs font-extrabold tracking-wide hidden sm:inline">
            Atención WhatsApp
          </span>
        </a>
      </div>
    </>
  );
}
