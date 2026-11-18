import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';

type TablaCatalogo = 'MarcaBus' | 'CarroceriaBus';

function AdministrarCatalogo({ tabla, titulo }: { tabla: TablaCatalogo; titulo: string }) {
  const [nombres, setNombres] = useState<string[]>([]);
  const [nombre, setNombre] = useState('');
  const [editando, setEditando] = useState<string | null>(null);
  const [eliminando, setEliminando] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ texto: string; error: boolean } | null>(null);

  useEffect(() => {
    let vigente = true;
    async function cargar() {
      const { data, error } = await createClient().from(tabla).select('nombre').order('nombre');
      if (!vigente) return;
      if (error) setMensaje({ texto: 'No se pudo cargar el catálogo.', error: true });
      else setNombres((data ?? []).map((fila) => fila.nombre));
      setCargando(false);
    }
    void cargar();
    return () => { vigente = false; };
  }, [tabla]);

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const limpio = nombre.trim().replace(/\s+/g, ' ');
    if (!limpio || guardando) return;

    setGuardando(true);
    setMensaje(null);
    try {
      const catalogo = createClient().from(tabla);
      const { data, error } = await (editando
        ? catalogo.update({ nombre: limpio }).eq('nombre', editando)
        : catalogo.insert({ nombre: limpio })).select('nombre').single();

      if (error || !data) {
        const texto = error?.code === '23505'
          ? 'Ya existe una opción con ese nombre.'
          : tabla === 'MarcaBus' && limpio.toLowerCase() === 'hinos'
            ? 'Usa el nombre de la marca Hino.'
            : 'No se pudo guardar. Verifica el nombre y tus permisos.';
        setMensaje({ texto, error: true });
        return;
      }

      setNombres((prev) => [...prev.filter((item) => item !== editando), data.nombre]
        .sort((a, b) => a.localeCompare(b, 'es')));
      setEditando(null);
      setNombre('');
      setMensaje({ texto: 'Opción guardada.', error: false });
    } catch {
      setMensaje({ texto: 'No se pudo conectar con el catálogo.', error: true });
    } finally {
      setGuardando(false);
    }
  }

  async function quitar() {
    if (!eliminando || guardando) return;
    setGuardando(true);
    setMensaje(null);
    try {
      const { error, data } = await createClient().from(tabla).delete()
        .eq('nombre', eliminando).select('nombre').maybeSingle();
      if (error || !data) {
        setMensaje({
          texto: error?.code === '23503' || error?.code === '23001'
            ? 'Esta opción está en uso por un bus.'
            : 'No se pudo eliminar. Verifica tus permisos.',
          error: true,
        });
        return;
      }
      setNombres((prev) => prev.filter((item) => item !== data.nombre));
      if (editando === data.nombre) {
        setEditando(null);
        setNombre('');
      }
      setMensaje({ texto: 'Opción eliminada.', error: false });
    } catch {
      setMensaje({ texto: 'No se pudo conectar con el catálogo.', error: true });
    } finally {
      setEliminando(null);
      setGuardando(false);
    }
  }

  return (
    <section className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-5">
      <h2 className="text-lg font-bold text-neutral-900">{titulo}</h2>
      <form onSubmit={guardar} className="flex flex-wrap items-end gap-2">
        <label className="min-w-40 flex-1 text-sm font-semibold">
          <span>{editando ? 'Nuevo nombre' : 'Nombre'}</span>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={120} required
            className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2" />
        </label>
        <Button type="submit" isLoading={guardando} disabled={cargando}>
          {editando ? 'Guardar' : 'Agregar'}
        </Button>
        {editando && (
          <Button type="button" variant="outline" disabled={guardando} onClick={() => {
            setEditando(null);
            setNombre('');
          }}>Cancelar</Button>
        )}
      </form>
      {mensaje && <p role={mensaje.error ? 'alert' : 'status'} className={mensaje.error ? 'text-danger-800' : 'text-success-800'}>{mensaje.texto}</p>}
      {cargando ? <p role="status">Cargando catálogo…</p> : (
        <ul className="divide-y divide-neutral-200">
          {nombres.map((item) => (
            <li key={item} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span className="text-sm font-medium">{item}</span>
              {eliminando === item ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm">¿Eliminar?</span>
                  <Button size="sm" disabled={guardando} onClick={() => void quitar()}>Sí, eliminar</Button>
                  <Button size="sm" variant="outline" disabled={guardando} onClick={() => setEliminando(null)}>Cancelar</Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={guardando} onClick={() => {
                    setEditando(item);
                    setNombre(item);
                    setMensaje(null);
                  }}>Editar</Button>
                  <Button size="sm" variant="outline" disabled={guardando} onClick={() => setEliminando(item)}>Eliminar</Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function CatalogosFlota() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <AdministrarCatalogo tabla="MarcaBus" titulo="Marcas" />
      <AdministrarCatalogo tabla="CarroceriaBus" titulo="Carrocerías" />
    </div>
  );
}
