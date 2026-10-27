'use client';

import React from 'react';

interface SeatSelectorProps {
  totalCapacity?: number;
  vipSeats?: number[];
  occupiedSeats?: number[];
  selectedSeat?: number | null;
  onSelectSeat: (seatNumber: number) => void;
  precioBase: number;
}

export function SeatSelector({
  totalCapacity = 40,
  vipSeats = [1, 2, 3, 4, 5, 6, 7, 8],
  occupiedSeats = [],
  selectedSeat,
  onSelectSeat,
  precioBase,
}: SeatSelectorProps) {
  // Generar cuadrícula de asientos en pares de 2 (Izquierda: 2, Pasillo, Derecha: 2)
  const rowsCount = Math.ceil(totalCapacity / 4);
  const rows: number[][] = [];

  for (let r = 0; r < rowsCount; r++) {
    const rowSeats: number[] = [];
    for (let c = 1; c <= 4; c++) {
      const seatNum = r * 4 + c;
      if (seatNum <= totalCapacity) {
        rowSeats.push(seatNum);
      }
    }
    rows.push(rowSeats);
  }

  return (
    <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl max-w-md mx-auto">
      {/* Cabina del conductor */}
      <div className="border-b border-slate-700 pb-4 mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
            🚌
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Frente del Bus
            </div>
            <div className="text-sm font-medium text-slate-200">Cabina del Conductor</div>
          </div>
        </div>
        <div className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-full border border-slate-700">
          Puerta Delantera
        </div>
      </div>

      {/* Leyenda */}
      <div className="grid grid-cols-4 gap-2 text-xs mb-6 bg-slate-800/80 p-3 rounded-xl border border-slate-750">
        <div className="flex items-center space-x-1.5">
          <div className="w-3.5 h-3.5 rounded bg-emerald-500" />
          <span className="text-slate-300">Disponible</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-3.5 h-3.5 rounded bg-amber-500" />
          <span className="text-slate-300">VIP</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-3.5 h-3.5 rounded bg-blue-600" />
          <span className="text-slate-300">Elegido</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-3.5 h-3.5 rounded bg-red-600 opacity-60" />
          <span className="text-slate-300">Ocupado</span>
        </div>
      </div>

      {/* Contenedor del bus con pasillo central */}
      <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
        {rows.map((row, rowIdx) => {
          const leftSeats = row.slice(0, 2);
          const rightSeats = row.slice(2, 4);

          return (
            <div key={rowIdx} className="flex items-center justify-between">
              {/* Asientos Izquierda (2) */}
              <div className="flex space-x-2">
                {leftSeats.map((seatNum) => {
                  const isVip = vipSeats.includes(seatNum);
                  const isOccupied = occupiedSeats.includes(seatNum);
                  const isSelected = selectedSeat === seatNum;

                  return (
                    <button
                      key={seatNum}
                      type="button"
                      disabled={isOccupied}
                      onClick={() => onSelectSeat(seatNum)}
                      className={`relative w-11 h-11 rounded-lg flex flex-col items-center justify-center font-bold text-xs transition-all duration-150 ${
                        isOccupied
                          ? 'bg-red-950/40 text-red-400 border border-red-900/50 cursor-not-allowed opacity-50'
                          : isSelected
                          ? 'bg-blue-600 text-white ring-4 ring-blue-500/40 scale-105 shadow-lg shadow-blue-600/30 font-black'
                          : isVip
                          ? 'bg-gradient-to-b from-amber-600 to-amber-700 text-amber-100 hover:from-amber-500 hover:to-amber-600 border border-amber-400/40 shadow-sm'
                          : 'bg-slate-800 text-slate-200 hover:bg-emerald-600 hover:text-white border border-slate-700'
                      }`}
                    >
                      <span>{seatNum}</span>
                      {isVip && !isOccupied && !isSelected && (
                        <span className="text-[8px] font-black tracking-tighter text-amber-300">
                          VIP
                        </span>
                      )}
                      {isSelected && (
                        <span className="text-[8px] font-black text-white">✓</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Pasillo Central */}
              <div className="text-[10px] text-slate-600 uppercase font-mono px-2 select-none">
                {rowIdx + 1}
              </div>

              {/* Asientos Derecha (2) */}
              <div className="flex space-x-2">
                {rightSeats.map((seatNum) => {
                  const isVip = vipSeats.includes(seatNum);
                  const isOccupied = occupiedSeats.includes(seatNum);
                  const isSelected = selectedSeat === seatNum;

                  return (
                    <button
                      key={seatNum}
                      type="button"
                      disabled={isOccupied}
                      onClick={() => onSelectSeat(seatNum)}
                      className={`relative w-11 h-11 rounded-lg flex flex-col items-center justify-center font-bold text-xs transition-all duration-150 ${
                        isOccupied
                          ? 'bg-red-950/40 text-red-400 border border-red-900/50 cursor-not-allowed opacity-50'
                          : isSelected
                          ? 'bg-blue-600 text-white ring-4 ring-blue-500/40 scale-105 shadow-lg shadow-blue-600/30 font-black'
                          : isVip
                          ? 'bg-gradient-to-b from-amber-600 to-amber-700 text-amber-100 hover:from-amber-500 hover:to-amber-600 border border-amber-400/40 shadow-sm'
                          : 'bg-slate-800 text-slate-200 hover:bg-emerald-600 hover:text-white border border-slate-700'
                      }`}
                    >
                      <span>{seatNum}</span>
                      {isVip && !isOccupied && !isSelected && (
                        <span className="text-[8px] font-black tracking-tighter text-amber-300">
                          VIP
                        </span>
                      )}
                      {isSelected && (
                        <span className="text-[8px] font-black text-white">✓</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Resumen del asiento seleccionado */}
      <div className="mt-5 p-3.5 bg-slate-800/90 rounded-xl border border-slate-700 flex items-center justify-between">
        <div>
          <div className="text-xs text-slate-400">Asiento Seleccionado</div>
          <div className="text-base font-bold text-white">
            {selectedSeat ? (
              <span className="text-blue-400">
                #{selectedSeat} {vipSeats.includes(selectedSeat) ? '(Servicio VIP)' : '(Normal)'}
              </span>
            ) : (
              <span className="text-slate-500 text-sm font-normal">Ninguno seleccionado</span>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400">Tarifa Estimada</div>
          <div className="text-lg font-extrabold text-emerald-400">
            ${selectedSeat && vipSeats.includes(selectedSeat) ? (precioBase * 1.25).toFixed(2) : precioBase.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}
