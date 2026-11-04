import { NextResponse, NextRequest } from 'next/server';
import crypto from 'node:crypto';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;
    const boletoId = id;
    const secret = process.env.QR_SECRET || 'secret_por_defecto';

    // Inicializar el cliente de Supabase usando createClient del servidor
    const supabase = await createClient();

    // Consultar los datos reales del boleto y la relación con Ruta en Supabase
    const { data: boleto, error: errorBoleto } = await supabase
      .from('Boleto')
      .select(`
        id,
        asiento,
        estado,
        Ruta (
          busId,
          fecha
        )
      `)
      .eq('id', boletoId)
      .single();

    if (errorBoleto || !boleto) {
      return NextResponse.json({ success: false, error: 'Boleto no encontrado' }, { status: 404 });
    }

    // Extraer los datos reales obtenidos de la base de datos
    const busId = (boleto.Ruta as any)?.busId || 'bus_01';
    const fecha = (boleto.Ruta as any)?.fecha || new Date().toISOString().split('T')[0];
    const hora = "12:00";
    const asiento = boleto.asiento || '12';

    // Generar la firma HMAC-SHA256 con los datos reales
    const rawData = `${boletoId}|${busId}|${fecha}|${hora}|${asiento}`;
    const hash = crypto.createHmac('sha256', secret).update(rawData).digest('hex');

    const tokenQr = `${rawData}|${hash}`;

    return NextResponse.json({ success: true, tokenQr });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error al generar la firma' }, { status: 500 });
  }
}