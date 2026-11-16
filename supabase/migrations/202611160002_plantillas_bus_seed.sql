-- ==============================================================================
-- MIGRACIÓN SEED: Plantillas por Defecto (Urbana e Interprovincial) (ECU-3 / #67)
-- Sistema: EcuRutas - Universidad Técnica de Ambato
-- Responsable: Andrés Toasa (@The-Fabry, Dev 3)
-- ==============================================================================

-- 1. Plantilla Estándar Urbana: 1 Piso, 2+2, 2 puertas, asiento junto a chofer, sin VIP
INSERT INTO public."PlantillaBus" (
    id,
    nombre,
    "tipoBus",
    pisos,
    "capacidadTotal",
    "configuracionJson",
    "esGlobal",
    "cooperativaId",
    activo
) VALUES (
    'plantilla-urbano-1piso-std',
    'Urbano Estándar 1 Piso (40 asientos)',
    'URBANO',
    1,
    40,
    '{
        "tipoBus": "URBANO",
        "pisos": 1,
        "capacidadTotal": 40,
        "asientosVipCount": 0,
        "asientosNormalCount": 40,
        "asientosVipNumeros": [],
        "plantillaNombre": "Urbano Estándar 1 Piso (40 asientos)",
        "plantas": [
            {
                "piso": 1,
                "filas": 11,
                "columnas": 5,
                "elementos": [
                    {"id": "p1-0-0", "fila": 0, "columna": 0, "tipo": "chofer", "etiqueta": "Chofer"},
                    {"id": "p1-0-1", "fila": 0, "columna": 1, "tipo": "asiento_normal", "numero": 1, "categoria": "normal"},
                    {"id": "p1-0-2", "fila": 0, "columna": 2, "tipo": "pasillo"},
                    {"id": "p1-0-3", "fila": 0, "columna": 3, "tipo": "asiento_normal", "numero": 2, "categoria": "normal"},
                    {"id": "p1-0-4", "fila": 0, "columna": 4, "tipo": "puerta", "etiqueta": "Puerta Delantera"},

                    {"id": "p1-1-0", "fila": 1, "columna": 0, "tipo": "asiento_normal", "numero": 3, "categoria": "normal"},
                    {"id": "p1-1-1", "fila": 1, "columna": 1, "tipo": "asiento_normal", "numero": 4, "categoria": "normal"},
                    {"id": "p1-1-2", "fila": 1, "columna": 2, "tipo": "pasillo"},
                    {"id": "p1-1-3", "fila": 1, "columna": 3, "tipo": "asiento_normal", "numero": 5, "categoria": "normal"},
                    {"id": "p1-1-4", "fila": 1, "columna": 4, "tipo": "asiento_normal", "numero": 6, "categoria": "normal"},

                    {"id": "p1-2-0", "fila": 2, "columna": 0, "tipo": "asiento_normal", "numero": 7, "categoria": "normal"},
                    {"id": "p1-2-1", "fila": 2, "columna": 1, "tipo": "asiento_normal", "numero": 8, "categoria": "normal"},
                    {"id": "p1-2-2", "fila": 2, "columna": 2, "tipo": "pasillo"},
                    {"id": "p1-2-3", "fila": 2, "columna": 3, "tipo": "asiento_normal", "numero": 9, "categoria": "normal"},
                    {"id": "p1-2-4", "fila": 2, "columna": 4, "tipo": "asiento_normal", "numero": 10, "categoria": "normal"},

                    {"id": "p1-3-0", "fila": 3, "columna": 0, "tipo": "asiento_normal", "numero": 11, "categoria": "normal"},
                    {"id": "p1-3-1", "fila": 3, "columna": 1, "tipo": "asiento_normal", "numero": 12, "categoria": "normal"},
                    {"id": "p1-3-2", "fila": 3, "columna": 2, "tipo": "pasillo"},
                    {"id": "p1-3-3", "fila": 3, "columna": 3, "tipo": "asiento_normal", "numero": 13, "categoria": "normal"},
                    {"id": "p1-3-4", "fila": 3, "columna": 4, "tipo": "asiento_normal", "numero": 14, "categoria": "normal"},

                    {"id": "p1-4-0", "fila": 4, "columna": 0, "tipo": "asiento_normal", "numero": 15, "categoria": "normal"},
                    {"id": "p1-4-1", "fila": 4, "columna": 1, "tipo": "asiento_normal", "numero": 16, "categoria": "normal"},
                    {"id": "p1-4-2", "fila": 4, "columna": 2, "tipo": "pasillo"},
                    {"id": "p1-4-3", "fila": 4, "columna": 3, "tipo": "asiento_normal", "numero": 17, "categoria": "normal"},
                    {"id": "p1-4-4", "fila": 4, "columna": 4, "tipo": "asiento_normal", "numero": 18, "categoria": "normal"},

                    {"id": "p1-5-0", "fila": 5, "columna": 0, "tipo": "asiento_normal", "numero": 19, "categoria": "normal"},
                    {"id": "p1-5-1", "fila": 5, "columna": 1, "tipo": "asiento_normal", "numero": 20, "categoria": "normal"},
                    {"id": "p1-5-2", "fila": 5, "columna": 2, "tipo": "pasillo"},
                    {"id": "p1-5-3", "fila": 5, "columna": 3, "tipo": "vacio"},
                    {"id": "p1-5-4", "fila": 5, "columna": 4, "tipo": "puerta", "etiqueta": "Puerta Trasera"},

                    {"id": "p1-6-0", "fila": 6, "columna": 0, "tipo": "asiento_normal", "numero": 21, "categoria": "normal"},
                    {"id": "p1-6-1", "fila": 6, "columna": 1, "tipo": "asiento_normal", "numero": 22, "categoria": "normal"},
                    {"id": "p1-6-2", "fila": 6, "columna": 2, "tipo": "pasillo"},
                    {"id": "p1-6-3", "fila": 6, "columna": 3, "tipo": "asiento_normal", "numero": 23, "categoria": "normal"},
                    {"id": "p1-6-4", "fila": 6, "columna": 4, "tipo": "asiento_normal", "numero": 24, "categoria": "normal"},

                    {"id": "p1-7-0", "fila": 7, "columna": 0, "tipo": "asiento_normal", "numero": 25, "categoria": "normal"},
                    {"id": "p1-7-1", "fila": 7, "columna": 1, "tipo": "asiento_normal", "numero": 26, "categoria": "normal"},
                    {"id": "p1-7-2", "fila": 7, "columna": 2, "tipo": "pasillo"},
                    {"id": "p1-7-3", "fila": 7, "columna": 3, "tipo": "asiento_normal", "numero": 27, "categoria": "normal"},
                    {"id": "p1-7-4", "fila": 7, "columna": 4, "tipo": "asiento_normal", "numero": 28, "categoria": "normal"},

                    {"id": "p1-8-0", "fila": 8, "columna": 0, "tipo": "asiento_normal", "numero": 29, "categoria": "normal"},
                    {"id": "p1-8-1", "fila": 8, "columna": 1, "tipo": "asiento_normal", "numero": 30, "categoria": "normal"},
                    {"id": "p1-8-2", "fila": 8, "columna": 2, "tipo": "pasillo"},
                    {"id": "p1-8-3", "fila": 8, "columna": 3, "tipo": "asiento_normal", "numero": 31, "categoria": "normal"},
                    {"id": "p1-8-4", "fila": 8, "columna": 4, "tipo": "asiento_normal", "numero": 32, "categoria": "normal"},

                    {"id": "p1-9-0", "fila": 9, "columna": 0, "tipo": "asiento_normal", "numero": 33, "categoria": "normal"},
                    {"id": "p1-9-1", "fila": 9, "columna": 1, "tipo": "asiento_normal", "numero": 34, "categoria": "normal"},
                    {"id": "p1-9-2", "fila": 9, "columna": 2, "tipo": "pasillo"},
                    {"id": "p1-9-3", "fila": 9, "columna": 3, "tipo": "asiento_normal", "numero": 35, "categoria": "normal"},
                    {"id": "p1-9-4", "fila": 9, "columna": 4, "tipo": "asiento_normal", "numero": 36, "categoria": "normal"},

                    {"id": "p1-10-0", "fila": 10, "columna": 0, "tipo": "asiento_normal", "numero": 37, "categoria": "normal"},
                    {"id": "p1-10-1", "fila": 10, "columna": 1, "tipo": "asiento_normal", "numero": 38, "categoria": "normal"},
                    {"id": "p1-10-2", "fila": 10, "columna": 2, "tipo": "asiento_normal", "numero": 39, "categoria": "normal"},
                    {"id": "p1-10-3", "fila": 10, "columna": 3, "tipo": "asiento_normal", "numero": 40, "categoria": "normal"},
                    {"id": "p1-10-4", "fila": 10, "columna": 4, "tipo": "vacio"}
                ]
            }
        ]
    }'::jsonb,
    true,
    NULL,
    true
)
ON CONFLICT (id) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    "tipoBus" = EXCLUDED."tipoBus",
    pisos = EXCLUDED.pisos,
    "capacidadTotal" = EXCLUDED."capacidadTotal",
    "configuracionJson" = EXCLUDED."configuracionJson",
    "esGlobal" = EXCLUDED."esGlobal",
    activo = EXCLUDED.activo;

