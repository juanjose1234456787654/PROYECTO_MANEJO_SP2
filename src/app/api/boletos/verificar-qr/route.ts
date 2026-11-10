import { NextResponse, NextRequest } from 'next/server';
import crypto from 'node:crypto';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawToken = typeof body?.token === 'string' ? body.token.trim() : '';

    if (!rawToken) {
      return NextResponse.json(
        { success: false, message: 'Boleto inválido: código vacío' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    let boletoEncontrado: {
      id: string;
      rutaId?: string;
      pasajeroId?: string | null;
      pasajeroNombre?: string | null;
      pasajeroCedula?: string | null;
      asiento: number | string;
      estado: string;
      codigoQr?: string | null;
      abordadoAt?: string | null;
    } | null = null;

    // Caso 1: Token con firma HMAC (6 partes separadas por "|")
    const parts = rawToken.split('|');
    if (parts.length === 6) {
      const [boletoId, tokenBusId, tokenFecha, tokenHora, tokenAsiento, receivedHash] = parts;
      const secret = process.env.QR_SECRET || 'secret_por_defecto';

      const rawData = `${boletoId}|${tokenBusId}|${tokenFecha}|${tokenHora}|${tokenAsiento}`;
      const calculatedHash = crypto.createHmac('sha256', secret).update(rawData).digest('hex');

      const recBuf = Buffer.from(receivedHash, 'hex');
      const calcBuf = Buffer.from(calculatedHash, 'hex');

      if (recBuf.length !== calcBuf.length || !crypto.timingSafeEqual(recBuf, calcBuf)) {
        return NextResponse.json(
          { success: false, message: 'BOLETO INVÁLIDO (Firma criptográfica incorrecta)' },
          { status: 400 }
        );
      }

      const { data } = await supabase
        .from('Boleto')
        .select('*')
        .eq('id', boletoId)
        .maybeSingle();

      boletoEncontrado = data;
    } else {
      // Caso 2: Código directo de boleto (ej: ECU-BOL-... o bol-... o UUID de codigoQr)
      const { data: porCodigoQr } = await supabase
        .from('Boleto')
        .select('*')
        .ilike('codigoQr', rawToken)
        .maybeSingle();

      if (porCodigoQr) {
        boletoEncontrado = porCodigoQr;
      } else {
        const { data: porId } = await supabase
          .from('Boleto')
          .select('*')
          .ilike('id', rawToken)
          .maybeSingle();
        boletoEncontrado = porId;
      }
    }

    if (!boletoEncontrado) {
      return NextResponse.json(
        { success: false, message: 'BOLETO NO ENCONTRADO EN LA BASE DE DATOS' },
        { status: 404 }
      );
    }

    const estadoNorm = (boletoEncontrado.estado || '').toUpperCase();

    if (estadoNorm === 'EMBARCADO' || estadoNorm === 'ABORDADO') {
      return NextResponse.json(
        {
          success: false,
          statusType: 'YA_USADO',
          message: 'ESTE BOLETO YA FUE UTILIZADO PARA ABORDAR',
          boleto: boletoEncontrado,
        },
        { status: 200 }
      );
    }

    if (estadoNorm === 'PENDIENTE_APROBACION') {
      return NextResponse.json(
        {
          success: false,
          message: 'PAGO PENDIENTE DE APROBACIÓN EN VENTANILLA',
          boleto: boletoEncontrado,
        },
        { status: 400 }
      );
    }

    if (estadoNorm === 'RECHAZADO' || estadoNorm === 'CANCELADO') {
      return NextResponse.json(
        {
          success: false,
          message: `BOLETO NO VÁLIDO (Estado: ${estadoNorm})`,
          boleto: boletoEncontrado,
        },
        { status: 400 }
      );
    }

    const ahoraIso = new Date().toISOString();
    const { data: actualizado, error: updateError } = await supabase
      .from('Boleto')
      .update({ estado: 'EMBARCADO', abordadoAt: ahoraIso })
      .eq('id', boletoEncontrado.id)
      .select('*')
      .maybeSingle();

    if (updateError) {
      return NextResponse.json(
        { success: false, message: 'Error al registrar el abordaje del boleto' },
        { status: 500 }
      );
    }

    const boletoFinal = actualizado || {
      ...boletoEncontrado,
      estado: 'EMBARCADO',
      abordadoAt: ahoraIso,
    };

    return NextResponse.json(
      {
        success: true,
        statusType: 'ACCESO_PERMITIDO',
        message: 'ACCESO PERMITIDO – PASAJERO EMBARCADO',
        boleto: boletoFinal,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { success: false, message: 'Error interno en el servidor de verificación' },
      { status: 500 }
    );
  }
}
