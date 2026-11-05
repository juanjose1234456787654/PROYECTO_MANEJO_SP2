'use client';

import { useState, ChangeEvent, FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function PagosPage() {
  const supabase = createClient();

  const [file, setFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // ID de boleto simulado para cumplir con la ruta solicitada {uid}/{boletoId}/{timestamp}.{ext}
  const boletoId = "bol-01";

  // (2) Validación client-side
  const validateFile = (selectedFile: File): boolean => {
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg'];
    const maxSize = 5 * 1024 * 1024; // 5 MB

    if (!allowedTypes.includes(selectedFile.type)) {
      setErrorMsg('Formato no válido. Solo se permiten archivos PDF, PNG o JPG.');
      return false;
    }
    if (selectedFile.size > maxSize) {
      setErrorMsg('El archivo supera el tamaño máximo de 5 MB.');
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

  // (3) Subida a Storage y actualización en base de datos
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!file) {
      setErrorMsg('Por favor, selecciona un comprobante antes de continuar.');
      return;
    }

    if (!validateFile(file)) return;

    setIsLoading(true);

    try {
      // Obtener el UID del usuario autenticado
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error('No hay una sesión activa. Por favor, inicia sesión.');
      }

      // Construir la ruta: {uid}/{boletoId}/{timestamp}.{ext}
      const ext = file.name.split('.').pop() || 'pdf';
      const timestamp = Date.now();
      const filePath = `${user.id}/${boletoId}/${timestamp}.${ext}`;

      // Subir al bucket privado "comprobantes_pagos"
      const { error: uploadError } = await supabase.storage
        .from('comprobantes_pagos')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (uploadError) {
        throw new Error(`Error de Storage: ${uploadError.message}`);
      }

      // Update en "Boleto"
      // Usamos 'as never' para evitar errores de tipado si database.types.ts no se ha regenerado aún
      const { error: dbError } = await supabase
        .from('Boleto')
        .update({
          comprobanteUrl: filePath,
          estado: 'PENDIENTE_APROBACION'
        } as never)
        .eq('id', boletoId);

      if (dbError) {
        throw new Error(`Error al actualizar el boleto: ${dbError.message}`);
      }

      // (4) Mensaje de confirmación
      setSuccessMsg('¡Comprobante subido exitosamente! Tu pago está en revisión.');
      setFile(null); // Limpiar el input

    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Ocurrió un error inesperado de red o cuota de almacenamiento.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md mt-10 border border-gray-100">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Checkout de Pago</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* (1) Formulario con opción "Depósito/Transferencia Bancaria" */}
        <div className="p-4 border border-blue-100 rounded-md bg-blue-50 space-y-4">
          <div>
            <h2 className="text-lg font-medium text-gray-800 mb-2">
              Depósito / Transferencia Bancaria
            </h2>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sube tu comprobante
            </label>
            <input
              type="file"
              accept=".pdf, .png, .jpg, .jpeg"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
            />
            <p className="mt-2 text-xs text-gray-600">
              Formatos permitidos: <strong>PDF, PNG, JPG</strong>. Tamaño máximo: <strong>5 MB</strong>.
            </p>
          </div>
        </div>

        {/* Mensajes de error y éxito */}
        {errorMsg && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded-md text-sm">
            {successMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !file}
          className={`w-full py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors
            ${isLoading || !file
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'}`}
        >
          {isLoading ? 'Subiendo comprobante...' : 'Confirmar Pago'}
        </button>
      </form>
    </div>
  );
}