'use client';

import { useState } from 'react';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { API_BASE } from '@/src/lib/api';

function VerifyEmailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const email = searchParams.get('email') || '';

    const [codigo, setCodigo] = useState('');
    const [loading, setLoading] = useState(false);
    const [reenviando, setReenviando] = useState(false);
    const [ok, setOk] = useState(false);
    const [expired, setExpired] = useState(false);
    const [message, setMessage] = useState(
        email
            ? 'Ingresa el código que enviamos a tu correo.'
            : 'No se encontró el email para verificar.'
    );

    async function verificarCodigo(e: React.FormEvent) {
        e.preventDefault();

        setMessage('');
        setExpired(false);

        if (!email) {
            setMessage('Email no encontrado.');
            return;
        }

        if (!codigo || codigo.length < 6) {
            setMessage('Ingresa el código de 6 dígitos.');
            return;
        }

        try {
            setLoading(true);

            const res = await fetch(`${API_BASE}/auth/verify-email-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, codigo }),
            });

            const data = await res.json();

            setOk(Boolean(data.ok));
            setExpired(Boolean(data.expired));
            setMessage(data.message || 'Proceso finalizado.');
        } catch (error) {
            console.error(error);
            setOk(false);
            setMessage('Error conectando con el servidor.');
        } finally {
            setLoading(false);
        }
    }

    async function reenviarCodigo() {
        if (!email) {
            setMessage('Email no encontrado.');
            return;
        }

        try {
            setReenviando(true);
            setExpired(false);

            const res = await fetch(`${API_BASE}/auth/resend-email-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                setMessage(data.message || 'No se pudo reenviar el código.');
                return;
            }

            setOk(false);
            setCodigo('');
            setMessage('Código reenviado correctamente. Revisa tu correo.');
        } catch (error) {
            console.error(error);
            setMessage('Error conectando con el servidor.');
        } finally {
            setReenviando(false);
        }
    }

    return (
        <>
            <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
                <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl text-center">
                    <div
                        className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full text-3xl ${ok
                            ? 'bg-green-100 text-green-700'
                            : expired
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                    >
                        {ok ? '✓' : expired ? '⏱' : '✉️'}
                    </div>

                    <h1 className="text-2xl font-bold text-slate-800">
                        {ok ? 'Correo verificado' : 'Verifica tu correo'}
                    </h1>

                    {email && (
                        <p className="mt-3 text-sm text-slate-500 break-all">
                            Código enviado a <span className="font-bold text-blue-700">{email}</span>
                        </p>
                    )}

                    {!ok && (
                        <form onSubmit={verificarCodigo} className="mt-6">
                            <input
                                value={codigo}
                                onChange={(e) =>
                                    setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))
                                }
                                placeholder="000000"
                                maxLength={6}
                                className="w-full rounded-xl border border-slate-300 px-4 py-4 text-center text-2xl font-bold tracking-[10px] text-slate-800 outline-none focus:ring-2 focus:ring-blue-600"
                            />

                            <button
                                type="submit"
                                disabled={loading || !email}
                                className="mt-5 w-full rounded-xl bg-blue-700 py-3 font-bold text-white hover:bg-blue-800 disabled:opacity-60"
                            >
                                {loading ? 'Verificando...' : 'Verificar código'}
                            </button>
                        </form>
                    )}

                    {message && (
                        <div
                            className={`mt-5 rounded-xl border px-4 py-3 text-sm ${ok
                                ? 'border-green-200 bg-green-50 text-green-700'
                                : expired
                                    ? 'border-yellow-200 bg-yellow-50 text-yellow-700'
                                    : 'border-slate-200 bg-slate-50 text-slate-600'
                                }`}
                        >
                            {message}
                        </div>
                    )}

                    {!ok && (
                        <button
                            type="button"
                            onClick={reenviarCodigo}
                            disabled={reenviando || !email}
                            className="mt-4 w-full rounded-xl border border-slate-300 py-3 font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                        >
                            {reenviando ? 'Reenviando...' : 'Reenviar código de confirmación'}
                        </button>
                    )}

                    {ok && (
                        <>
                            <p className="mt-5 text-sm text-slate-500">
                                Redireccionando al login...
                            </p>

                            {setTimeout(() => {
                                router.push(`/login?email=${encodeURIComponent(email)}`);
                            }, 1500)}
                        </>
                    )}
                </div>
            </main>
        </>
    );
}
export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <VerifyEmailContent />
        </Suspense>
    );
}