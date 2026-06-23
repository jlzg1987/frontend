"use client";

import { Suspense } from "react";
import PedidoExitosoContenido from "../PedidoExitosoContenido";

export default function PedidoExitosoPage() {
    return (
        <Suspense fallback={<div className="p-6">Cargando...</div>}>
            <PedidoExitosoContenido />
        </Suspense>
    );
}