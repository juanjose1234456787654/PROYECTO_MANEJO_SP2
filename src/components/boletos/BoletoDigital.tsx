'use client';
import React, { useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

interface BoletoProps {
  boletoId: string;
  estado: string;
}

export default function BoletoDigital({ boletoId, estado }: BoletoProps) {
  const [tokenQr, setTokenQr] = useState<string>('');
  const estadoUpper = estado.toUpperCase();
  const esValido =
    estadoUpper === 'COMPLETADO' ||
    estadoUpper === 'CONFIRMADO' ||
    estadoUpper === 'PAGADO' ||
    estadoUpper === 'EMBARCADO';

  useEffect(() => {
    if (esValido) {
      fetch(`/api/boletos/${boletoId}/qr`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setTokenQr(data.tokenQr);
          }
        });
    }
  }, [boletoId, esValido]);

  if (!esValido) {
    return <p className="text-neutral-500">El QR estará disponible cuando el boleto esté completado.</p>;
  }

  return (
    <div className="flex flex-col items-center p-4 bg-white rounded shadow">
      <h3 className="text-lg font-bold mb-2">Boleto Digital</h3>
      {tokenQr ? (
        <QRCodeCanvas value={tokenQr} size={200} />
      ) : (
        <p>Generando código QR seguro...</p>
      )}
    </div>
  );
}