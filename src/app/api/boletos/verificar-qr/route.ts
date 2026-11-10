import { NextResponse, NextRequest } from 'next/server';
import crypto from 'node:crypto';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ success: false, message: 'Boleto inválido: token vacío' }, { status: 400 });
    }

    const parts = token.split('|');
    if (parts.length !== 6) {
      return NextResponse.json({ success: false, message: 'BOLETO INVÁLIDO' }, { status: 400 });
    }

    const [boletoId, tokenBusId, tokenFecha, tokenHora, tokenAsiento, receivedHash] = parts;
    const secret = process.env.QR_SECRET || 'secret_por_defecto';

    // Comparación timing-safe del HMAC para evitar ataques de temporización
    const rawData = `${boletoId}|${tokenBusId}|${tokenFecha}|${tokenHora}|${tokenAsiento}`;
    const calculatedHash = crypto.createHmac('sha256', secret).update(rawData).digest('hex');

    const hmacMatch = crypto.timingSafeEqual(
      Buffer.from(receivedHash, 'hex'),
      Buffer.from(calculatedHash, 'hex')
    );

    if (!hmacMatch) {
      return NextResponse.json({ success: false, message: 'BOLETO INVÁLIDO (Firma incorrecta)' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: boleto, error: errorBoleto } = await supabase
      .from('Boleto')
      .select(`
        id,
        asiento,
        estado,
        abordadoAt,
        Ruta (
          busId,
          fecha
        )
      `)
      .eq('id', boletoId)
      .single();

    if (errorBoleto || !boleto) {
      return NextResponse.json({ success: false, message: 'BOLETO INVÁLIDO (No encontrado en base de datos)' }, { status: 404 });
    }

    if (boleto.estado === 'EMBARCADO') {
      return NextResponse.json({ 
        success: false, 
        statusType: 'YA_USADO', 
        message: 'YA FUE USADO' 
      }, { status: 200 });
    }

    const estadoNorm = (boleto.estado || '').toUpperCase();
    if (
      estadoNorm !== 'COMPLETADO' &&
      estadoNorm !== 'CONFIRMADO' &&
      estadoNorm !== 'PAGADO' &&
      estadoNorm !== 'EMITIDO'
    ) {
      return NextResponse.json({ success: false, message: 'BOLETO INVÁLIDO (Estado no apto)' }, { status: 400 });
    }

    const ahoraIso = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('Boleto')
      .update({ estado: 'EMBARCADO', abordadoAt: ahoraIso })
      .eq('id', boletoId);

    if (updateError) {
      return NextResponse.json({ success: false, message: 'Error al actualizar el estado del boleto' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      statusType: 'ACCESO_PERMITIDO', 
      message: 'ACCESO PERMITIDO – EMBARCADO',
      boleto: { id: boletoId, asiento: boleto.asiento, abordadoAt: ahoraIso }
    }, { status: 200 });

  } catch {
    return NextResponse.json({ success: false, message: 'Error interno en el servidor de verificación' }, { status: 500 });
  }
}