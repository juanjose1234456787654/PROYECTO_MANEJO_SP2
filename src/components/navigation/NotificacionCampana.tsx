'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { enviarCorreoSimulado } from '@/modules/notificaciones/emailService';

interface Notificacion {
  id: string;
  mensaje: string;
  leida: boolean;
  fecha: string;
}

export default function NotificacionCampana() {
  const supabase = createClient();
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Supabase Realtime
  useEffect(() => {
    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }

      const channel = supabase.channel(`boleto-changes-${user.id}`);
      channelRef.current = channel;

      channel.on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'Boleto',
          filter: `pasajeroId=eq.${user.id}`,
        },
        (payload) => {
          // ¡DIAGNÓSTICO! Esto te dirá en consola si el evento llega
          console.log('¡Evento Realtime recibido! Estado nuevo:', payload.new.estado);

          const nuevoEstado = payload.new.estado;
          const estadoStr = String(nuevoEstado).toUpperCase();
          let mensaje = '';
          const correoPasajero = user.email || 'pasajero@transuta.ec';

          // 1. EVENTO: PAGO RECIBIDO
          if (estadoStr === 'PENDIENTE_APROBACION') {
            mensaje = `Hemos recibido tu comprobante para el boleto ${payload.new.id}. Está en revisión.`;

            console.log('Ejecutando enviarCorreoSimulado para PAGO_RECIBIDO...');
            enviarCorreoSimulado('PAGO_RECIBIDO', correoPasajero, {
              nombrePasajero: payload.new.pasajeroNombre || 'Pasajero',
              idBoleto: payload.new.id,
              monto: String(payload.new.precio || '0.00')
            });

            // 2. EVENTO: BOLETO APROBADO
          } else if (estadoStr === 'COMPLETADO' || estadoStr === 'PAGADO') {
            mensaje = `Tu boleto ${payload.new.id} ha sido aprobado.`;

            console.log('Ejecutando enviarCorreoSimulado para BOLETO_APROBADO...');
            enviarCorreoSimulado('BOLETO_APROBADO', correoPasajero, {
              nombrePasajero: payload.new.pasajeroNombre || 'Pasajero',
              idBoleto: payload.new.id
            });

            // 3. EVENTO: PAGO RECHAZADO
          } else if (estadoStr === 'RECHAZADO' || estadoStr === 'CANCELADO') {
            mensaje = `Tu pago para el boleto ${payload.new.id} fue rechazado.`;

            console.log('Ejecutando enviarCorreoSimulado para PAGO_RECHAZADO...');
            enviarCorreoSimulado('PAGO_RECHAZADO', correoPasajero, {
              nombrePasajero: payload.new.pasajeroNombre || 'Pasajero',
              idBoleto: payload.new.id,
              motivo: 'Comprobante no válido o monto incorrecto.'
            });
          }

          if (mensaje) {
            const nuevaNoti: Notificacion = {
              id: crypto.randomUUID(),
              mensaje,
              leida: false,
              fecha: new Date().toISOString(),
            };
            setNotificaciones((prev) => [nuevaNoti, ...prev]);
          }
        }
      );

      channel.subscribe();
    };

    setupRealtime();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [supabase]);

  const noLeidas = notificaciones.filter((n) => !n.leida).length;

  const marcarComoLeida = (id: string) => {
    setNotificaciones((prev) =>
      prev.map((n) => (n.id === id ? { ...n, leida: true } : n))
    );
  };

  const marcarTodasComoLeidas = () => {
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>

        {noLeidas > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {noLeidas}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          <div className="flex justify-between items-center p-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-800">Notificaciones</h3>
            <button onClick={marcarTodasComoLeidas} className="text-xs text-blue-600 hover:underline">
              Marcar todas como leídas
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notificaciones.length === 0 ? (
              <p className="p-4 text-center text-sm text-gray-500">No tienes notificaciones.</p>
            ) : (
              notificaciones.map((noti) => (
                <div
                  key={noti.id}
                  className={`p-4 border-b border-gray-50 text-sm flex flex-col gap-1 transition-colors ${!noti.leida ? 'bg-blue-50' : 'bg-white'}`}
                >
                  <p className="text-gray-800">{noti.mensaje}</p>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-400">
                      {new Date(noti.fecha).toLocaleTimeString()}
                    </span>
                    {!noti.leida && (
                      <button
                        onClick={() => marcarComoLeida(noti.id)}
                        className="text-xs font-medium text-blue-600 hover:text-blue-800"
                      >
                        Marcar como leída
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}