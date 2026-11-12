import styles from "./HeroNetcomp.module.css";

const areas = [
  { label: "Internet y fibra óptica", icon: "◉", target: "#cobertura", accent: "cyan" },
  { label: "Cámaras de seguridad", icon: "▣", target: "#servicios", accent: "sky" },
  { label: "Software y aplicaciones", icon: "</>", target: "#software", accent: "violet" },
  { label: "POS · ERP · CRM", icon: "▤", target: "#software", accent: "lime" },
  { label: "Paneles solares", icon: "☀", target: "#servicios", accent: "amber" },
  { label: "Tienda online", icon: "▦", target: "#tienda", accent: "pink" },
];

export default function HeroNetcomp() {
  return (
    <section className={styles.hero} aria-labelledby="netcomp-hero-title">
      <div className={styles.halo} aria-hidden="true" />
      <div className={styles.inner}>
        <div className={styles.content}>
          <p className={styles.eyebrow}><span className={styles.dot} /> NETCOMP RF S.A.S. · TELECOMUNICACIONES Y SOFTWARE</p>
          <h1 id="netcomp-hero-title" className={styles.heading}>
            Soluciones tecnológicas para <span>hogares y empresas.</span>
          </h1>
          <p className={styles.subtitle}>
            Conectividad, seguridad y desarrollo de software en un solo lugar.
            Tecnología que impulsa tu hogar, negocio o institución.
          </p>
          <div className={styles.services} aria-label="Explora nuestras soluciones">
            {areas.map((area) => (
              <a key={area.label} href={area.target} className={`${styles.service} ${styles[area.accent]}`}>
                <span className={styles.serviceIcon} aria-hidden="true">{area.icon}</span>
                <span>{area.label}</span>
              </a>
            ))}
          </div>
          <div className={styles.actions}>
            <a href="https://wa.me/593988899116?text=Hola%20Netcomp%20RF%2C%20deseo%20informaci%C3%B3n%20sobre%20sus%20servicios." target="_blank" rel="noopener noreferrer" className={styles.primary}>Solicitar servicio <span aria-hidden="true">↗</span></a>
            <a href="/inventario/tienda" className={styles.secondary}>Visitar tienda online <span aria-hidden="true">↗</span></a>
            <a href="#servicios" className={styles.tertiary}>Ver servicios <span aria-hidden="true">↓</span></a>
          </div>
        </div>
        <div className={styles.visual} aria-label="Hogar conectado, infraestructura de telecomunicaciones y soluciones empresariales">
          <div className={styles.orbit} aria-hidden="true" />
          <div className={styles.imageFrame}>
            <img src="/hero/netcomp-tecnologia.png" alt="Casa inteligente, edificios conectados, torre de telecomunicaciones, router, cámara, panel solar y sistemas empresariales" className={styles.image} decoding="async" fetchPriority="high" />
          </div>
          <div className={styles.status}><span className={styles.statusDot} /> Conectamos personas y empresas</div>
          <div className={styles.pill}>Internet <span>+</span> Desarrollo <span>+</span> Seguridad</div>
        </div>
      </div>
      <div className={styles.bottomGlow} aria-hidden="true" />
    </section>
  );
}
