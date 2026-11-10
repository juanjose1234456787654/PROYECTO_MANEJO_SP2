'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { dataService } from '@/lib/services/dataService';
import type { ConfiguracionAppRow, Json } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';

type SocialLinks = { facebook: string; instagram: string; twitter: string };
const EMPTY_SOCIALS: SocialLinks = { facebook: '', instagram: '', twitter: '' };
const PHONE = /^\+?[\d\s().-]{7,20}$/;
const DEFAULT_PRIMARY = 'var(--color-brand-700)';
const DEFAULT_SECONDARY = 'var(--color-brand-600)';

function readSocials(value: Json | null): SocialLinks {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return EMPTY_SOCIALS;
  const socials = value as Record<string, Json | undefined>;
  return {
    facebook: typeof socials.facebook === 'string' ? socials.facebook : '',
    instagram: typeof socials.instagram === 'string' ? socials.instagram : '',
    twitter: typeof socials.twitter === 'string' ? socials.twitter : '',
  };
}

export default function AdminConfiguracionPage() {
  const [config, setConfig] = useState<ConfiguracionAppRow | null>(null);
  const [logoUrl, setLogoUrl] = useState('');
  const [colorPrimaria, setColorPrimaria] = useState(DEFAULT_PRIMARY);
  const [colorSecundaria, setColorSecundaria] = useState(DEFAULT_SECONDARY);
  const [soporteTelefono, setSoporteTelefono] = useState('');
  const [soporteEmail, setSoporteEmail] = useState('');
  const [socials, setSocials] = useState<SocialLinks>(EMPTY_SOCIALS);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    let active = true;
    dataService.getConfig().then((loaded) => {
      if (!active) return;
      setConfig(loaded);
      setLogoUrl(loaded.logoUrl || '');
      setColorPrimaria(loaded.colorPrimaria || DEFAULT_PRIMARY);
      setColorSecundaria(loaded.colorSecundaria || DEFAULT_SECONDARY);
      setSoporteTelefono(loaded.soporteTelefono || '');
      setSoporteEmail(loaded.soporteEmail || '');
      setSocials(readSocials(loaded.redesSociales));
    }).catch(() => active && setNotice({ kind: 'error', text: 'No se pudo cargar la configuración.' }));
    return () => { active = false; };
  }, []);

  async function uploadLogo(file: File | undefined) {
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'].includes(file.type)) {
      setNotice({ kind: 'error', text: 'Usa una imagen PNG, JPG, WEBP o SVG.' }); return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setNotice({ kind: 'error', text: 'La imagen debe pesar menos de 5 MB.' }); return;
    }
    setUploading(true); setNotice(null);
    const supabase = createClient();
    const path = `app/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`;
    // Cada archivo usa un nombre único; evitar upsert mantiene el permiso necesario en INSERT.
    const { data, error } = await supabase.storage.from('logos').upload(path, file, { contentType: file.type });
    if (error) setNotice({ kind: 'error', text: `No se pudo subir el logo: ${error.message}. Verifica que exista el bucket público "logos".` });
    else {
      const { data: publicData } = supabase.storage.from('logos').getPublicUrl(data.path);
      setLogoUrl(publicData.publicUrl);
      setNotice({ kind: 'success', text: 'Logo cargado. Guarda los cambios para aplicarlo.' });
    }
    setUploading(false);
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setNotice(null);
    if (soporteTelefono && !PHONE.test(soporteTelefono)) {
      setNotice({ kind: 'error', text: 'Ingresa un teléfono válido, por ejemplo +593 3 282 1234.' }); return;
    }
    for (const [network, url] of Object.entries(socials)) {
      if (url && (!URL.canParse(url) || !['http:', 'https:'].includes(new URL(url).protocol))) {
        setNotice({ kind: 'error', text: `La URL de ${network} debe comenzar con https://.` }); return;
      }
    }
    setBusy(true);
    try {
      const saved = await dataService.saveConfig({
        ...(config ? { id: config.id } : {}),
        logoUrl: logoUrl || null, colorPrimaria, colorSecundaria,
        soporteTelefono: soporteTelefono || null, soporteEmail: soporteEmail || null,
        redesSociales: socials as unknown as Json,
      });
      if (saved.error) throw new Error(saved.error);
      setConfig(saved.data);
      window.dispatchEvent(new CustomEvent('app-config-updated', { detail: saved.data }));
      setNotice({ kind: 'success', text: 'Configuración guardada correctamente.' });
    } catch (error) {
      setNotice({ kind: 'error', text: error instanceof Error ? error.message : 'No se pudo guardar la configuración.' });
    } finally { setBusy(false); }
  }

  return <div className="mx-auto max-w-4xl space-y-8">
    <header><p className="text-sm font-semibold uppercase tracking-wider text-brand-700">Administración</p><h1 className="mt-2 text-3xl font-bold text-neutral-900">Configuración global</h1><p className="mt-2 text-neutral-600">Personaliza el logotipo y los canales de atención al pasajero de EcuRutas.</p></header>
    <form onSubmit={save} className="space-y-6">
      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-neutral-900">Identidad visual</h2>
        <div className="mt-5 grid gap-6 md:grid-cols-2">
          <div><label htmlFor="logo" className="mb-2 block text-sm font-medium">Logo de la cooperativa</label><input id="logo" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={(e) => void uploadLogo(e.target.files?.[0])} className="block w-full text-sm text-neutral-600 file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-100 file:px-4 file:py-2"/><p className="mt-2 text-xs text-neutral-500">PNG, JPG, WEBP o SVG · máximo 5 MB · bucket Supabase «logos»</p>{uploading && <p className="mt-2 text-sm text-brand-700">Subiendo imagen…</p>}{logoUrl && <div className="mt-4 flex h-24 items-center justify-center rounded-xl bg-neutral-50 p-3"><Image src={logoUrl} alt="Vista previa del logo" width={240} height={80} unoptimized className="max-h-20 w-auto object-contain" /></div>}</div>
          <div className="space-y-3"><p className="text-sm font-medium text-neutral-700">Paleta institucional</p><p className="text-xs text-neutral-500">Los colores del sistema están unificados bajo los tokens de marca de la cooperativa.</p><div className="flex flex-wrap gap-2 pt-1"><span className="rounded-lg bg-brand-700 px-4 py-2 text-xs font-semibold text-white">Primario (brand-700)</span><span className="rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white">Secundario (brand-600)</span><span className="rounded-lg bg-accent-600 px-4 py-2 text-xs font-semibold text-white">Acento (accent-600)</span></div></div>
        </div>
      </section>
      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"><h2 className="text-lg font-bold text-neutral-900">Soporte y redes sociales</h2><div className="mt-5 grid gap-4 md:grid-cols-2"><Field label="Teléfono de soporte" value={soporteTelefono} onChange={setSoporteTelefono} type="tel" placeholder="+593 3 282 1234"/><Field label="Correo de soporte" value={soporteEmail} onChange={setSoporteEmail} type="email" placeholder="atencion@ecurutas.ec"/>{(['facebook', 'instagram', 'twitter'] as const).map((network) => <Field key={network} label={`URL de ${network === 'twitter' ? 'Twitter / X' : network}`} value={socials[network]} onChange={(value) => setSocials((old) => ({ ...old, [network]: value }))} type="url" placeholder="https://"/>)}</div></section>
      {notice && <p role="status" className={`rounded-xl border p-3 text-sm ${notice.kind === 'success' ? 'border-success-200 bg-success-50 text-success-800' : 'border-danger-200 bg-danger-50 text-danger-800'}`}>{notice.text}</p>}
      <div className="flex justify-end"><Button type="submit" disabled={busy || uploading}>{busy ? 'Guardando…' : 'Guardar configuración'}</Button></div>
    </form>
  </div>;
}

function Field({ label, value, onChange, type = 'text', placeholder }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string }) {
  return <div><label className="mb-1 block text-sm font-medium text-neutral-700">{label}</label><input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-100"/></div>;
}
