'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { API_BASE, saveToken } from '@/src/lib/api';
import { Suspense } from 'react';
function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const emailParam = searchParams.get('email') || '';
  const verified = searchParams.get('verified') === '1';

  const [form, setForm] = useState({
    email: emailParam,
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(data.message || 'No se pudo iniciar sesión');
        return;
      }

      saveToken(data.token);
      localStorage.setItem('isp_usuario', JSON.stringify(data.usuario));

      router.push('/dashboard');
    } catch (err) {
      console.error(err);
      setError('Error conectando con el servidor');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-blue-700 px-8 py-7 text-white">
            <h1 className="text-3xl font-bold">Sistema ERP ISP</h1>
            <p className="text-blue-100 mt-1">
              Acceso administrativo Netcomp RF
            </p>
          </div>

          <form onSubmit={handleLogin} className="px-8 py-8 space-y-5">
            {verified && (
              <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
                Correo verificado correctamente. Ya puedes iniciar sesión.
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Correo electrónico
              </label>
              <input
                name="email"
                type="email"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 outline-none focus:ring-2 focus:ring-blue-600"
                value={form.email}
                onChange={handleChange}
                placeholder="admin@isp.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Contraseña
              </label>

              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-14 text-slate-800 outline-none focus:ring-2 focus:ring-blue-600"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="********"
                  autoComplete="current-password"
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

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-700 py-3 font-bold text-white hover:bg-blue-800 disabled:opacity-60"
            >
              {loading ? 'Ingresando...' : 'Iniciar sesión'}
            </button>

            <button
              type="button"
              onClick={() => router.push('/recuperar-password')}
              className="w-full rounded-xl border border-blue-200 bg-blue-50 py-3 font-bold text-blue-700 hover:bg-blue-100"
            >
              ¿Olvidaste tu contraseña?
            </button>

            <button
              type="button"
              onClick={() => router.push('/register')}
              className="w-full rounded-xl border border-slate-300 py-3 font-bold text-slate-700 hover:bg-slate-100"
            >
              Crear cuenta
            </button>

            <p className="text-center text-xs text-slate-500">
              Plataforma web para administración de ERP ISP
            </p>
          </form>
        </div>
      </main>
    </>
  );
}
export default function LoginPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <LoginContent />
    </Suspense>
  );
}