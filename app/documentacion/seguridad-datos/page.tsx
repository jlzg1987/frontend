
'use client';

import Link from 'next/link';
import { Database, KeyRound, LockKeyhole, Server, ShieldCheck } from 'lucide-react';

export default function SeguridadDatosPage() {
    return (
        <main className="min-h-screen bg-slate-950 text-slate-100">
            <section className="border-b border-cyan-500/20">
                <div className="mx-auto max-w-5xl px-6 py-10">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">NetcomRF</p>
                    <h1 className="mt-2 text-3xl font-black md:text-5xl">Seguridad y tratamiento de datos</h1>
                    <p className="mt-4 max-w-3xl text-slate-400">
                        Información sobre las principales medidas empleadas por NetcomRF para proteger
                        los datos utilizados en nuestros servicios web y aplicaciones.
                    </p>
                </div>
            </section>

            <section className="mx-auto max-w-5xl space-y-6 px-6 py-10">
                <Card icon={<ShieldCheck className="h-6 w-6 text-cyan-300" />} titulo="Protección de la información">
                    <p>
                        NetcomRF aplica medidas técnicas y organizativas destinadas a reducir riesgos de acceso
                        no autorizado, modificación, pérdida, divulgación o uso indebido de la información.
                    </p>
                </Card>

                <Card icon={<KeyRound className="h-6 w-6 text-violet-300" />} titulo="Autenticación y permisos">
                    <p>
                        El acceso a las funciones privadas de la plataforma requiere autenticación. Las funciones
                        disponibles pueden variar según el tipo de usuario y los permisos asignados dentro del sistema.
                    </p>
                </Card>

                <Card icon={<LockKeyhole className="h-6 w-6 text-emerald-300" />} titulo="Transmisión de datos">
                    <p>
                        Cuando corresponde, la información intercambiada entre el dispositivo del usuario y los
                        servicios de NetcomRF se transmite mediante conexiones protegidas. El usuario debe evitar
                        compartir sus credenciales y mantener protegido su dispositivo.
                    </p>
                </Card>

                <Card icon={<Server className="h-6 w-6 text-blue-300" />} titulo="Infraestructura y acceso">
                    <p>
                        Los sistemas y bases de datos utilizados por NetcomRF cuentan con controles de acceso
                        orientados a limitar el tratamiento de información únicamente a servicios y usuarios autorizados.
                    </p>
                </Card>

                <Card icon={<Database className="h-6 w-6 text-amber-300" />} titulo="Conservación y respaldo">
                    <p>
                        La información puede conservarse mientras sea necesaria para prestar el servicio o cumplir
                        obligaciones legales, contables, tributarias, contractuales y de seguridad. NetcomRF puede
                        utilizar mecanismos de respaldo y recuperación para proteger la continuidad de sus sistemas.
                    </p>
                </Card>

                <Card icon={<ShieldCheck className="h-6 w-6 text-rose-300" />} titulo="Incidentes de seguridad">
                    <p>
                        Si NetcomRF identifica un incidente que pueda comprometer información personal, realizará
                        las acciones razonables necesarias para contenerlo, investigarlo y aplicar las medidas que
                        correspondan conforme a la normativa aplicable.
                    </p>
                </Card>

                <Card icon={<ShieldCheck className="h-6 w-6 text-cyan-300" />} titulo="Responsabilidad del usuario">
                    <ul className="list-disc space-y-2 pl-6">
                        <li>No compartir contraseñas o códigos de acceso.</li>
                        <li>Utilizar credenciales seguras y mantener protegido el dispositivo.</li>
                        <li>Cerrar sesión en dispositivos compartidos.</li>
                        <li>Informar a NetcomRF si detecta actividad sospechosa en su cuenta.</li>
                    </ul>
                </Card>

                <div className="flex flex-wrap gap-3">
                    <Link href="/documentacion/politica-privacidad" className="rounded-xl bg-cyan-600 px-5 py-3 font-bold text-white hover:bg-cyan-500">
                        Política de privacidad
                    </Link>
                    <Link href="/documentacion/eliminar-cuenta" className="rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 font-bold hover:border-cyan-500/60">
                        Eliminación de cuenta
                    </Link>
                    <Link href="/" className="rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 font-bold hover:border-cyan-500/60">
                        Volver al inicio
                    </Link>
                </div>
            </section>
        </main>
    );
}

function Card({ icon, titulo, children }: { icon: React.ReactNode; titulo: string; children: React.ReactNode }) {
    return (
        <article className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
            <div className="flex items-center gap-3">
                {icon}
                <h2 className="text-xl font-black">{titulo}</h2>
            </div>
            <div className="mt-4 text-sm leading-7 text-slate-300 md:text-base">{children}</div>
        </article>
    );
}
