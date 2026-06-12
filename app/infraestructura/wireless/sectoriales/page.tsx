import WirelessListadoPage from "../../Tabla-equipo/Lista-Equipos-WIS";


export default function SectorialesWirelessPage() {
    return (
        <WirelessListadoPage
            titulo="Sectoriales WISP"
            endpoint="/mikrotik-conf/wireless/sectoriales"
        />
    );
}