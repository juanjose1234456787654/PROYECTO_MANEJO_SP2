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

    // 1. Parsear el token: boletoId|busId|fecha|hora|asiento|hash
    const parts = token.split('|');
    if (parts.length !== 6) {
      return NextResponse.json({ success: false, message: 'BOLETO INVÁLIDO' }, { status: 400 });
    }

    const [boletoId, tokenBusId, tokenFecha, tokenHora, tokenAsiento, receivedHash] = parts;
    const secret = process.env.QR_SECRET || 'secret_por_defecto';

    // 2. Recalcular el HMAC y comparar (timing-safe)
    const rawData = `${boletoId}|${tokenBusId}|${tokenFecha}|${tokenHora}|${tokenAsiento}`;
    const calculatedHash = crypto.createHmac('sha256', secret).update(rawData).digest('hex');

    const hmacMatch = crypto.timingSafeEqual(
      Buffer.from(receivedHash, 'hex'),
      Buffer.from(calculatedHash, 'hex')
    );

    if (!hmacMatch) {
      return NextResponse.json({ success: false, message: 'BOLETO INVÁLIDO (Firma incorrecta)' }, { status: 400 });
    }

    // 3. Consultar "Boleto" en Supabase junto con su Ruta
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

    // 4. Verificaciones adicionales de bus y fecha (opcional según turno)
    const rutaData = boleto.Ruta as any;
    if (rutaData && rutaData.busId && rutaData.busId !== tokenBusId) {
      // Opcional: advertir si el bus no coincide
    }

    // 5. Validar estado del boleto
    if (boleto.estado === 'EMBARCADO') {
      return NextResponse.json({ 
        success: false, 
        statusType: 'YA_USADO', 
        message: 'YA FUE USADO' 
      }, { status: 200 });
    }

    if (boleto.estado !== 'COMPLETADO' && boleto.estado !== 'CONFIRMADO') {
      return NextResponse.json({ success: false, message: 'BOLETO INVÁLIDO (Estado no apto)' }, { status: 400 });
    }

    // 6. Actualizar estado a EMBARCADO y registrar abordadoAt
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

  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error interno en el servidor de verificación' }, { status: 500 });
  }
}