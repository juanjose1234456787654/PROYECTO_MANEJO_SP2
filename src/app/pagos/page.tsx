'use client';

import { useState, ChangeEvent, FormEvent } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { PurchaseStepper } from '@/components/ui/PurchaseStepper';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  IconCreditCard,
  IconUpload,
  IconCheckCircle,
  IconAlertTriangle,
  IconShieldCheck,
  IconArrowRight,
} from '@/components/ui/Icons';

export default function PagosPage() {
  const supabase = createClient();

  const [file, setFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // ID de boleto para cumplir con la ruta solicitada {uid}/{boletoId}/{timestamp}.{ext}
  const boletoId = 'bol-01';

  const validateFile = (selectedFile: File): boolean => {
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg'];
    const maxSize = 5 * 1024 * 1024; // 5 MB

    if (!allowedTypes.includes(selectedFile.type)) {
      setErrorMsg('Formato no admitido. Adjunta únicamente un archivo en formato PDF, PNG o JPG.');
      return false;
    }
    if (selectedFile.size > maxSize) {
      setErrorMsg('El archivo excede el límite permitido de 5 MB.');
      return false;
    }

    setErrorMsg(null);
    return true;
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSuccessMsg(null);
    const selectedFile = e.target.files?.[0];

    if (selectedFile) {
      setFile(selectedFile);
      validateFile(selectedFile);
    } else {
      setFile(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!file) {
      setErrorMsg('Selecciona el comprobante bancario antes de enviar el registro.');
      return;
    }

    if (!validateFile(file)) return;

    setIsLoading(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error('Debes iniciar sesión con tu cuenta de pasajero para registrar el comprobante.');
      }

      const ext = file.name.split('.').pop() || 'pdf';
      const timestamp = Date.now();
      const filePath = `${user.id}/${boletoId}/${timestamp}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('comprobantes_pagos')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (uploadError) {
        throw new Error(`Error al almacenar el comprobante: ${uploadError.message}`);
      }

      const { error: dbError } = await supabase
        .from('Boleto')
        .update({
          comprobanteUrl: filePath,
          estado: 'PENDIENTE_APROBACION',
        } as never)
        .eq('id', boletoId);

      if (dbError) {
        throw new Error(`Error al actualizar el estado del boleto: ${dbError.message}`);
      }

      setSuccessMsg(
        'Comprobante recibido correctamente. El boleto pasó a estado PENDIENTE_APROBACION para verificación en ventanilla.'
      );
      setFile(null);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('No fue posible completar la carga del archivo. Verifica tu conexión e inténtalo de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <PurchaseStepper currentStep={4} />

      <div className="border-b border-zinc-200 pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-red-700">
            Paso 4 · Verificación Bancaria
          </span>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-zinc-900 tracking-tight mt-0.5">
            Registro de Comprobante de Pago
          </h1>
          <p className="text-xs sm:text-sm text-zinc-600 mt-1">
            Adjunta la constancia de transferencia o depósito para que ventanilla habilite tu boleto electrónico QR.
          </p>
        </div>
        <Badge variant="oficinista">Referencia: {boletoId.toUpperCase()}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Columna Izquierda: Datos Bancarios Oficiales */}
        <div className="lg:col-span-5 bg-zinc-900 text-white rounded-xl p-6 sm:p-7 space-y-5 shadow-md">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-red-700 flex items-center justify-center text-white">
                <IconCreditCard size={18} />
              </div>
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wide">
                  Cuentas Recaudadoras
                </h2>
                <p className="text-[11px] text-zinc-400">Cooperativa de Transportes EcuRutas</p>
              </div>
            </div>
            <Badge variant="chofer">RUC 1890012345001</Badge>
          </div>

          <div className="space-y-3 text-xs">
            <div className="bg-zinc-950/70 border border-zinc-800 rounded-lg p-4 space-y-1">
              <div className="text-amber-400 font-bold uppercase tracking-wider text-[11px]">
                Banco Pichincha · Cuenta Corriente
              </div>
              <div className="font-mono text-base font-bold text-white">2100-4892-10</div>
              <div className="text-zinc-400">Titular: Coop. de Transportes EcuRutas</div>
            </div>

            <div className="bg-zinc-950/70 border border-zinc-800 rounded-lg p-4 space-y-1">
              <div className="text-amber-400 font-bold uppercase tracking-wider text-[11px]">
                Cooperativa Oscus · Cuenta de Ahorros
              </div>
              <div className="font-mono text-base font-bold text-white">4001-9823-44</div>
              <div className="text-zinc-400">Correo de notificación: recaudacion@ecurutas.ec</div>
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-800 flex items-start gap-2.5 text-xs text-zinc-400 leading-relaxed">
            <IconShieldCheck size={16} className="text-emerald-400 shrink-0 mt-0.5" />
            <span>
              El archivo se almacena de forma privada en Supabase Storage con URL firmada temporal para revisión exclusiva de ventanilla.
            </span>
          </div>
        </div>

        {/* Columna Derecha: Formulario de Carga */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-zinc-200 p-6 sm:p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="comprobante-input"
                className="block text-sm font-bold text-zinc-900"
              >
                Archivo del comprobante bancario *
              </label>
              <p className="text-xs text-zinc-500">
                Formatos admitidos: <strong>PDF, PNG o JPG</strong> · Peso máximo: <strong>5 MB</strong>.
              </p>

              <div className="mt-2 border-2 border-dashed border-zinc-300 hover:border-red-700 rounded-xl p-6 bg-zinc-50/70 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white border border-zinc-200 text-red-700 flex items-center justify-center">
                      <IconUpload size={18} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-zinc-900">
                        {file ? file.name : 'Ningún archivo seleccionado'}
                      </div>
                      <div className="text-[11px] text-zinc-500">
                        {file
                          ? `${(file.size / 1024).toFixed(1)} KB · Listo para enviar`
                          : 'Selecciona la captura o PDF de tu transferencia'}
                      </div>
                    </div>
                  </div>

                  <input
                    id="comprobante-input"
                    type="file"
                    accept=".pdf, .png, .jpg, .jpeg"
                    onChange={handleFileChange}
                    className="block text-xs text-zinc-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-red-700 file:text-white hover:file:bg-red-800 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {errorMsg && (
              <div
                role="alert"
                className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs font-semibold flex items-start gap-2.5"
              >
                <IconAlertTriangle size={16} className="shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div
                role="status"
                className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg text-xs font-semibold space-y-2"
              >
                <div className="flex items-start gap-2.5">
                  <IconCheckCircle size={16} className="text-emerald-700 shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
                <div className="pt-1 pl-6">
                  <Link
                    href="/pasajero"
                    className="inline-flex items-center gap-1 text-emerald-800 font-bold underline"
                  >
                    <span>Ir al Historial de Boletos</span>
                    <IconArrowRight size={13} />
                  </Link>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-100">
              <Link href="/pasajero" className="text-xs font-semibold text-zinc-600 hover:text-zinc-900">
                Ver estado de mis boletos
              </Link>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={isLoading || !file}
                isLoading={isLoading}
              >
                <IconUpload size={16} />
                <span>{isLoading ? 'Subiendo comprobante...' : 'Confirmar y enviar comprobante'}</span>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
