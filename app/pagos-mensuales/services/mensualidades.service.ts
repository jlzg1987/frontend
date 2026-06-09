// app/services/mensualidades.service.ts

import { API_BASE, getToken } from "@/src/lib/api";



function headers() {
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
    };
}

export async function listarMensualidadesPendientes() {
    const res = await fetch(`${API_BASE}/mensualidades/pendientes`, {
        headers: headers(),
    });

    return await res.json();
}

export async function generarMensualidadesMesActual() {
    const res = await fetch(`${API_BASE}/mensualidades/generar-mes-actual`, {
        method: 'POST',
        headers: headers(),
    });

    return await res.json();
}

export async function marcarMensualidadesVencidas() {
    const res = await fetch(`${API_BASE}/mensualidades/marcar-vencidas`, {
        method: 'POST',
        headers: headers(),
    });

    return await res.json();
}

export async function procesarCortesAutomaticos() {
    const res = await fetch(`${API_BASE}/mensualidades/procesar-cortes`, {
        method: 'POST',
        headers: headers(),
    });

    return await res.json();
}

export async function registrarPagoMensualidad(data: any) {
    const res = await fetch(`${API_BASE}/mensualidades/registrar-pago`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(data),
    });

    return await res.json();
}