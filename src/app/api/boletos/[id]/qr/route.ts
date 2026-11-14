import { NextResponse, NextRequest } from 'next/server';
import crypto from 'node:crypto';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const boletoId = params.id;
    const secret = process.env.QR_SECRET || 'secret_por_defecto';

    const supabase = await createClient();

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

    const estado = boleto.estado?.toUpperCase();
    if (!['COMPLETADO', 'CONFIRMADO', 'PAGADO', 'EMBARCADO'].includes(estado || '')) {
      return NextResponse.json(
        { success: false, error: 'El QR se habilitará cuando se apruebe el pago del boleto.' },
        { status: 409 }
      );
    }

    const rutaRel = boleto.Ruta as { busId?: string; fecha?: string } | null;
    const busId = rutaRel?.busId || 'bus_01';
    const fecha = rutaRel?.fecha || new Date().toISOString().split('T')[0];
    const hora = '12:00';
    const asiento = boleto.asiento || '12';

    const rawData = `${boletoId}|${busId}|${fecha}|${hora}|${asiento}`;
    const hash = crypto.createHmac('sha256', secret).update(rawData).digest('hex');

    const tokenQr = `${rawData}|${hash}`;

    return NextResponse.json({ success: true, tokenQr });
  } catch {
    return NextResponse.json({ success: false, error: 'Error al generar la firma' }, { status: 500 });
  }
}
