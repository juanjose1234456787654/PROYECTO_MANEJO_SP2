'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { dataService } from '@/lib/services/dataService';
import type { ConfiguracionAppRow, Json } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';

type SocialLinks = { facebook: string; instagram: string; twitter: string };
const EMPTY_SOCIALS: SocialLinks = { facebook: '', instagram: '', twitter: '' };
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const PHONE = /^\+?[\d\s().-]{7,20}$/;

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
  const [colorPrimaria, setColorPrimaria] = useState('#b91c1c');
  const [colorSecundaria, setColorSecundaria] = useState('#dc2626');
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
      setColorPrimaria(loaded.colorPrimaria || '#b91c1c');
      setColorSecundaria(loaded.colorSecundaria || '#dc2626');
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
    if (!HEX_COLOR.test(colorPrimaria) || !HEX_COLOR.test(colorSecundaria)) {
      setNotice({ kind: 'error', text: 'Los colores deben tener formato hexadecimal #RRGGBB.' }); return;
    }
    if (soporteTelefono && !PHONE.test(soporteTelefono)) {
      setNotice({ kind: 'error', text: 'Ingresa un teléfono válido, por ejemplo +593999999999.' }); return;
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
    <header><p className="text-sm font-semibold uppercase tracking-wider text-blue-700">Administración</p><h1 className="mt-2 text-3xl font-bold text-slate-900">Configuración global</h1><p className="mt-2 text-slate-600">Personaliza la identidad y los canales de soporte de EcuRutas.</p></header>
    <form onSubmit={save} className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Identidad visual</h2>
        <div className="mt-5 grid gap-6 md:grid-cols-2">
          <div><label htmlFor="logo" className="mb-2 block text-sm font-medium">Logo de la aplicación</label><input id="logo" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={(e) => void uploadLogo(e.target.files?.[0])} className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-4 file:py-2"/><p className="mt-2 text-xs text-slate-500">PNG, JPG, WEBP o SVG · máximo 5 MB · bucket Supabase «logos»</p>{uploading && <p className="mt-2 text-sm text-blue-700">Subiendo imagen…</p>}{logoUrl && <div className="mt-4 flex h-24 items-center justify-center rounded-xl bg-slate-50 p-3"><Image src={logoUrl} alt="Vista previa del logo" width={240} height={80} unoptimized className="max-h-20 w-auto object-contain" /></div>}</div>
          <div className="space-y-4"><ColorInput id="primary" label="Color primario" value={colorPrimaria} onChange={setColorPrimaria}/><ColorInput id="secondary" label="Color secundario" value={colorSecundaria} onChange={setColorSecundaria}/><div className="flex gap-2"><span className="rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: colorPrimaria }}>Primario</span><span className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-900" style={{ backgroundColor: colorSecundaria }}>Secundario</span></div></div>
        </div>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-lg font-bold text-slate-900">Soporte y redes sociales</h2><div className="mt-5 grid gap-4 md:grid-cols-2"><Field label="Teléfono de soporte" value={soporteTelefono} onChange={setSoporteTelefono} type="tel" placeholder="+593999999999"/><Field label="Email de soporte" value={soporteEmail} onChange={setSoporteEmail} type="email" placeholder="soporte@ejemplo.com"/>{(['facebook', 'instagram', 'twitter'] as const).map((network) => <Field key={network} label={`URL de ${network === 'twitter' ? 'Twitter / X' : network}`} value={socials[network]} onChange={(value) => setSocials((old) => ({ ...old, [network]: value }))} type="url" placeholder="https://"/>)}</div></section>
      {notice && <p role="status" className={`rounded-xl border p-3 text-sm ${notice.kind === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-800'}`}>{notice.text}</p>}
      <div className="flex justify-end"><Button type="submit" disabled={busy || uploading}>{busy ? 'Guardando…' : 'Guardar configuración'}</Button></div>
    </form>
  </div>;
}

function Field({ label, value, onChange, type = 'text', placeholder }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string }) {
  return <div><label className="mb-1 block text-sm font-medium text-slate-700">{label}</label><input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"/></div>;
}

function ColorInput({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (value: string) => void }) {
  return <div><label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">{label}</label><div className="flex gap-2"><input id={id} type="color" value={HEX_COLOR.test(value) ? value : '#000000'} onChange={(e) => onChange(e.target.value)} className="h-10 w-12 cursor-pointer rounded border border-slate-300 p-1"/><input type="text" value={value} onChange={(e) => onChange(e.target.value)} maxLength={7} pattern="^#[0-9a-fA-F]{6}$" required aria-label={`${label} hexadecimal`} className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm uppercase"/></div></div>;
}