-- 2. Plantilla Interprovincial Ejecutiva: 1 Piso, Baño y Cafetería, Asientos VIP delanteros
INSERT INTO public."PlantillaBus" (
    id,
    nombre,
    "tipoBus",
    pisos,
    "capacidadTotal",
    "configuracionJson",
    "esGlobal",
    "cooperativaId",
    activo
) VALUES (
    'plantilla-interprovincial-1piso-ejecutivo',
    'Interprovincial Clásico 1 Piso con Baño y Cafetería (40 asientos)',
    'INTERPROVINCIAL',
    1,
    40,
    '{
        "tipoBus": "INTERPROVINCIAL",
        "pisos": 1,
        "capacidadTotal": 40,
        "asientosVipCount": 8,
        "asientosNormalCount": 32,
        "asientosVipNumeros": [1, 2, 3, 4, 5, 6, 7, 8],
        "plantillaNombre": "Interprovincial Clásico 1 Piso con Baño y Cafetería (40 asientos)",
        "plantas": [
            {
                "piso": 1,
                "filas": 11,
                "columnas": 5,
                "elementos": [
                    {"id": "p1-0-0", "fila": 0, "columna": 0, "tipo": "chofer", "etiqueta": "Chofer"},
                    {"id": "p1-0-1", "fila": 0, "columna": 1, "tipo": "asiento_vip", "numero": 1, "categoria": "vip"},
                    {"id": "p1-0-2", "fila": 0, "columna": 2, "tipo": "pasillo"},
                    {"id": "p1-0-3", "fila": 0, "columna": 3, "tipo": "asiento_vip", "numero": 2, "categoria": "vip"},
                    {"id": "p1-0-4", "fila": 0, "columna": 4, "tipo": "puerta", "etiqueta": "Puerta Delantera"},

                    {"id": "p1-1-0", "fila": 1, "columna": 0, "tipo": "asiento_vip", "numero": 3, "categoria": "vip"},
                    {"id": "p1-1-1", "fila": 1, "columna": 1, "tipo": "asiento_vip", "numero": 4, "categoria": "vip"},
                    {"id": "p1-1-2", "fila": 1, "columna": 2, "tipo": "pasillo"},
                    {"id": "p1-1-3", "fila": 1, "columna": 3, "tipo": "asiento_vip", "numero": 5, "categoria": "vip"},
                    {"id": "p1-1-4", "fila": 1, "columna": 4, "tipo": "asiento_vip", "numero": 6, "categoria": "vip"},

                    {"id": "p1-2-0", "fila": 2, "columna": 0, "tipo": "asiento_vip", "numero": 7, "categoria": "vip"},
                    {"id": "p1-2-1", "fila": 2, "columna": 1, "tipo": "asiento_vip", "numero": 8, "categoria": "vip"},
                    {"id": "p1-2-2", "fila": 2, "columna": 2, "tipo": "pasillo"},
                    {"id": "p1-2-3", "fila": 2, "columna": 3, "tipo": "asiento_normal", "numero": 9, "categoria": "normal"},
                    {"id": "p1-2-4", "fila": 2, "columna": 4, "tipo": "asiento_normal", "numero": 10, "categoria": "normal"},

                    {"id": "p1-3-0", "fila": 3, "columna": 0, "tipo": "asiento_normal", "numero": 11, "categoria": "normal"},
                    {"id": "p1-3-1", "fila": 3, "columna": 1, "tipo": "asiento_normal", "numero": 12, "categoria": "normal"},
                    {"id": "p1-3-2", "fila": 3, "columna": 2, "tipo": "pasillo"},
                    {"id": "p1-3-3", "fila": 3, "columna": 3, "tipo": "asiento_normal", "numero": 13, "categoria": "normal"},
                    {"id": "p1-3-4", "fila": 3, "columna": 4, "tipo": "asiento_normal", "numero": 14, "categoria": "normal"},

                    {"id": "p1-4-0", "fila": 4, "columna": 0, "tipo": "asiento_normal", "numero": 15, "categoria": "normal"},
                    {"id": "p1-4-1", "fila": 4, "columna": 1, "tipo": "asiento_normal", "numero": 16, "categoria": "normal"},
                    {"id": "p1-4-2", "fila": 4, "columna": 2, "tipo": "pasillo"},
                    {"id": "p1-4-3", "fila": 4, "columna": 3, "tipo": "asiento_normal", "numero": 17, "categoria": "normal"},
                    {"id": "p1-4-4", "fila": 4, "columna": 4, "tipo": "asiento_normal", "numero": 18, "categoria": "normal"},

                    {"id": "p1-5-0", "fila": 5, "columna": 0, "tipo": "asiento_normal", "numero": 19, "categoria": "normal"},
                    {"id": "p1-5-1", "fila": 5, "columna": 1, "tipo": "asiento_normal", "numero": 20, "categoria": "normal"},
                    {"id": "p1-5-2", "fila": 5, "columna": 2, "tipo": "pasillo"},
                    {"id": "p1-5-3", "fila": 5, "columna": 3, "tipo": "asiento_normal", "numero": 21, "categoria": "normal"},
                    {"id": "p1-5-4", "fila": 5, "columna": 4, "tipo": "asiento_normal", "numero": 22, "categoria": "normal"},

                    {"id": "p1-6-0", "fila": 6, "columna": 0, "tipo": "asiento_normal", "numero": 23, "categoria": "normal"},
                    {"id": "p1-6-1", "fila": 6, "columna": 1, "tipo": "asiento_normal", "numero": 24, "categoria": "normal"},
                    {"id": "p1-6-2", "fila": 6, "columna": 2, "tipo": "pasillo"},
                    {"id": "p1-6-3", "fila": 6, "columna": 3, "tipo": "asiento_normal", "numero": 25, "categoria": "normal"},
                    {"id": "p1-6-4", "fila": 6, "columna": 4, "tipo": "asiento_normal", "numero": 26, "categoria": "normal"},

                    {"id": "p1-7-0", "fila": 7, "columna": 0, "tipo": "asiento_normal", "numero": 27, "categoria": "normal"},
                    {"id": "p1-7-1", "fila": 7, "columna": 1, "tipo": "asiento_normal", "numero": 28, "categoria": "normal"},
                    {"id": "p1-7-2", "fila": 7, "columna": 2, "tipo": "pasillo"},
                    {"id": "p1-7-3", "fila": 7, "columna": 3, "tipo": "asiento_normal", "numero": 29, "categoria": "normal"},
                    {"id": "p1-7-4", "fila": 7, "columna": 4, "tipo": "asiento_normal", "numero": 30, "categoria": "normal"},

                    {"id": "p1-8-0", "fila": 8, "columna": 0, "tipo": "asiento_normal", "numero": 31, "categoria": "normal"},
                    {"id": "p1-8-1", "fila": 8, "columna": 1, "tipo": "asiento_normal", "numero": 32, "categoria": "normal"},
                    {"id": "p1-8-2", "fila": 8, "columna": 2, "tipo": "pasillo"},
                    {"id": "p1-8-3", "fila": 8, "columna": 3, "tipo": "asiento_normal", "numero": 33, "categoria": "normal"},
                    {"id": "p1-8-4", "fila": 8, "columna": 4, "tipo": "asiento_normal", "numero": 34, "categoria": "normal"},

                    {"id": "p1-9-0", "fila": 9, "columna": 0, "tipo": "asiento_normal", "numero": 35, "categoria": "normal"},
                    {"id": "p1-9-1", "fila": 9, "columna": 1, "tipo": "asiento_normal", "numero": 36, "categoria": "normal"},
                    {"id": "p1-9-2", "fila": 9, "columna": 2, "tipo": "pasillo"},
                    {"id": "p1-9-3", "fila": 9, "columna": 3, "tipo": "asiento_normal", "numero": 37, "categoria": "normal"},
                    {"id": "p1-9-4", "fila": 9, "columna": 4, "tipo": "asiento_normal", "numero": 38, "categoria": "normal"},

                    {"id": "p1-10-0", "fila": 10, "columna": 0, "tipo": "asiento_normal", "numero": 39, "categoria": "normal"},
                    {"id": "p1-10-1", "fila": 10, "columna": 1, "tipo": "asiento_normal", "numero": 40, "categoria": "normal"},
                    {"id": "p1-10-2", "fila": 10, "columna": 2, "tipo": "pasillo"},
                    {"id": "p1-10-3", "fila": 10, "columna": 3, "tipo": "bano", "etiqueta": "Baño"},
                    {"id": "p1-10-4", "fila": 10, "columna": 4, "tipo": "cafeteria", "etiqueta": "Cafetería"}
                ]
            }
        ]
    }'::jsonb,
    true,
    NULL,
    true
)
ON CONFLICT (id) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    "tipoBus" = EXCLUDED."tipoBus",
    pisos = EXCLUDED.pisos,
    "capacidadTotal" = EXCLUDED."capacidadTotal",
    "configuracionJson" = EXCLUDED."configuracionJson",
    "esGlobal" = EXCLUDED."esGlobal",
    activo = EXCLUDED.activo;
