'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { API_BASE } from '@/src/lib/api';

function RecuperarPasswordContent() {
    const router = useRouter();
    const params = useSearchParams();

    const [step, setStep] = useState<'EMAIL' | 'RESET'>('EMAIL');
    const [loading, setLoading] = useState(false);
    const [mensaje, setMensaje] = useState('');
    const [error, setError] = useState('');

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [form, setForm] = useState({
        email: params.get('email') || '',
        codigo: '',
        password: '',
        confirmPassword: '',
    });

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    async function solicitarCodigo(e?: React.FormEvent) {
        e?.preventDefault();
        setError('');
        setMensaje('');
        setLoading(true);

        try {
            const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: form.email }),
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                setError(data.message || 'No se pudo enviar el código');
                return;
            }

            setMensaje('Código enviado correctamente. Revise su correo.');
            setStep('RESET');

        } catch (err) {
            console.error(err);
            setError('Error conectando con el servidor');
        } finally {
            setLoading(false);
        }
    }

    async function cambiarPassword(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setMensaje('');

        if (form.password !== form.confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: form.email,
                    codigo: form.codigo,
                    nuevaPassword: form.password,
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                setError(data.message || 'No se pudo cambiar la contraseña');
                return;
            }

            router.push(`/login?email=${encodeURIComponent(form.email)}&reset=1`);

        } catch (err) {
            console.error(err);
            setError('Error conectando con el servidor');
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen bg-slate-950 px-4 py-10 flex items-center justify-center">
            <div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl overflow-hidden">
                <div className="bg-blue-700 px-8 py-7 text-white">
                    <h1 className="text-3xl font-bold">Recuperar contraseña</h1>
                    <p className="text-blue-100 mt-1">
                        Sistema Web ISP NetComp RF
                    </p>
                </div>

                <form
                    onSubmit={step === 'EMAIL' ? solicitarCodigo : cambiarPassword}
                    className="p-8 space-y-5"
                >
                    {mensaje && (
                        <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-green-700 text-sm font-semibold">
                            {mensaje}
                        </div>
                    )}

                    {error && (
                        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm font-semibold">
                            {error}
                        </div>
                    )}

                    <Input
                        label="Correo electrónico"
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        disabled={step === 'RESET'}
                    />

                    {step === 'RESET' && (
                        <>
                            <Input
                                label="Código de verificación"
                                name="codigo"
                                value={form.codigo}
                                onChange={handleChange}
                            />

                            <PasswordInput
                                label="Nueva contraseña"
                                name="password"
                                value={form.password}
                                show={showPassword}
                                onToggle={() => setShowPassword(!showPassword)}
                                onChange={handleChange}
                            />

                            <PasswordInput
                                label="Confirmar contraseña"
                                name="confirmPassword"
                                value={form.confirmPassword}
                                show={showConfirmPassword}
                                onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                                onChange={handleChange}
                            />

                            {form.confirmPassword && form.password !== form.confirmPassword && (
                                <p className="text-sm text-red-600 font-semibold">
                                    Las contraseñas no coinciden
                                </p>
                            )}

                            {form.confirmPassword && form.password === form.confirmPassword && (
                                <p className="text-sm text-green-600 font-semibold">
                                    Contraseñas coinciden
                                </p>
                            )}
                        </>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-xl bg-blue-700 py-3 font-bold text-white hover:bg-blue-800 disabled:opacity-60"
                    >
                        {loading
                            ? 'Procesando...'
                            : step === 'EMAIL'
                                ? 'Enviar código'
                                : 'Cambiar contraseña'}
                    </button>

                    {step === 'RESET' && (
                        <button
                            type="button"
                            onClick={() => solicitarCodigo()}
                            disabled={loading}
                            className="w-full rounded-xl border border-blue-200 py-3 font-bold text-blue-700 hover:bg-blue-50"
                        >
                            Reenviar código
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() => router.push('/login')}
                        className="w-full text-slate-500 hover:text-slate-800 font-semibold"
                    >
                        Volver al login
                    </button>
                </form>
            </div>
        </main>
    );
}

export default function RecuperarPasswordPage() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <RecuperarPasswordContent />
        </Suspense>
    );
}

function Input({
    label,
    name,
    value,
    onChange,
    type = 'text',
    disabled = false,
}: any) {
    return (
        <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
                {label}
            </label>
            <input
                name={name}
                type={type}
                value={value}
                disabled={disabled}
                onChange={onChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-slate-100"
            />
        </div>
    );
}

function PasswordInput({
    label,
    name,
    value,
    show,
    onToggle,
    onChange,
}: any) {
    return (
        <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
                {label}
            </label>

            <div className="relative">
                <input
                    name={name}
                    type={show ? 'text' : 'password'}
                    value={value}
                    onChange={onChange}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-14 text-slate-800 outline-none focus:ring-2 focus:ring-blue-600"
                />

                <button
                    type="button"
                    onClick={onToggle}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                >
                    {show ? '🙈' : '👁️'}
                </button>
            </div>
        </div>
    );
}