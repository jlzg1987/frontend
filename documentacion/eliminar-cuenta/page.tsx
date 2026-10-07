'use client';

import Link from 'next/link';
import { Mail, ShieldCheck, Trash2 } from 'lucide-react';

export default function EliminarCuentaPage() {
    return (
        <main className="min-h-screen bg-slate-950 text-slate-100">
            <section className="border-b border-red-500/20">
                <div className="mx-auto max-w-5xl px-6 py-10">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">NetcomRF</p>
                    <h1 className="mt-2 text-3xl font-black md:text-5xl">Eliminación de cuenta y datos</h1>
                    <p className="mt-4 max-w-3xl text-slate-400">
                        En esta página puedes conocer cómo solicitar la eliminación de tu cuenta de NetcomRF
                        y de los datos personales asociados.
                    </p>
                </div>
            </section>

            <section className="mx-auto max-w-5xl space-y-6 px-6 py-10">
                <Card icon={<Trash2 className="h-6 w-6 text-red-300" />} titulo="Cómo solicitar la eliminación">
                    <p>
                        El titular de la cuenta puede solicitar su eliminación utilizando los canales oficiales
                        de soporte de NetcomRF. Para proteger tu información, antes de procesar la solicitud
                        podremos pedirte datos que permitan verificar que eres el titular de la cuenta.
                    </p>
                    <ol className="mt-4 list-decimal space-y-2 pl-6">
                        <li>Comunícate con el soporte oficial de NetcomRF.</li>
                        <li>Indica que deseas eliminar tu cuenta y los datos asociados.</li>
                        <li>Proporciona los datos necesarios para verificar la titularidad de la cuenta.</li>
                        <li>Una vez validada la solicitud, NetcomRF procesará la eliminación correspondiente.</li>
                    </ol>
                </Card>

                <Card icon={<ShieldCheck className="h-6 w-6 text-cyan-300" />} titulo="Qué información puede eliminarse">
                    <p>
                        Se eliminarán o anonimizarán los datos de la cuenta que ya no sean necesarios para
                        prestar el servicio ni deban conservarse por obligación legal.
                    </p>
                    <ul className="mt-4 list-disc space-y-2 pl-6">
                        <li>Datos del perfil de usuario que puedan ser eliminados legalmente.</li>
                        <li>Datos de acceso o preferencias vinculados exclusivamente a la cuenta.</li>
                        <li>Información personal que no deba conservarse por obligaciones contractuales o legales.</li>
                    </ul>
                </Card>

                <Card icon={<ShieldCheck className="h-6 w-6 text-amber-300" />} titulo="Datos que pueden conservarse">
                    <p>
                        Algunos registros pueden conservarse durante el tiempo exigido por la normativa aplicable,
                        incluso después de cerrar la cuenta. Esto puede incluir facturas, comprobantes de pago,
                        registros tributarios, información contractual, auditoría, prevención de fraude o datos
                        necesarios para atender obligaciones legales.
                    </p>
                </Card>

                <Card icon={<Mail className="h-6 w-6 text-emerald-300" />} titulo="Canales de solicitud">
                    <p>
                        Puedes presentar tu solicitud mediante los canales oficiales de soporte publicados por
                        NetcomRF en su aplicación y sitio web. Incluye en tu solicitud tu nombre, número de
                        identificación y un medio de contacto para validar la titularidad.
                    </p>
                </Card>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 text-sm text-slate-400">
                    La eliminación de una cuenta puede afectar el acceso a servicios contratados, historial,
                    facturas y funciones de la aplicación. Si existe un servicio activo, NetcomRF podrá requerir
                    que primero se complete el proceso contractual correspondiente.
                </div>

                <div className="flex flex-wrap gap-3">
                    <Link href="/documentacion/politica-privacidad" className="rounded-xl bg-cyan-600 px-5 py-3 font-bold text-white hover:bg-cyan-500">
                        Política de privacidad
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
