'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function getToken() {
    return localStorage.getItem('isp_token')?.replaceAll('"', '') || '';
}

export default function PerfilInterno({ onVolver }: { onVolver: () => void }) {
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [usuario, setUsuario] = useState<any>(null);
    const [extra, setExtra] = useState<any>({});

    useEffect(() => {
        cargarPerfil();
    }, []);


    async function cargarPerfil() {
        try {
            const token = getToken();
            console.log("Token Store: " + token)
            if (!token) {
                router.push('/login');
                return;
            }

            const res = await fetch(`${API_BASE}/perfil`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                alert(data.message || 'No se pudo cargar el perfil');
                return;
            }

            setUsuario(data.usuario);
            setExtra(data.extra || {});

        } catch (error) {
            console.error(error);
            alert('Error cargando perfil');
        } finally {
            setLoading(false);
        }
    }

    function handleUsuarioChange(e: any) {
        setUsuario({
            ...usuario,
            [e.target.name]: e.target.value,
        });
    }

    function handleExtraChange(e: any) {
        setExtra({
            ...extra,
            [e.target.name]: e.target.value,
        });
    }

    async function guardarPerfil() {
        try {
            setSaving(true);

            const token = getToken();

            const body = {
                nombres: usuario.nombres,
                apellidos: usuario.apellidos,
                telefono: usuario.telefono,

                cedula: extra?.cedula || '',
                direccion: extra?.direccion || '',
                referencia: extra?.referencia || '',
                provincia: extra?.provincia || '',
                canton: extra?.canton || '',
                parroquia: extra?.parroquia || '',
                lat: extra?.lat || null,
                lng: extra?.lng || null,

                especialidad: extra?.especialidad || '',
                telefonoEmergencia: extra?.telefonoEmergencia || '',
                zonaTrabajo: extra?.zonaTrabajo || '',

                puntoCobro: extra?.puntoCobro || '',

                area: extra?.area || '',
                turno: extra?.turno || '',
            };

            const res = await fetch(`${API_BASE}/perfil`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                alert(data.message || 'No se pudo actualizar el perfil');
                return;
            }

            const usuarioStorage = localStorage.getItem('isp_usuario');

            if (usuarioStorage) {
                const actual = JSON.parse(usuarioStorage);
                localStorage.setItem('isp_usuario', JSON.stringify({
                    ...actual,
                    nombres: usuario.nombres,
                    apellidos: usuario.apellidos,
                    telefono: usuario.telefono,
                    fotoPerfil: usuario.fotoPerfil,
                }));
            }

            alert('Perfil actualizado correctamente');

        } catch (error) {
            console.error(error);
            alert('Error actualizando perfil');
        } finally {
            setSaving(false);
        }
    }

    async function subirFoto(e: any) {
        try {
            const file = e.target.files?.[0];

            if (!file) return;

            setUploading(true);

            const token = getToken();

            const formData = new FormData();
            formData.append('foto', file);

            const res = await fetch(`${API_BASE}/perfil/foto`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                alert(data.message || 'No se pudo subir la foto');
                return;
            }

            setUsuario({
                ...usuario,
                fotoPerfil: data.fotoPerfil,
            });

            const usuarioStorage = localStorage.getItem('isp_usuario');

            if (usuarioStorage) {
                const actual = JSON.parse(usuarioStorage);
                localStorage.setItem('isp_usuario', JSON.stringify({
                    ...actual,
                    fotoPerfil: data.fotoPerfil,
                    foto: data.fotoPerfil,
                    avatar: data.fotoPerfil,
                    imagen: data.fotoPerfil,
                }));
            }

            alert('Foto actualizada correctamente');

        } catch (error) {
            console.error(error);
            alert('Error subiendo foto');
        } finally {
            setUploading(false);
        }
    }

    if (loading) {
        return (
            <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-950 to-blue-950 flex items-center justify-center">
                <p className="text-cyan-300 font-bold">Cargando perfil...</p>
            </main>
        );
    }

    const nombreCompleto = `${usuario?.nombres || ''} ${usuario?.apellidos || ''}`.trim() || 'Usuario';

    const foto =
        usuario?.fotoPerfil ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(nombreCompleto)}&background=2563eb&color=fff`;

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-950 to-blue-950 text-white">
            <div className="max-w-6xl mx-auto p-5 md:p-8">

                <div className="rounded-3xl bg-slate-900/95 border border-cyan-500/25 shadow-xl shadow-cyan-500/10 overflow-hidden">

                    <div className="p-6 md:p-8 border-b border-cyan-500/20 flex flex-col md:flex-row gap-6 md:items-center justify-between">
                        <div className="flex items-center gap-5">
                            <div className="relative">
                                <img
                                    src={foto}
                                    alt="Foto perfil"
                                    className="h-28 w-28 rounded-3xl object-cover border-2 border-cyan-400 shadow-lg shadow-cyan-500/20"
                                />

                                <label className="absolute -bottom-3 left-1/2 -translate-x-1/2 cursor-pointer rounded-xl bg-cyan-600 px-3 py-1 text-xs font-bold hover:bg-cyan-500">
                                    {uploading ? 'Subiendo...' : 'Cambiar'}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={subirFoto}
                                        className="hidden"
                                        disabled={uploading}
                                    />
                                </label>
                            </div>

                            <div>
                                <h1 className="text-3xl font-black">{nombreCompleto}</h1>
                                <p className="text-cyan-200/70">{usuario?.email}</p>

                                <span className="inline-block mt-3 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1 text-sm font-bold text-cyan-300">
                                    {usuario?.rol}
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={guardarPerfil}
                            disabled={saving}
                            className="rounded-2xl bg-blue-600 px-6 py-3 font-black text-white hover:bg-blue-500 disabled:opacity-60 shadow-lg shadow-blue-500/20"
                        >
                            {saving ? 'Guardando...' : 'Guardar cambios'}
                        </button>
                    </div>

                    <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-5">

                        <Input label="Nombres" name="nombres" value={usuario?.nombres} onChange={handleUsuarioChange} />
                        <Input label="Apellidos" name="apellidos" value={usuario?.apellidos} onChange={handleUsuarioChange} />
                        <Input label="Email" name="email" value={usuario?.email} disabled />
                        <Input label="Teléfono" name="telefono" value={usuario?.telefono} onChange={handleUsuarioChange} />

                        {usuario?.rol === 'CLIENTE' && (
                            <>
                                <SectionTitle title="Datos del cliente" />
                                <Input label="Cédula" name="cedula" value={extra?.cedula} onChange={handleExtraChange} />
                                <Input label="Dirección" name="direccion" value={extra?.direccion} onChange={handleExtraChange} />
                                <Input label="Referencia" name="referencia" value={extra?.referencia} onChange={handleExtraChange} />
                                <Input label="Provincia" name="provincia" value={extra?.provincia} onChange={handleExtraChange} />
                                <Input label="Cantón" name="canton" value={extra?.canton} onChange={handleExtraChange} />
                                <Input label="Parroquia" name="parroquia" value={extra?.parroquia} onChange={handleExtraChange} />
                                <Input label="Latitud" name="lat" value={extra?.lat} onChange={handleExtraChange} />
                                <Input label="Longitud" name="lng" value={extra?.lng} onChange={handleExtraChange} />
                            </>
                        )}

                        {usuario?.rol === 'TECNICO' && (
                            <>
                                <SectionTitle title="Datos del técnico" />
                                <Input label="Cédula" name="cedula" value={extra?.cedula} onChange={handleExtraChange} />
                                <Input label="Especialidad" name="especialidad" value={extra?.especialidad} onChange={handleExtraChange} />
                                <Input label="Teléfono emergencia" name="telefonoEmergencia" value={extra?.telefonoEmergencia} onChange={handleExtraChange} />
                                <Input label="Zona de trabajo" name="zonaTrabajo" value={extra?.zonaTrabajo} onChange={handleExtraChange} />
                            </>
                        )}

                        {usuario?.rol === 'CAJERO' && (
                            <>
                                <SectionTitle title="Datos del cajero" />
                                <Input label="Cédula" name="cedula" value={extra?.cedula} onChange={handleExtraChange} />
                                <Input label="Punto de cobro" name="puntoCobro" value={extra?.puntoCobro} onChange={handleExtraChange} />
                            </>
                        )}

                        {usuario?.rol === 'SERVICIOCLIENTE' && (
                            <>
                                <SectionTitle title="Servicio al cliente" />
                                <Input label="Cédula" name="cedula" value={extra?.cedula} onChange={handleExtraChange} />
                                <Input label="Área" name="area" value={extra?.area} onChange={handleExtraChange} />
                                <Input label="Turno" name="turno" value={extra?.turno} onChange={handleExtraChange} />
                            </>
                        )}

                        {usuario?.rol === 'ADMIN' && (
                            <>
                                <SectionTitle title="Perfil administrador" />
                                <div className="md:col-span-2 rounded-2xl border border-cyan-500/20 bg-slate-950/70 p-5">
                                    <p className="text-cyan-100/70 text-sm">
                                        Este usuario tiene permisos administrativos. Por seguridad solo puede editar sus datos principales y foto de perfil.
                                    </p>
                                </div>
                            </>
                        )}

                    </div>
                </div>
            </div>
        </main>
    );
}

function Input({
    label,
    name,
    value,
    onChange,
    disabled = false,
}: {
    label: string;
    name: string;
    value: any;
    onChange?: any;
    disabled?: boolean;
}) {
    return (
        <div>
            <label className="block text-sm font-bold text-cyan-200/80 mb-2">
                {label}
            </label>
            <input
                name={name}
                value={value || ''}
                onChange={onChange}
                disabled={disabled}
                className="w-full rounded-2xl border border-cyan-500/20 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400 disabled:opacity-60"
            />
        </div>
    );
}

function SectionTitle({ title }: { title: string }) {
    return (
        <div className="md:col-span-2 pt-4">
            <h2 className="text-xl font-black text-cyan-300 border-b border-cyan-500/20 pb-3">
                {title}
            </h2>
        </div>
    );
}