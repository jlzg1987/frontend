import PublicidadWebPage from "./adnib-isp/publicidad/publiciadad-web/page";

export default function NetcomprfPage() {
    const servicios = [
        ["Internet residencial", "Planes para hogares con soporte técnico local."],
        ["Internet empresarial", "Conectividad estable para negocios e instituciones."],
        ["Fibra óptica FTTH", "Internet por fibra con mayor velocidad y estabilidad."],
        ["Enlaces inalámbricos", "Conexiones punto a punto y zonas rurales."],
        ["Cámaras de seguridad", "Instalación de cámaras para hogares y empresas."],
        ["Sistema cerrado CCTV", "Monitoreo, grabación y seguridad privada."],
        ["Programación web", "Páginas web, sistemas online y automatización."],
        ["Sistemas ERP", "Control de inventario, ventas, clientes y reportes."],
        ["Sistemas CRM", "Gestión de clientes, seguimiento y atención comercial."],
        ["Punto de venta", "Sistema POS para tiendas, locales y negocios."],
        ["Sistemas personalizados", "Software adaptado a las necesidades de tu empresa."],
        ["Paneles solares", "Soluciones solares para hogares, negocios y telecomunicaciones."],
        ["Tienda online", "Equipos tecnológicos, redes, cámaras y accesorios."],
    ];

    return (
        <main className="min-h-screen bg-slate-950 text-white">
            {/* HEADER */}
            <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                    <img
                        src="/netcomp-logo.png"
                        alt="Netcomp R.F. S.A.S."
                        className="h-14 w-auto rounded-xl bg-white p-2"
                    />

                    <nav className="hidden gap-6 text-sm text-slate-300 md:flex">
                        <a href="#publicidad" className="hover:text-cyan-300">Anuncios</a>
                        <a href="#servicios" className="hover:text-cyan-300">Servicios</a>
                        <a href="#cobertura" className="hover:text-cyan-300">Cobertura</a>
                        <a href="#test" className="hover:text-cyan-300">Test</a>
                        <a href="#app" className="hover:text-cyan-300">App</a>
                        <a href="#contacto" className="hover:text-cyan-300">Contacto</a>

                    </nav>

                    <a
                        href="/login"
                        className="rounded-full bg-cyan-400 px-5 py-2 text-sm font-bold text-slate-950"
                    >
                        Ingresar al sistema
                    </a>
                </div>
            </header>

            {/* HERO */}
            <section className="relative overflow-hidden px-6 py-24 text-center">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#0ea5e933,transparent_45%)]" />

                <div className="relative mx-auto max-w-5xl">
                    <p className="mb-4 text-sm font-bold uppercase tracking-[0.35em] text-cyan-300">
                        Conecta tu mundo digital
                    </p>

                    <h1 className="text-4xl font-black md:text-7xl">
                        Soluciones tecnológicas para hogares y empresas
                    </h1>

                    <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-300">
                        Internet, fibra óptica, cámaras de seguridad, sistemas web,
                        punto de venta, ERP, CRM, paneles solares y tienda online.
                    </p>

                    <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
                        <a
                            href="https://wa.me/593XXXXXXXXX"
                            target="_blank"
                            className="rounded-full bg-cyan-400 px-8 py-4 font-bold text-slate-950 shadow-lg shadow-cyan-500/30"
                        >
                            Solicitar servicio
                        </a>

                        <a
                            href="/tienda"
                            className="rounded-full bg-lime-400 px-8 py-4 font-bold text-slate-950 shadow-lg shadow-lime-500/30"
                        >
                            Visita nuestra tienda online
                        </a>

                        <a
                            href="#servicios"
                            className="rounded-full border border-white/20 px-8 py-4 font-bold text-white"
                        >
                            Ver servicios
                        </a>
                    </div>
                </div>
            </section>

            {/* PUBLICIDAD Y PROMOCIONES */}
            <section id="publicidad" className="relative overflow-hidden bg-slate-950 py-16">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-pink-500/5 to-cyan-500/5" />

                <div className="relative mx-auto max-w-7xl px-6">
                    <div className="mb-10 text-center">
                        <span className="inline-flex rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1 text-sm font-semibold text-cyan-400">
                            🔥 Novedades Netcomprf
                        </span>

                        <h2 className="mt-4 text-3xl font-black text-white md:text-5xl">
                            Promociones, anuncios y novedades
                        </h2>

                        <p className="mx-auto mt-4 max-w-3xl text-lg text-slate-400">
                            Descubre nuestras promociones especiales, nuevos servicios,
                            ampliaciones de cobertura y todas las novedades que tenemos
                            para nuestros clientes.
                        </p>
                    </div>

                    {/* Carrusel */}
                    <PublicidadWebPage />
                </div>
            </section>



            {/* SERVICIOS */}
            <section id="servicios" className="px-6 py-20">
                <h2 className="text-center text-3xl font-black md:text-5xl">
                    Nuestros servicios
                </h2>

                <p className="mx-auto mt-4 max-w-2xl text-center text-slate-400">
                    Todo lo que tu hogar, negocio o institución necesita en tecnología,
                    conectividad y seguridad.
                </p>

                <div className="mx-auto mt-12 grid max-w-7xl gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {servicios.map(([titulo, texto]) => (
                        <div
                            key={titulo}
                            className="group rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-xl transition hover:-translate-y-1 hover:border-cyan-400/50 hover:bg-cyan-400/10"
                        >
                            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/20 text-xl">
                                ✦
                            </div>

                            <h3 className="text-xl font-black text-cyan-300">
                                {titulo}
                            </h3>

                            <p className="mt-3 text-sm leading-6 text-slate-300">
                                {texto}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* BENEFICIOS */}
            <section className="bg-white/[0.04] px-6 py-20">
                <h2 className="text-center text-3xl font-black">
                    ¿Por qué elegir Netcomp?
                </h2>

                <div className="mx-auto mt-10 grid max-w-6xl gap-6 md:grid-cols-4">
                    {[
                        "Soporte local",
                        "Instalación rápida",
                        "Atención personalizada",
                        "Soluciones a medida",
                    ].map((item) => (
                        <div
                            key={item}
                            className="rounded-3xl border border-white/10 bg-slate-900 p-6 text-center font-bold"
                        >
                            {item}
                        </div>
                    ))}
                </div>
            </section>

            {/* COBERTURA */}
            <section id="cobertura" className="px-6 py-20 text-center">
                <h2 className="text-3xl font-black">Zona de cobertura</h2>

                <p className="mx-auto mt-4 max-w-2xl text-slate-300">
                    Brindamos servicio en Esmeraldas, Tachina y sectores cercanos.
                    Consulta disponibilidad para tu domicilio, negocio o institución.
                </p>
            </section>
            {/* TEST DE VELOCIDAD */}


            <section id="test" className="px-6 py-20">
                <div className="mx-auto max-w-6xl rounded-[2rem] border border-cyan-400/30 bg-cyan-400/10 p-10 text-center">
                    <p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-300">
                        Test de velocidad
                    </p>

                    <h2 className="mt-4 text-3xl font-black md:text-5xl">
                        Mide la velocidad de tu internet
                    </h2>

                    <p className="mx-auto mt-4 max-w-2xl text-slate-300">
                        Comprueba la velocidad de descarga, subida, ping y jitter desde nuestro servidor.
                        Ideal para clientes Netcomprf y usuarios que desean verificar su conexión.
                    </p>

                    <iframe
                        src="https://speed.netcomprf.com/index-classic.html"
                        className="h-[700px] w-full rounded-3xl border border-cyan-400/30"
                        style={{ marginTop: 10 }}
                        loading="lazy"
                    />

                    <a
                        href="https://speed.netcomprf.com/index-classic.html"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-8 inline-block rounded-full bg-cyan-400 px-8 py-4 font-bold text-slate-950 shadow-lg shadow-cyan-500/30"
                    >
                        Iniciar test de velocidad
                    </a>
                </div>
            </section>

            {/* DESCARGA APP */}
            <section id="app" className="px-6 py-20">
                <div className="mx-auto grid max-w-6xl items-center gap-10 rounded-[2rem] border border-lime-400/30 bg-lime-400/10 p-10 md:grid-cols-2">
                    <div>
                        <p className="text-sm font-bold uppercase tracking-[0.3em] text-lime-300">
                            Clientes Netcomprf
                        </p>

                        <h2 className="mt-4 text-3xl font-black md:text-5xl">
                            Descarga nuestra app Netcomprf
                        </h2>

                        <p className="mt-4 text-slate-300">
                            Si eres cliente nuestro, descarga la aplicación desde Play Store para
                            revisar tu servicio, consultar información y mantenerte conectado con
                            nosotros.
                        </p>

                        <a
                            href="https://play.google.com/store/apps/details?id=TU_APP_ID"
                            target="_blank"
                            className="mt-8 inline-block rounded-full bg-lime-400 px-8 py-4 font-bold text-slate-950 shadow-lg shadow-lime-500/30"
                        >
                            Descargar en Play Store
                        </a>
                    </div>

                    <div className="rounded-3xl bg-slate-950 p-8 text-center">
                        <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-[2rem] border border-white/10 bg-white/5 text-6xl">
                            📱
                        </div>

                        <p className="mt-6 text-lg font-bold text-lime-300">
                            App Netcomprf
                        </p>

                        <p className="mt-2 text-sm text-slate-400">
                            Disponible para clientes
                        </p>
                    </div>
                </div>
            </section>

            {/* CONTACTO */}
            <section id="contacto" className="px-6 py-20">
                <div className="mx-auto max-w-5xl rounded-[2rem] bg-gradient-to-br from-cyan-400 via-sky-500 to-lime-400 p-10 text-center text-slate-950">
                    <h2 className="text-3xl font-black md:text-5xl">
                        ¿Listo para conectarte?
                    </h2>

                    <p className="mx-auto mt-4 max-w-2xl font-semibold">
                        Escríbenos por WhatsApp y te ayudamos con internet,
                        cámaras, sistemas, paneles solares o soporte técnico.
                    </p>

                    <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
                        <a
                            href="https://wa.me/593XXXXXXXXX"
                            target="_blank"
                            className="rounded-full bg-slate-950 px-8 py-4 font-bold text-white"
                        >
                            Contactar por WhatsApp
                        </a>

                        <a
                            href="/login"
                            className="rounded-full bg-white px-8 py-4 font-bold text-slate-950"
                        >
                            Ingresar al sistema
                        </a>
                    </div>
                </div>
            </section>

            <footer className="border-t border-white/10 px-6 py-8 text-center text-sm text-slate-400">
                © 2026 Netcomp R.F. S.A.S. Todos los derechos reservados.
            </footer>
        </main>
    );
}