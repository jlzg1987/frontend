import WirelessListadoPage from "../../Tabla-equipo/Lista-Equipos-WIS";


export default function EnlacesWirelessPage() {
    return (
        <WirelessListadoPage
            titulo="Enlaces Wireless"
            endpoint="/mikrotik-conf/wireless/enlaces"
        />
    );
}