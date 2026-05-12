'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE } from '@/src/lib/api';

export default function RegisterPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [mensaje, setMensaje] = useState('');
    const [error, setError] = useState('');

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [form, setForm] = useState({
        nombres: '',
        apellidos: '',
        email: '',
        password: '',
        confirmPassword: '',
        telefono: '',
        rol: 'CLIENTE',

        cedula: '',
        direccion: '',
        referencia: '',
        provincia: '',
        canton: '',
        parroquia: '',
        lat: '',
        lng: '',

        especialidad: '',
        telefonoEmergencia: '',
        zonaTrabajo: '',

        puntoCobro: '',

        area: '',
        turno: '',
    });


    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    async function handleRegister(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setMensaje('');
        setLoading(true);

        if (form.password !== form.confirmPassword) {
            setError('Las contraseñas no coinciden');
            setLoading(false);
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    lat: form.lat ? Number(form.lat) : null,
                    lng: form.lng ? Number(form.lng) : null,
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                setError(data.message || 'No se pudo registrar');
                return;
            }

            router.push(`/verify-email?email=${encodeURIComponent(form.email)}`);
        } catch (err) {
            console.error(err);
            setError('Error conectando con el servidor');
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen bg-slate-950 px-4 py-10">
            <div className="mx-auto w-full max-w-5xl rounded-3xl bg-white shadow-2xl overflow-hidden">
                <div className="bg-blue-700 px-8 py-7 text-white">
                    <h1 className="text-3xl font-bold">Crear cuenta ISP</h1>
                    <p className="text-blue-100 mt-1">
                        Registro de usuarios y perfiles del sistema
                    </p>
                </div>

                <form onSubmit={handleRegister} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Input label="Nombres" name="nombres" value={form.nombres} onChange={handleChange} />
                    <Input label="Apellidos" name="apellidos" value={form.apellidos} onChange={handleChange} />
                    <Input label="Email" name="email" type="email" value={form.email} onChange={handleChange} />

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Contraseña
                        </label>

                        <div className="relative">
                            <input
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                value={form.password}
                                onChange={handleChange}
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-14 text-slate-800 outline-none focus:ring-2 focus:ring-blue-600"
                            />

                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                            >
                                {showPassword ? '🙈' : '👁️'}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Confirmar contraseña
                        </label>

                        <div className="relative">
                            <input
                                name="confirmPassword"
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={form.confirmPassword}
                                onChange={handleChange}
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-14 text-slate-800 outline-none focus:ring-2 focus:ring-blue-600"
                            />

                            <button
                                type="button"
                                onClick={() =>
                                    setShowConfirmPassword(!showConfirmPassword)
                                }
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                            >
                                {showConfirmPassword ? '🙈' : '👁️'}
                            </button>
                        </div>

                        {form.confirmPassword &&
                            form.password !== form.confirmPassword && (
                                <p className="mt-2 text-sm text-red-600">
                                    Las contraseñas no coinciden
                                </p>
                            )}

                        {form.confirmPassword &&
                            form.password === form.confirmPassword && (
                                <p className="mt-2 text-sm text-green-600">
                                    Contraseñas coinciden
                                </p>
                            )}
                    </div>
                    <Input label="Teléfono" name="telefono" value={form.telefono} onChange={handleChange} />

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Rol</label>
                        <select
                            name="rol"
                            value={form.rol}
                            onChange={handleChange}
                            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 outline-none focus:ring-2 focus:ring-blue-600"
                        >
                            <option value="CLIENTE">Cliente</option>
                            <option value="TECNICO">Técnico</option>
                            <option value="CAJERO">Cajero</option>
                            <option value="SERVICIOCLIENTE">Servicio al cliente</option>
                            <option value="ADMIN">Administrador</option>
                        </select>
                    </div>

                    {form.rol === 'CLIENTE' && (
                        <>
                            <Input label="Cédula" name="cedula" value={form.cedula} onChange={handleChange} />
                            <Input label="Dirección" name="direccion" value={form.direccion} onChange={handleChange} />
                            <Input label="Referencia" name="referencia" value={form.referencia} onChange={handleChange} />
                            <Input label="Provincia" name="provincia" value={form.provincia} onChange={handleChange} />
                            <Input label="Cantón" name="canton" value={form.canton} onChange={handleChange} />
                            <Input label="Parroquia" name="parroquia" value={form.parroquia} onChange={handleChange} />
                            <Input label="Latitud" name="lat" value={form.lat} onChange={handleChange} />
                            <Input label="Longitud" name="lng" value={form.lng} onChange={handleChange} />
                        </>
                    )}

                    {form.rol === 'TECNICO' && (
                        <>
                            <Input label="Cédula" name="cedula" value={form.cedula} onChange={handleChange} />
                            <Input label="Especialidad" name="especialidad" value={form.especialidad} onChange={handleChange} />
                            <Input label="Teléfono emergencia" name="telefonoEmergencia" value={form.telefonoEmergencia} onChange={handleChange} />
                            <Input label="Zona de trabajo" name="zonaTrabajo" value={form.zonaTrabajo} onChange={handleChange} />
                        </>
                    )}

                    {form.rol === 'CAJERO' && (
                        <>
                            <Input label="Cédula" name="cedula" value={form.cedula} onChange={handleChange} />
                            <Input label="Punto de cobro" name="puntoCobro" value={form.puntoCobro} onChange={handleChange} />
                        </>
                    )}

                    {form.rol === 'SERVICIOCLIENTE' && (
                        <>
                            <Input label="Cédula" name="cedula" value={form.cedula} onChange={handleChange} />
                            <Input label="Área" name="area" value={form.area} onChange={handleChange} />
                            <Input label="Turno" name="turno" value={form.turno} onChange={handleChange} />
                        </>
                    )}

                    {error && (
                        <div className="md:col-span-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {mensaje && (
                        <div className="md:col-span-2 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
                            {mensaje}
                        </div>
                    )}

                    <div className="md:col-span-2 flex gap-3">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 rounded-xl bg-blue-700 py-3 font-bold text-white hover:bg-blue-800 disabled:opacity-60"
                        >
                            {loading ? 'Registrando...' : 'Crear cuenta'}
                        </button>

                        <button
                            type="button"
                            onClick={() => router.push('/login')}
                            className="rounded-xl border border-slate-300 px-6 py-3 font-bold text-slate-700 hover:bg-slate-100"
                        >
                            Ir al login
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}

function Input({
    label,
    name,
    value,
    onChange,
    type = 'text',
}: {
    label: string;
    name: string;
    value: string;
    type?: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
    return (
        <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">{label}</label>
            <input
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 outline-none focus:ring-2 focus:ring-blue-600"
            />
        </div>
    );
}