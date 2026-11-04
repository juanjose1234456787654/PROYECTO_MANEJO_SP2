import { NextResponse, NextRequest } from 'next/server';
import crypto from 'node:crypto';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const boletoId = id;
    const secret = process.env.QR_SECRET || 'secret_por_defecto';

    // Datos clave del boleto para firmar
    const busId = "bus_01";
    const fecha = new Date().toISOString().split('T')[0];
    const hora = "12:00";
    const asiento = "12";

    // Generar la firma HMAC-SHA256
    const rawData = `${boletoId}|${busId}|${fecha}|${hora}|${asiento}`;
    const hash = crypto.createHmac('sha256', secret).update(rawData).digest('hex');

    const tokenQr = `${rawData}|${hash}`;

    return NextResponse.json({ success: true, tokenQr });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error al generar la firma' },
      { status: 500 }
    );
  }
}
