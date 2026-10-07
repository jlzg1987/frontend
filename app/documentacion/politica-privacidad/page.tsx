'use client';

import Link from 'next/link';

export default function PoliticaPrivacidadPage() {
    const fechaActualizacion = '6 de octubre de 2026';

    return (
        <main className="min-h-screen bg-slate-950 text-slate-100">
            <section className="border-b border-cyan-500/20 bg-slate-950">
                <div className="mx-auto max-w-5xl px-6 py-10">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
                        NetcomRF
                    </p>
                    <h1 className="mt-2 text-3xl font-black md:text-5xl">
                        Política de Privacidad
                    </h1>
                    <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-400 md:text-base">
                        Esta Política de Privacidad explica cómo NetcomRF recopila, utiliza,
                        protege y trata la información de los usuarios que utilizan nuestros
                        servicios web, aplicaciones móviles y plataformas digitales.
                    </p>
                    <p className="mt-3 text-xs text-slate-500">
                        Última actualización: {fechaActualizacion}
                    </p>
                </div>
            </section>

            <section className="mx-auto max-w-5xl px-6 py-10">
                <div className="space-y-6">
                    <Bloque titulo="1. Responsable del tratamiento">
                        <p>
                            NetcomRF es responsable del tratamiento de los datos personales
                            recopilados a través de sus plataformas digitales y servicios
                            relacionados con la prestación de servicios de Internet,
                            administración de clientes, facturación, pagos, soporte y
                            notificaciones.
                        </p>
                    </Bloque>

                    <Bloque titulo="2. Información que podemos recopilar">
                        <p>Dependiendo del servicio utilizado, podemos tratar información como:</p>
                        <ul className="mt-3 list-disc space-y-2 pl-6">
                            <li>Nombre y apellidos.</li>
                            <li>Número de cédula o documento de identificación.</li>
                            <li>Teléfono y correo electrónico.</li>
                            <li>Dirección de instalación o domicilio relacionado con el servicio.</li>
                            <li>Información del contrato y plan de Internet contratado.</li>
                            <li>Estado del servicio, mensualidades, facturas y pagos registrados.</li>
                            <li>Referencias de pago o comprobantes cuando el usuario los proporcione.</li>
                            <li>
                                Información técnica necesaria para prestar el servicio, como datos
                                del dispositivo, dirección IP, registros de acceso y datos de red.
                            </li>
                            <li>
                                Información adicional que el usuario entregue voluntariamente al
                                comunicarse con soporte.
                            </li>
                        </ul>
                    </Bloque>

                    <Bloque titulo="3. Finalidad del uso de los datos">
                        <p>La información puede utilizarse para:</p>
                        <ul className="mt-3 list-disc space-y-2 pl-6">
                            <li>Crear y administrar la cuenta del usuario.</li>
                            <li>Gestionar contratos, planes y servicios de Internet.</li>
                            <li>Registrar pagos, mensualidades y movimientos relacionados.</li>
                            <li>Emitir facturas o comprobantes cuando corresponda.</li>
                            <li>Mostrar el estado de cuenta y del servicio.</li>
                            <li>Atender solicitudes de soporte.</li>
                            <li>Enviar avisos relacionados con pagos, cortes, reconexiones o novedades del servicio.</li>
                            <li>Prevenir fraudes, accesos no autorizados y usos indebidos.</li>
                            <li>Mejorar el funcionamiento, seguridad y rendimiento de nuestras plataformas.</li>
                            <li>Cumplir obligaciones legales y regulatorias aplicables.</li>
                        </ul>
                    </Bloque>

                    <Bloque titulo="4. Pagos y proveedores externos">
                        <p>
                            Algunos pagos pueden ser procesados mediante proveedores externos.
                            Cuando un tercero procesa el pago, la información financiera sensible
                            puede ser tratada directamente por dicho proveedor conforme a sus
                            propias políticas de privacidad y seguridad.
                        </p>
                        <p className="mt-3">
                            NetcomRF puede recibir únicamente la información necesaria para
                            identificar el resultado del pago, su referencia, monto, fecha y estado.
                        </p>
                    </Bloque>

                    <Bloque titulo="5. Compartición de información">
                        <p>
                            NetcomRF no vende los datos personales de sus usuarios. La información
                            podrá compartirse únicamente cuando sea necesario para prestar el
                            servicio, cumplir una obligación legal, procesar pagos, prestar soporte,
                            alojar infraestructura tecnológica o proteger la seguridad de la
                            plataforma.
                        </p>
                    </Bloque>

                    <Bloque titulo="6. Seguridad de la información">
                        <p>
                            Aplicamos medidas técnicas y organizativas razonables para proteger los
                            datos contra acceso no autorizado, pérdida, alteración, divulgación o
                            destrucción. Estas medidas pueden incluir autenticación, controles de
                            acceso, conexiones seguras, registro de actividad y separación de
                            permisos según el tipo de usuario.
                        </p>
                    </Bloque>

                    <Bloque titulo="7. Conservación de los datos">
                        <p>
                            Los datos se conservarán durante el tiempo necesario para mantener la
                            relación con el usuario, prestar el servicio, cumplir obligaciones
                            contables, tributarias, contractuales o legales y atender posibles
                            reclamaciones.
                        </p>
                    </Bloque>

                    <Bloque titulo="8. Datos de ubicación, cámara y archivos">
                        <p>
                            Si alguna función de la aplicación solicita permisos del dispositivo,
                            como ubicación, cámara o acceso a archivos, dichos permisos se utilizarán
                            únicamente para la función informada al usuario y cuando este otorgue su
                            autorización. NetcomRF no accede a estos permisos sin una finalidad
                            relacionada con el servicio.
                        </p>
                    </Bloque>

                    <Bloque titulo="9. Notificaciones">
                        <p>
                            La aplicación puede enviar notificaciones relacionadas con pagos,
                            facturas, estado del servicio, soporte, avisos administrativos o
                            novedades importantes. El usuario puede administrar los permisos de
                            notificaciones desde la configuración de su dispositivo.
                        </p>
                    </Bloque>

                    <Bloque titulo="10. Menores de edad">
                        <p>
                            Los servicios de NetcomRF están dirigidos principalmente a titulares de
                            contratos y usuarios autorizados. No buscamos recopilar deliberadamente
                            datos personales de menores sin la autorización correspondiente de sus
                            representantes legales.
                        </p>
                    </Bloque>

                    <Bloque titulo="11. Derechos del usuario">
                        <p>
                            El usuario puede solicitar, según corresponda y conforme a la normativa
                            aplicable, acceso, actualización, rectificación, eliminación u oposición
                            respecto de sus datos personales.
                        </p>
                    </Bloque>

                    <Bloque titulo="12. Eliminación de cuenta y datos">
                        <p>
                            Cuando la aplicación permita crear una cuenta, el usuario podrá solicitar
                            su eliminación y la eliminación de los datos asociados que no deban
                            conservarse por obligaciones legales, contractuales, tributarias,
                            contables o de seguridad.
                        </p>
                        <p className="mt-3">
                            NetcomRF habilitará un mecanismo específico para solicitar la eliminación
                            de cuenta desde sus canales oficiales y/o una página destinada a este fin.
                        </p>
                    </Bloque>

                    <Bloque titulo="13. Cambios en esta Política">
                        <p>
                            NetcomRF puede actualizar esta Política de Privacidad cuando existan
                            cambios legales, técnicos o funcionales. La versión vigente estará
                            publicada en esta misma página indicando su fecha de actualización.
                        </p>
                    </Bloque>

                    <Bloque titulo="14. Contacto">
                        <p>
                            Para consultas relacionadas con privacidad, protección de datos o
                            solicitudes sobre información personal, el usuario podrá comunicarse
                            mediante los canales oficiales de atención de NetcomRF publicados en
                            nuestra aplicación y sitio web.
                        </p>
                    </Bloque>

                    <div className="flex flex-wrap gap-3 pt-2">
                        <Link
                            href="/"
                            className="rounded-xl bg-cyan-600 px-5 py-3 font-bold text-white transition hover:bg-cyan-500"
                        >
                            Volver al inicio
                        </Link>

                        <Link
                            href="/documentacion/terminos-condiciones"
                            className="rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 font-bold text-slate-200 transition hover:border-cyan-500/60"
                        >
                            Ver términos y condiciones
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    );
}

function Bloque({
    titulo,
    children,
}: {
    titulo: string;
    children: React.ReactNode;
}) {
    return (
        <article className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg shadow-black/10">
            <h2 className="text-lg font-black text-white md:text-xl">{titulo}</h2>
            <div className="mt-3 text-sm leading-7 text-slate-300 md:text-base">
                {children}
            </div>
        </article>
    );
}
