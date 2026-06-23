"use client";

import { Suspense } from "react";
import PagoPayphoneContenido from "./PagoPayphoneContenido";

export default function PagoPayphonePage() {
    return (
        <Suspense fallback={<div className="p-6 text-white">Cargando pago...</div>}>
            <PagoPayphoneContenido />
        </Suspense>
    );
}