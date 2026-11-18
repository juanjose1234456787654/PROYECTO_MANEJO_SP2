import { useState, type FormEvent } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { dataService } from '@/lib/services/dataService';
import type { CooperativaRow } from '@/lib/types';

interface PerfilCooperativaProps {
  cooperativa: CooperativaRow;
  onGuardado: (cooperativa: CooperativaRow) => void;
}

const INPUT_CLASS = 'w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm';

function logoValido(valor: string): boolean {
  return URL.canParse(valor) && new URL(valor).protocol === 'https:';
}

export function PerfilCooperativa({ cooperativa, onGuardado }: PerfilCooperativaProps) {
  const [nombre, setNombre] = useState(cooperativa.nombre);
  const [direccion, setDireccion] = useState(cooperativa.direccion ?? '');
  const [telefono, setTelefono] = useState(cooperativa.telefono ?? '');
  const [logo, setLogo] = useState(cooperativa.logoUrl ?? '');
  const [primario, setPrimario] = useState(cooperativa.colorPrimaria ?? '#1e3a8a');
  const [secundario, setSecundario] = useState(cooperativa.colorSecundaria ?? '#3b82f6');
  const [guardando, setGuardando] = useState(false);
  const [estado, setEstado] = useState<{ texto: string; error: boolean } | null>(null);

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (guardando) return;

    const nombreLimpio = nombre.trim();
    const direccionLimpia = direccion.trim();
    const telefonoLimpio = telefono.trim();
    const logoLimpio = logo.trim();
    if (!nombreLimpio || !direccionLimpia || !telefonoLimpio) {
      setEstado({ error: true, texto: 'Completa el nombre, la dirección y el teléfono.' });
      return;
    }
    if (logoLimpio && !logoValido(logoLimpio)) {
      setEstado({ error: true, texto: 'Ingresa una URL HTTPS válida para el logo.' });
      return;
    }

    setGuardando(true);
    setEstado(null);
    try {
      const { data, error } = await dataService.patchCooperativa(cooperativa.id, {
        nombre: nombreLimpio,
        direccion: direccionLimpia,
        telefono: telefonoLimpio,
        logoUrl: logoLimpio || null,
        colorPrimaria: primario,
        colorSecundaria: secundario,
      });
      if (error || !data) {
        setEstado({ error: true, texto: 'No se pudo guardar el perfil. Verifica los datos y tus permisos.' });
        return;
      }
      onGuardado(data);
      setEstado({ error: false, texto: 'Perfil de la cooperativa guardado.' });
    } catch {
      setEstado({ error: true, texto: 'No se pudo conectar. Intenta guardar nuevamente.' });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section aria-labelledby="titulo-perfil-cooperativa" className="max-w-3xl rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h2 id="titulo-perfil-cooperativa" className="mb-5 text-lg font-bold text-neutral-900">Perfil de la cooperativa</h2>
      <form onSubmit={guardar} className="space-y-5">
        <fieldset disabled={guardando} className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1 text-sm font-semibold sm:col-span-2">
            <span>Nombre</span>
            <input className={INPUT_CLASS} required value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </label>
          <label className="space-y-1 text-sm font-semibold">
            <span>Dirección</span>
            <input className={INPUT_CLASS} autoComplete="street-address" required value={direccion} onChange={(e) => setDireccion(e.target.value)} />
          </label>
          <label className="space-y-1 text-sm font-semibold">
            <span>Teléfono</span>
            <input className={INPUT_CLASS} type="tel" autoComplete="tel" required value={telefono} onChange={(e) => setTelefono(e.target.value)} />
          </label>
          <label className="space-y-1 text-sm font-semibold sm:col-span-2">
            <span>URL del logo</span>
            <input className={INPUT_CLASS} type="url" placeholder="https://ejemplo.ec/logo.png" value={logo} onChange={(e) => setLogo(e.target.value)} />
          </label>
          <label className="flex items-center gap-3 text-sm font-semibold">
            <input type="color" value={primario} onChange={(e) => setPrimario(e.target.value)} />
            <span>Color corporativo primario</span>
          </label>
          <label className="flex items-center gap-3 text-sm font-semibold">
            <input type="color" value={secundario} onChange={(e) => setSecundario(e.target.value)} />
            <span>Color corporativo secundario</span>
          </label>
        </fieldset>

        {logoValido(logo.trim()) && (
          <div className="flex min-h-20 items-center justify-center rounded-xl bg-neutral-50 p-3">
            <Image src={logo.trim()} alt="Vista previa del logo" width={180} height={72} unoptimized referrerPolicy="no-referrer" className="max-h-20 w-auto object-contain" />
          </div>
        )}
        {estado && (
          <p role={estado.error ? 'alert' : 'status'} className={estado.error ? 'text-sm text-danger-800' : 'text-sm text-success-800'}>
            {estado.texto}
          </p>
        )}
        <Button type="submit" isLoading={guardando}>Guardar perfil</Button>
      </form>
    </section>
  );
}
