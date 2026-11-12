import Image from "next/image";
import styles from "./BeneficiosNetcomp.module.css";

const beneficios = [
  {
    titulo: "Soporte local",
    descripcion: "Acompañamiento cercano para ayudarte con tus servicios de conectividad y tecnología.",
    imagen: "/beneficios/soporte-local.webp",
    enlace: "#contacto",
    accion: "Solicitar soporte",
    tono: "cyan",
  },
  {
    titulo: "Instalación rápida",
    descripcion: "Coordinamos la activación de tu servicio según la factibilidad técnica de tu zona.",
    imagen: "/beneficios/instalacion.webp",
    enlace: "#cobertura",
    accion: "Consultar cobertura",
    tono: "green",
  },
  {
    titulo: "Atención personalizada",
    descripcion: "Escuchamos tus necesidades y te orientamos para elegir la solución adecuada.",
    imagen: "/beneficios/atencion.webp",
    enlace: "#contacto",
    accion: "Hablar con nosotros",
    tono: "violet",
  },
  {
    titulo: "Soluciones a medida",
    descripcion: "Creamos sistemas web, aplicaciones y herramientas empresariales adaptadas a tu operación.",
    imagen: "/beneficios/soluciones.webp",
    enlace: "#software",
    accion: "Ver nuestro software",
    tono: "amber",
  },
] as const;

export default function BeneficiosNetcomp() {
  return (
    <section aria-labelledby="beneficios-netcomp-titulo" className={styles.section}>
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.inner}>
        <p className={styles.eyebrow}>CERCANÍA · TECNOLOGÍA · CONFIANZA</p>
        <h2 id="beneficios-netcomp-titulo" className={styles.heading}>
          ¿Por qué elegir <span>Netcomp?</span>
        </h2>
        <p className={styles.intro}>
          Conectividad, atención y desarrollo tecnológico pensados para tu hogar o negocio.
        </p>
        <div className={styles.grid}>
          {beneficios.map((beneficio, indice) => (
            <a
              key={beneficio.titulo}
              href={beneficio.enlace}
              className={`${styles.card} ${styles[beneficio.tono]}`}
              style={{ animationDelay: `${indice * 100}ms` }}
              aria-label={`${beneficio.titulo}: ${beneficio.accion}`}
            >
              <div className={styles.visual}>
                <Image
                  src={beneficio.imagen}
                  alt={`Ilustración de ${beneficio.titulo.toLowerCase()}`}
                  width={385}
                  height={195}
                  className={styles.illustration}
                  sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 25vw"
                />
              </div>
              <div className={styles.body}>
                <h3>{beneficio.titulo}</h3>
                <p>{beneficio.descripcion}</p>
                <span className={styles.link}>{beneficio.accion}<span aria-hidden="true"> ↗</span></span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
