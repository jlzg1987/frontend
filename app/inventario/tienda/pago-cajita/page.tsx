"use client";

import { Suspense } from "react";
import PagoCajitaContenido from "./PagoCajitaContenido";

export default function PagoCajitaPage() {
    return (
        <Suspense fallback={<div className="p-6 text-white">Cargando pago...</div>}>
            <PagoCajitaContenido />
        </Suspense>
    );
}