'use client';

import {
    ArrowLeft,
    Bell,
    CheckCircle2,
    FileText,
    LockKeyhole,
    RefreshCw,
    Scale,
    ShieldCheck,
    UserRoundCheck,
    Wifi,
} from 'lucide-react';

import { useRouter } from 'next/navigation';
import { ReactNode } from 'react';

const FECHA_ACTUALIZACION = '21 de agosto de 2026';

export default function TerminosPrivacidadPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            {/* HEADER */}
            <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
                <div className="mx-auto flex min-h-[78px] max-w-6xl items-center gap-4 px-4 sm:px-6">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-white transition hover:border-cyan-500/40 hover:bg-slate-800"
                        aria-label="Regresar"
                    >
                        <ArrowLeft size={21} />
                    </button>

                    <div className="min-w-0 flex-1">
                        <h1 className="text-lg font-black sm:text-xl">
                            Términos y privacidad
                        </h1>

                        <p className="mt-0.5 text-xs text-slate-500">
                            Netcomp RF
                        </p>
                    </div>

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-400">
                        <ShieldCheck size={22} />
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-10">
                {/* HERO */}
                <section className="relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-slate-900 p-6 text-center shadow-2xl shadow-black/20 sm:p-10">
                    <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-500/5 blur-2xl" />

                    <div className="relative">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-400">
                            <FileText size={31} />
                        </div>

                        <h2 className="mx-auto mt-5 max-w-3xl text-2xl font-black tracking-tight sm:text-3xl">
                            Términos y condiciones de uso
                        </h2>

                        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
                            Estas condiciones explican el uso de la
                            aplicación y los servicios digitales de
                            Netcomp RF, así como el tratamiento de la
                            información del cliente.
                        </p>

                        <div className="mt-5 inline-flex rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-xs font-bold text-cyan-300">
                            Actualizado el {FECHA_ACTUALIZACION}
                        </div>
                    </div>
                </section>

                {/* SECCIONES */}
                <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <LegalSection
                        number="01"
                        icon={
                            <UserRoundCheck
                                size={22}
                                className="text-cyan-400"
                            />
                        }
                        title="Aceptación de las condiciones"
                    >
                        <Paragraph>
                            Al ingresar, registrarse o utilizar los
                            servicios digitales de Netcomp RF, el
                            cliente confirma que ha leído y acepta
                            estos términos y condiciones.
                        </Paragraph>

                        <Paragraph>
                            Si el cliente no está de acuerdo con estas
                            condiciones, puede dejar de utilizar la
                            plataforma y comunicarse con Netcomp RF
                            mediante los canales disponibles.
                        </Paragraph>
                    </LegalSection>

                    <LegalSection
                        number="02"
                        icon={
                            <Wifi
                                size={22}
                                className="text-blue-400"
                            />
                        }
                        title="Servicios disponibles"
                    >
                        <Paragraph>
                            La plataforma permite consultar información
                            relacionada con el servicio de internet,
                            mensualidades, pagos, estado del servicio,
                            soporte técnico, promociones y
                            notificaciones.
                        </Paragraph>

                        <Paragraph>
                            Algunas funciones pueden requerir conexión
                            a internet, permisos del dispositivo o una
                            versión actualizada del sistema.
                        </Paragraph>
                    </LegalSection>

                    <LegalSection
                        number="03"
                        icon={
                            <LockKeyhole
                                size={22}
                                className="text-purple-400"
                            />
                        }
                        title="Cuenta y seguridad"
                    >
                        <Bullet text="El cliente debe proporcionar información verdadera y actualizada." />

                        <Bullet text="La contraseña y los códigos de acceso son personales y no deben compartirse." />

                        <Bullet text="El cliente debe informar a Netcomp RF si detecta un acceso no autorizado." />

                        <Bullet text="Netcomp RF puede bloquear temporalmente una cuenta cuando detecte actividad irregular o posibles riesgos de seguridad." />
                    </LegalSection>

                    <LegalSection
                        number="04"
                        icon={
                            <Scale
                                size={22}
                                className="text-yellow-400"
                            />
                        }
                        title="Mensualidades y pagos"
                    >
                        <Paragraph>
                            Los valores, mensualidades, fechas de
                            vencimiento y pagos mostrados corresponden
                            a la información registrada en los sistemas
                            de Netcomp RF.
                        </Paragraph>

                        <Paragraph>
                            Un pago estará confirmado cuando sea
                            validado y registrado correctamente. El
                            comprobante enviado por el cliente no
                            representa por sí solo la confirmación
                            definitiva del pago.
                        </Paragraph>

                        <Paragraph>
                            Si el cliente detecta alguna diferencia,
                            deberá comunicarse con Netcomp RF para su
                            correspondiente revisión.
                        </Paragraph>
                    </LegalSection>

                    <LegalSection
                        number="05"
                        icon={
                            <Wifi
                                size={22}
                                className="text-red-400"
                            />
                        }
                        title="Suspensión y reactivación"
                    >
                        <Paragraph>
                            El servicio puede ser suspendido por
                            valores vencidos, incumplimiento de las
                            condiciones contratadas, requerimientos
                            técnicos, seguridad de la red o terminación
                            del servicio.
                        </Paragraph>

                        <Paragraph>
                            La reactivación temporal, cuando esté
                            disponible, será una facilidad excepcional.
                            Su utilización no elimina la obligación de
                            pagar los valores pendientes ni garantiza
                            una reactivación permanente.
                        </Paragraph>
                    </LegalSection>

                    <LegalSection
                        number="06"
                        icon={
                            <ShieldCheck
                                size={22}
                                className="text-emerald-400"
                            />
                        }
                        title="Privacidad y datos personales"
                    >
                        <Paragraph>
                            Netcomp RF podrá tratar los datos necesarios
                            para identificar al cliente, administrar su
                            servicio, registrar pagos, atender
                            solicitudes de soporte y enviar
                            comunicaciones relacionadas con su cuenta.
                        </Paragraph>

                        <Bullet text="Datos de identificación y contacto." />
                        <Bullet text="Información del servicio contratado." />
                        <Bullet text="Historial de mensualidades y pagos." />
                        <Bullet text="Solicitudes y conversaciones de soporte." />
                        <Bullet text="Identificadores del dispositivo utilizados para notificaciones." />
                        <Bullet text="Información técnica necesaria para el funcionamiento y seguridad de la plataforma." />
                    </LegalSection>

                    <LegalSection
                        number="07"
                        icon={
                            <Bell
                                size={22}
                                className="text-cyan-400"
                            />
                        }
                        title="Notificaciones"
                    >
                        <Paragraph>
                            Con autorización del cliente, Netcomp RF
                            podrá enviar recordatorios de
                            mensualidades, pagos, suspensión,
                            reactivación, soporte, visitas técnicas,
                            promociones y avisos generales.
                        </Paragraph>

                        <Paragraph>
                            El cliente podrá gestionar las
                            notificaciones mediante las opciones
                            disponibles en la aplicación o plataforma.
                        </Paragraph>
                    </LegalSection>

                    <LegalSection
                        number="08"
                        icon={
                            <FileText
                                size={22}
                                className="text-blue-400"
                            />
                        }
                        title="Uso adecuado de la plataforma"
                    >
                        <Bullet text="No intentar acceder a cuentas o información perteneciente a otros clientes." />
                        <Bullet text="No alterar, copiar o interferir con el funcionamiento de la plataforma." />
                        <Bullet text="No utilizar los servicios para actividades ilegales o fraudulentas." />
                        <Bullet text="No enviar comprobantes falsos ni información manipulada." />
                        <Bullet text="No abusar de los mecanismos de reactivación, soporte o notificaciones." />
                    </LegalSection>

                    <LegalSection
                        number="09"
                        icon={
                            <Scale
                                size={22}
                                className="text-slate-400"
                            />
                        }
                        title="Disponibilidad y responsabilidad"
                    >
                        <Paragraph>
                            Netcomp RF procura mantener sus sistemas
                            disponibles y actualizados, pero pueden
                            presentarse interrupciones debido a
                            mantenimiento, fallas de conectividad,
                            actualizaciones o causas externas.
                        </Paragraph>

                        <Paragraph>
                            La plataforma constituye un canal
                            complementario de atención. Una falla
                            temporal del sistema no modifica las
                            obligaciones relacionadas con el servicio
                            contratado.
                        </Paragraph>
                    </LegalSection>

                    <LegalSection
                        number="10"
                        icon={
                            <RefreshCw
                                size={22}
                                className="text-purple-400"
                            />
                        }
                        title="Modificaciones"
                    >
                        <Paragraph>
                            Netcomp RF podrá actualizar estas
                            condiciones cuando incorpore nuevas
                            funciones, cambien sus procesos o resulte
                            necesario ajustar las medidas de seguridad
                            y privacidad.
                        </Paragraph>

                        <Paragraph>
                            La fecha de la última actualización se
                            mostrará en la parte superior de esta
                            página.
                        </Paragraph>
                    </LegalSection>
                </div>

                {/* SOPORTE */}
                <section className="mt-6 rounded-3xl border border-blue-500/20 bg-blue-500/5 p-6 text-center sm:p-8">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-400">
                        <ShieldCheck size={27} />
                    </div>

                    <h3 className="mt-4 text-xl font-black">
                        ¿Tienes alguna pregunta?
                    </h3>

                    <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-400">
                        Puedes comunicarte con Netcomp RF mediante
                        nuestros canales de soporte para solicitar
                        información adicional.
                    </p>

                    <button
                        type="button"
                        onClick={() => router.push('/soporte')}
                        className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
                    >
                        Ir a soporte
                    </button>
                </section>

                {/* ACEPTACIÓN */}
                <div className="mt-4 flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                    <CheckCircle2
                        size={21}
                        className="mt-0.5 shrink-0 text-emerald-400"
                    />

                    <p className="text-sm leading-6 text-slate-300">
                        Al continuar utilizando los servicios
                        digitales de Netcomp RF, confirmas que conoces
                        estas condiciones.
                    </p>
                </div>

                <footer className="py-8 text-center text-xs text-slate-600">
                    Netcomp RF S.A.S. · Esmeraldas, Ecuador
                </footer>
            </main>
        </div>
    );
}

function LegalSection({
    number,
    icon,
    title,
    children,
}: {
    number: string;
    icon: ReactNode;
    title: string;
    children: ReactNode;
}) {
    return (
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:border-slate-700">
            <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-800">
                    {icon}
                </div>

                <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                        Sección {number}
                    </p>

                    <h2 className="mt-1 text-base font-black text-white">
                        {title}
                    </h2>
                </div>
            </div>

            <div className="mt-5">
                {children}
            </div>
        </section>
    );
}

function Paragraph({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <p className="mb-3 text-sm leading-6 text-slate-300 last:mb-0">
            {children}
        </p>
    );
}

function Bullet({
    text,
}: {
    text: string;
}) {
    return (
        <div className="mb-3 flex items-start gap-3 last:mb-0">
            <div className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />

            <p className="text-sm leading-6 text-slate-300">
                {text}
            </p>
        </div>
    );
}