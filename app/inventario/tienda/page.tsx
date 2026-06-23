"use client";

import { useEffect, useMemo, useState } from "react";
import {
    Search,
    ShoppingCart,
    X,
    MessageCircle,
    Sparkles,
    Package,
    Tag,
    Layers,
    Plus,
    Minus,
    Trash2,
} from "lucide-react";
import { API_BASE } from "@/src/lib/api";
import { useRouter } from "next/navigation";

type Producto = {
    productoId: number;
    empresaId: number;
    tipo_item: "PRODUCTO" | "SERVICIO";
    codigo: string;
    nombre: string;
    descripcion: string | null;
    imagen_url: string | null;
    categoria: string | null;
    stock: number;
    precio_venta: string | number;
    aplica_iva: "SI" | "NO";
};

type CarritoItem = {
    producto: Producto;
    cantidad: number;
};

type Rareza = "COMMON" | "RARE" | "EPIC" | "LEGENDARY";

function precioNumero(valor: string | number) {
    return Number(valor || 0);
}

function obtenerRareza(precio: number): Rareza {
    if (precio >= 300) return "LEGENDARY";
    if (precio >= 100) return "EPIC";
    if (precio >= 50) return "RARE";
    return "COMMON";
}

function clasesRareza(rareza: Rareza) {
    switch (rareza) {
        case "LEGENDARY":
            return {
                borde: "border-yellow-300/70",
                fondo: "from-yellow-400/20 via-orange-500/10 to-cyan-400/10",
                badge: "bg-yellow-300 text-slate-950",
                glow: "shadow-yellow-400/20",
            };
        case "EPIC":
            return {
                borde: "border-fuchsia-400/70",
                fondo: "from-fuchsia-500/20 via-purple-500/10 to-cyan-400/10",
                badge: "bg-fuchsia-400 text-white",
                glow: "shadow-fuchsia-500/20",
            };
        case "RARE":
            return {
                borde: "border-cyan-400/70",
                fondo: "from-cyan-500/20 via-sky-500/10 to-blue-500/10",
                badge: "bg-cyan-400 text-slate-950",
                glow: "shadow-cyan-500/20",
            };
        default:
            return {
                borde: "border-slate-600/70",
                fondo: "from-slate-700/30 via-slate-800/30 to-slate-950",
                badge: "bg-slate-500 text-white",
                glow: "shadow-slate-900/30",
            };
    }
}

export default function TiendaNetcompPage({
    onAbrirAbrirCArrito
}: {
    onAbrirAbrirCArrito: (CarritoId: string) => void;
}) {

    const router = useRouter();
    const [productos, setProductos] = useState<Producto[]>([]);
    const [categorias, setCategorias] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [buscar, setBuscar] = useState("");
    const [categoria, setCategoria] = useState("TODOS");
    const [tipoItem, setTipoItem] = useState("TODOS");
    const [soloStock, setSoloStock] = useState(true);
    const [productoModal, setProductoModal] = useState<Producto | null>(null);

    const [carrito, setCarrito] = useState<CarritoItem[]>([]);
    const [carritoAbierto, setCarritoAbierto] = useState(false);

    const [clienteNombre, setClienteNombre] = useState("");
    const [clienteTelefono, setClienteTelefono] = useState("");
    const [clienteEmail, setClienteEmail] = useState("");
    const [clienteDireccion, setClienteDireccion] = useState("");
    const [observacion, setObservacion] = useState("");
    const [creandoPedido, setCreandoPedido] = useState(false);
    const [modalPedido, setModalPedido] = useState(false);
    const [pedidoActivoId, setPedidoActivoId] = useState<string | null>(null);

    const [pedidoPendienteCargado, setPedidoPendienteCargado] = useState(false);

    async function cargarDatos() {
        try {
            setLoading(true);

            const params = new URLSearchParams();

            if (buscar.trim()) params.append("buscar", buscar.trim());
            if (categoria !== "TODOS") params.append("categoria", categoria);
            if (tipoItem !== "TODOS") params.append("tipo_item", tipoItem);
            if (soloStock) params.append("soloStock", "SI");

            const [resProductos, resCategorias] = await Promise.all([
                fetch(`${API_BASE}/tienda-publica/productos?${params.toString()}`),
                fetch(`${API_BASE}/tienda-publica/categorias`),
            ]);

            const dataProductos = await resProductos.json();
            const dataCategorias = await resCategorias.json();

            setProductos(dataProductos.productos || []);
            setCategorias(dataCategorias.categorias || []);
        } catch (error) {
            console.error("Error cargando tienda:", error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        const t = setTimeout(() => {
            cargarDatos();
        }, 350);

        return () => clearTimeout(t);
    }, [buscar, categoria, tipoItem, soloStock]);

    useEffect(() => {
        const carritoGuardado = localStorage.getItem("tienda_carrito");
        const pedidoGuardado = localStorage.getItem("tienda_pedido_activo");

        if (carritoGuardado) {
            try {
                setCarrito(JSON.parse(carritoGuardado));
            } catch {
                localStorage.removeItem("tienda_carrito");
            }
        }

        if (pedidoGuardado) {
            setPedidoActivoId(pedidoGuardado);
        }
    }, []);
    useEffect(() => {
        localStorage.setItem("tienda_carrito", JSON.stringify(carrito));
    }, [carrito]);

    useEffect(() => {
        const pedidoGuardado = localStorage.getItem("tienda_pedido_activo");

        if (pedidoGuardado) {
            setPedidoActivoId(pedidoGuardado);
            cargarPedidoPendienteEnCarrito(pedidoGuardado)
        }
    }, []);

    const totalProductos = useMemo(() => productos.length, [productos]);

    const totalItemsCarrito = useMemo(() => {
        return carrito.reduce((acc, item) => acc + item.cantidad, 0);
    }, [carrito]);

    const totalCarrito = useMemo(() => {
        return carrito.reduce((acc, item) => {
            return acc + precioNumero(item.producto.precio_venta) * item.cantidad;
        }, 0);
    }, [carrito]);


    function agregarAlCarrito(producto: Producto) {
        if (producto.tipo_item === "PRODUCTO" && producto.stock <= 0) {
            alert("Este producto no tiene stock disponible.");
            return;
        }

        setCarrito((prev) => {
            let nuevoCarrito: CarritoItem[];

            const existe = prev.find(
                (item) => item.producto.productoId === producto.productoId
            );

            if (existe) {
                if (
                    producto.tipo_item === "PRODUCTO" &&
                    existe.cantidad + 1 > producto.stock
                ) {
                    alert("No puedes agregar más unidades que el stock disponible.");
                    return prev;
                }

                nuevoCarrito = prev.map((item) =>
                    item.producto.productoId === producto.productoId
                        ? { ...item, cantidad: item.cantidad + 1 }
                        : item
                );
            } else {
                nuevoCarrito = [...prev, { producto, cantidad: 1 }];
            }

            localStorage.setItem("tienda_carrito", JSON.stringify(nuevoCarrito));

            const pedidoGuardado = localStorage.getItem("tienda_pedido_activo");


            return nuevoCarrito;
        });
    }


    function aumentarCantidad(productoId: number) {
        setCarrito((prev) => {
            const nuevoCarrito = prev.map((item) => {
                if (item.producto.productoId !== productoId) return item;

                if (
                    item.producto.tipo_item === "PRODUCTO" &&
                    item.cantidad + 1 > item.producto.stock
                ) {
                    alert("No hay más stock disponible.");
                    return item;
                }

                return {
                    ...item,
                    cantidad: item.cantidad + 1,
                };
            });

            localStorage.setItem("tienda_carrito", JSON.stringify(nuevoCarrito));

            const pedidoGuardado = localStorage.getItem("tienda_pedido_activo");
            if (pedidoGuardado) {
                actualizarPedidoPendiente(nuevoCarrito);
            }

            return nuevoCarrito;
        });
    }

    function disminuirCantidad(productoId: number) {
        setCarrito((prev) => {
            const nuevoCarrito = prev
                .map((item) =>
                    item.producto.productoId === productoId
                        ? {
                            ...item,
                            cantidad: item.cantidad - 1,
                        }
                        : item
                )
                .filter((item) => item.cantidad > 0);

            localStorage.setItem("tienda_carrito", JSON.stringify(nuevoCarrito));

            const pedidoGuardado = localStorage.getItem("tienda_pedido_activo");
            if (pedidoGuardado && nuevoCarrito.length > 0) {
                actualizarPedidoPendiente(nuevoCarrito);
            }

            return nuevoCarrito;
        });
    }

    function eliminarDelCarrito(productoId: number) {
        setCarrito((prev) => {
            const nuevoCarrito = prev.filter(
                (item) => item.producto.productoId !== productoId
            );

            localStorage.setItem("tienda_carrito", JSON.stringify(nuevoCarrito));

            const pedidoGuardado = localStorage.getItem("tienda_pedido_activo");
            if (pedidoGuardado && nuevoCarrito.length > 0) {
                actualizarPedidoPendiente(nuevoCarrito);
            }

            return nuevoCarrito;
        });
    }

    async function anularPedidoPendiente() {
        try {
            const pedidoGuardado = localStorage.getItem("tienda_pedido_activo");

            if (!pedidoGuardado) {
                vaciarCarrito();
                return;
            }

            const confirmar = confirm(
                "¿Seguro que deseas anular este pedido pendiente y vaciar el carrito?"
            );

            if (!confirmar) return;

            const res = await fetch(
                `${API_BASE}/tienda-pedidos/${pedidoGuardado}/anular`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ empresaId: 1 }),
                }
            );

            const data = await res.json();

            if (!res.ok || !data.ok) {
                throw new Error(data.mensaje || "No se pudo anular el pedido.");
            }

            localStorage.removeItem("tienda_pedido_activo");
            localStorage.removeItem("tienda_carrito");

            setPedidoActivoId(null);
            setCarrito([]);
            setCarritoAbierto(false);
            setModalPedido(false);

            alert("Pedido anulado correctamente.");
        } catch (error: any) {
            console.error("Error anularPedidoPendiente:", error);
            alert(error.message || "Error anulando pedido.");
        }
    }

    function vaciarCarrito() {
        setCarrito([]);
    }

    function whatsappProducto(producto: Producto) {
        const texto = `Hola Netcomp RF, quiero información para comprar este producto:

Producto: ${producto.nombre}
Código: ${producto.codigo || "N/A"}
Categoría: ${producto.categoria || "N/A"}
Precio: $${precioNumero(producto.precio_venta).toFixed(2)}

¿Está disponible?`;

        return `https://wa.me/593988899116?text=${encodeURIComponent(texto)}`;
    }

    function whatsappCarrito() {
        const detalle = carrito
            .map((item, index) => {
                const precio = precioNumero(item.producto.precio_venta);
                const subtotal = precio * item.cantidad;

                return `${index + 1}. ${item.producto.nombre}
Código: ${item.producto.codigo || "N/A"}
Cantidad: ${item.cantidad}
Precio: $${precio.toFixed(2)}
Subtotal: $${subtotal.toFixed(2)}`;
            })
            .join("\n\n");

        const texto = `Hola Netcomp RF, quiero comprar estos productos:

${detalle}

TOTAL: $${totalCarrito.toFixed(2)}

¿Me ayudan con la compra?`;

        return `https://wa.me/593988899116?text=${encodeURIComponent(texto)}`;
    }

    async function crearPedido() {
        try {
            if (carrito.length === 0) {
                alert("El carrito está vacío.");
                return;
            }

            if (!clienteNombre.trim()) {
                alert("Ingrese el nombre del cliente.");
                return;
            }

            if (!clienteTelefono.trim()) {
                alert("Ingrese el teléfono del cliente.");
                return;
            }

            setCreandoPedido(true);

            const payload = {
                empresaId: 1,
                clienteNombre,
                clienteTelefono,
                clienteEmail,
                clienteDireccion,
                observacion,
                items: carrito.map((item) => ({
                    productoId: item.producto.productoId,
                    cantidad: item.cantidad,
                })),
            };

            const res = await fetch(`${API_BASE}/tienda-pedidos`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                throw new Error(data.mensaje || "No se pudo crear el pedido.");
            }

            alert(`Pedido creado correctamente. Código: ${data.pedido.pedidoId}`);


            setClienteNombre("");
            setClienteTelefono("");
            setClienteEmail("");
            setClienteDireccion("");
            setObservacion("");

            const nuevoPedidoId = data.pedido.pedidoId;

            localStorage.setItem("tienda_pedido_activo", nuevoPedidoId);
            setPedidoActivoId(nuevoPedidoId);

            setModalPedido(false);
            setCarritoAbierto(false);
            router.push(`/inventario/tienda/${nuevoPedidoId}`);


        } catch (error: any) {
            console.error("Error crearPedido:", error);
            alert(error.message || "Error creando pedido.");
        } finally {
            setCreandoPedido(false);
        }
    }

    async function actualizarPedidoPendiente(carritoActual = carrito) {
        try {
            const pedidoGuardado = localStorage.getItem("tienda_pedido_activo");

            if (!pedidoGuardado) {
                alert("No tienes un pedido pendiente.");
                return;
            }

            if (carritoActual.length === 0) {
                alert("El carrito está vacío. Mejor anula el pedido.");
                return;
            }

            const payload = {
                empresaId: 1,
                items: carritoActual.map((item) => ({
                    productoId: item.producto.productoId,
                    cantidad: item.cantidad,
                })),
            };

            const res = await fetch(
                `${API_BASE}/tienda-pedidos/${pedidoGuardado}/items`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                }
            );

            const data = await res.json();

            if (!res.ok || !data.ok) {
                throw new Error(data.mensaje || "No se pudo actualizar el pedido.");
            }

            setPedidoActivoId(pedidoGuardado);
            alert("Pedido actualizado correctamente.");
            setCarritoAbierto(true);
        } catch (error: any) {
            console.error("Error actualizarPedidoPendiente:", error);
            alert(error.message || "Error actualizando pedido pendiente.");
        }
    }

    async function cargarPedidoPendienteEnCarrito(pedidoId: string) {
        try {
            const res = await fetch(`${API_BASE}/tienda-pedidos/${pedidoId}`);
            const data = await res.json();

            console.log("PEDIDO PENDIENTE BACKEND:", data);

            if (!res.ok || !data.ok) {
                throw new Error(data.mensaje || "No se pudo cargar el pedido pendiente.");
            }

            const itemsBackend =
                data.items ||
                data.detalle ||
                data.detalles ||
                data.pedido?.items ||
                data.pedido?.detalle ||
                data.pedido?.detalles ||
                [];

            if (!Array.isArray(itemsBackend)) {
                alert("El backend no está devolviendo los productos del pedido.");
                return;
            }

            const itemsCarrito = itemsBackend.map((item: any) => ({
                producto: {
                    productoId: item.productoId,
                    empresaId: item.empresaId || 1,
                    tipo_item: item.tipo_item || "PRODUCTO",
                    codigo: item.codigo || "",
                    nombre: item.nombre || item.productoNombre || item.descripcion || "Producto",
                    descripcion: item.descripcion || null,
                    imagen_url: item.imagen_url || item.imagenUrl || null,
                    categoria: item.categoria || null,
                    stock: Number(item.stock || 0),
                    precio_venta: Number(item.precioUnitario || item.precio_venta || item.precio || 0),
                    aplica_iva: item.aplica_iva || "NO",
                },
                cantidad: Number(item.cantidad || 1),
            }));

            setCarrito(itemsCarrito);
            localStorage.setItem("tienda_carrito", JSON.stringify(itemsCarrito));
            localStorage.setItem("tienda_pedido_activo", pedidoId);
            setPedidoActivoId(pedidoId);
            setPedidoPendienteCargado(true);
            setCarritoAbierto(true);
        } catch (error: any) {
            console.error("Error cargarPedidoPendienteEnCarrito:", error);
            alert(error.message || "Error cargando pedido pendiente.");
        }
    }

    return (
        <main className="min-h-screen bg-slate-950 text-white">
            <section className="relative overflow-hidden px-5 py-16">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#06b6d433,transparent_35%),radial-gradient(circle_at_bottom_right,#a855f733,transparent_30%)]" />

                <div className="relative mx-auto max-w-7xl">
                    <div className="text-center">
                        <div className="mx-auto mb-5 flex w-fit items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200">
                            <Sparkles size={16} />
                            Tienda online Netcomp RF
                        </div>

                        <h1 className="text-4xl font-black tracking-tight md:text-6xl">
                            Catálogo tecnológico:
                            <span className="block bg-gradient-to-r from-cyan-300 via-blue-400 to-fuchsia-400 bg-clip-text text-transparent">
                                Todo lo que necesitas, al mejor precio
                            </span>
                        </h1>

                        <p className="mx-auto mt-5 max-w-2xl text-slate-300">
                            Equipos de red, fibra óptica, wireless, sistema seguridad, paneles solares, accesorios y soluciones tecnológicas.
                        </p>
                    </div>

                    <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur">
                        <div className="grid gap-4 md:grid-cols-[1.5fr_1fr_1fr_auto]">
                            <div className="relative">
                                <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
                                <input
                                    value={buscar}
                                    onChange={(e) => setBuscar(e.target.value)}
                                    placeholder="Buscar producto, código o descripción..."
                                    className="w-full rounded-2xl border border-white/10 bg-slate-900/80 py-3 pl-12 pr-4 outline-none transition focus:border-cyan-400"
                                />
                            </div>

                            <select
                                value={categoria}
                                onChange={(e) => setCategoria(e.target.value)}
                                className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 outline-none transition focus:border-cyan-400"
                            >
                                <option value="TODOS">Todas las categorías</option>
                                {categorias.map((cat) => (
                                    <option key={cat} value={cat}>
                                        {cat}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={tipoItem}
                                onChange={(e) => setTipoItem(e.target.value)}
                                className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 outline-none transition focus:border-cyan-400"
                            >
                                <option value="TODOS">Productos y servicios</option>
                                <option value="PRODUCTO">Productos</option>
                                <option value="SERVICIO">Servicios</option>
                            </select>

                            <button
                                onClick={() => setSoloStock(!soloStock)}
                                className={`rounded-2xl px-5 py-3 font-bold transition ${soloStock
                                    ? "bg-cyan-400 text-slate-950"
                                    : "border border-white/10 bg-slate-900/80 text-white"
                                    }`}
                            >
                                Stock
                            </button>
                        </div>
                    </div>

                    <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm text-slate-300">
                            {loading ? "Cargando catálogo..." : `${totalProductos} productos disponibles`}
                        </p>

                        <button
                            onClick={() => setCarritoAbierto(true)}
                            className="relative flex items-center gap-2 rounded-full bg-cyan-400 px-5 py-3 font-black text-slate-950 shadow-xl shadow-cyan-400/20 transition hover:bg-cyan-300"
                        >
                            <ShoppingCart size={20} />
                            Mi carrito
                            {totalItemsCarrito > 0 && (
                                <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                                    {totalItemsCarrito}
                                </span>
                            )}
                        </button>
                    </div>

                    {loading ? (
                        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div
                                    key={i}
                                    className="h-[420px] animate-pulse rounded-[2rem] bg-white/10"
                                />
                            ))}
                        </div>
                    ) : productos.length === 0 ? (
                        <div className="mt-12 rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
                            <Package className="mx-auto mb-4 text-slate-400" size={50} />
                            <h2 className="text-2xl font-black">No hay productos para mostrar</h2>
                            <p className="mt-2 text-slate-400">
                                Cambia los filtros o agrega productos activos en inventario.
                            </p>
                        </div>
                    ) : (
                        <div className="mt-10 grid gap-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {productos.map((producto) => {
                                const precio = precioNumero(producto.precio_venta);
                                const rareza = obtenerRareza(precio);
                                const cls = clasesRareza(rareza);

                                return (
                                    <article
                                        key={producto.productoId}
                                        className={`group relative overflow-hidden rounded-[2rem] border ${cls.borde} bg-gradient-to-br ${cls.fondo} p-3 shadow-2xl ${cls.glow} transition duration-300 hover:-translate-y-2 hover:scale-[1.02]`}
                                    >
                                        <div className="relative rounded-[1.5rem] border border-white/10 bg-slate-950/80 p-4">
                                            <div className="mb-3 flex items-center justify-between">
                                                <span className="text-xs font-black text-cyan-200">
                                                    NETCOMP RF
                                                </span>
                                                <span className={`rounded-full px-3 py-1 text-[10px] font-black ${cls.badge}`}>
                                                    {rareza}
                                                </span>
                                            </div>

                                            <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                                                {producto.imagen_url ? (
                                                    <img
                                                        src={producto.imagen_url}
                                                        alt={producto.nombre}
                                                        className="h-full w-full object-cover transition duration-300 group-hover:scale-110"
                                                    />
                                                ) : (
                                                    <Package size={70} className="text-slate-500" />
                                                )}
                                            </div>

                                            <div className="mt-4">
                                                <h2 className="line-clamp-2 min-h-[48px] text-lg font-black">
                                                    {producto.nombre}
                                                </h2>

                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    <span className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300">
                                                        <Layers size={13} />
                                                        {producto.categoria || "Sin categoría"}
                                                    </span>

                                                    <span className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300">
                                                        <Tag size={13} />
                                                        {producto.tipo_item}
                                                    </span>
                                                </div>

                                                <div className="mt-4 flex items-end justify-between">
                                                    <div>
                                                        <p className="text-xs text-slate-400">Precio</p>
                                                        <p className="text-3xl font-black text-cyan-300">
                                                            ${precio.toFixed(2)}
                                                        </p>
                                                    </div>

                                                    <div className="text-right">
                                                        <p className="text-xs text-slate-400">Stock</p>
                                                        <p
                                                            className={`font-black ${producto.stock > 0
                                                                ? "text-emerald-300"
                                                                : "text-red-300"
                                                                }`}
                                                        >
                                                            {producto.stock}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="mt-5 grid grid-cols-2 gap-2">
                                                    <button
                                                        onClick={() => setProductoModal(producto)}
                                                        className="rounded-xl border border-white/10 bg-white/10 px-3 py-3 text-sm font-bold transition hover:bg-white/20"
                                                    >
                                                        Ver detalle
                                                    </button>

                                                    <button
                                                        onClick={() => agregarAlCarrito(producto)}
                                                        className="flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-3 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-300"
                                                    >
                                                        <ShoppingCart size={16} />
                                                        Agregar
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>

            <button
                onClick={() => setCarritoAbierto(true)}
                className="fixed bottom-6 right-6 z-40 flex items-center gap-3 rounded-full bg-cyan-400 px-6 py-4 font-black text-slate-950 shadow-2xl shadow-cyan-400/30 transition hover:scale-105 hover:bg-cyan-300"
            >
                <ShoppingCart size={22} />
                Carrito
                {totalItemsCarrito > 0 && (
                    <span className="rounded-full bg-red-500 px-2 py-1 text-xs text-white">
                        {totalItemsCarrito}
                    </span>
                )}
            </button>

            {carritoAbierto && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur"
                    onClick={() => setCarritoAbierto(false)}
                >
                    <div className="absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto border-l border-white/10 bg-slate-950 p-5 shadow-2xl"

                    >
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-black">🛒 Mi carrito</h2>

                            <button
                                onClick={() => setCarritoAbierto(false)}
                                className="rounded-full bg-white/10 p-2 transition hover:bg-white/20"
                            >
                                <X size={22} />
                            </button>
                        </div>
                        {pedidoActivoId && !pedidoPendienteCargado && (
                            <div className="rounded-3xl border border-yellow-400/40 bg-yellow-400/10 p-4">
                                <p className="font-black text-yellow-300">
                                    Tienes un pedido pendiente
                                </p>

                                <p className="text-xs font-bold text-yellow-200">
                                    Código: {pedidoActivoId}
                                </p>

                                <button
                                    onClick={() => cargarPedidoPendienteEnCarrito(pedidoActivoId)}
                                    className="mt-3 rounded-2xl bg-yellow-400 px-5 py-3 font-black text-slate-950"
                                >
                                    Ver pedido pendiente
                                </button>
                            </div>
                        )}

                        {carrito.length === 0 ? (
                            <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
                                <ShoppingCart className="mx-auto mb-4 text-slate-400" size={55} />
                                <h3 className="text-xl font-black">Carrito vacío</h3>
                                <p className="mt-2 text-slate-400">
                                    Agrega productos para continuar.
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="mt-6 space-y-4">
                                    {carrito.map((item) => {
                                        const precio = precioNumero(item.producto.precio_venta);
                                        const subtotal = precio * item.cantidad;

                                        return (
                                            <div
                                                key={item.producto.productoId}
                                                className="rounded-3xl border border-white/10 bg-white/5 p-4"
                                            >
                                                <div className="flex gap-3">
                                                    <div className="h-20 w-20 overflow-hidden rounded-2xl bg-white/10">
                                                        {item.producto.imagen_url ? (
                                                            <img
                                                                src={item.producto.imagen_url}
                                                                alt={item.producto.nombre}
                                                                className="h-full w-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="flex h-full w-full items-center justify-center">
                                                                <Package className="text-slate-500" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex-1">
                                                        <h3 className="line-clamp-2 font-black">
                                                            {item.producto.nombre}
                                                        </h3>
                                                        <p className="mt-1 text-sm text-slate-400">
                                                            ${precio.toFixed(2)} c/u
                                                        </p>
                                                        <p className="mt-1 text-sm font-bold text-cyan-300">
                                                            Subtotal: ${subtotal.toFixed(2)}
                                                        </p>
                                                    </div>

                                                    <button
                                                        onClick={() => eliminarDelCarrito(item.producto.productoId)}
                                                        className="h-fit rounded-full bg-red-500/20 p-2 text-red-300 transition hover:bg-red-500/30"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>

                                                <div className="mt-4 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => disminuirCantidad(item.producto.productoId)}
                                                            className="rounded-full bg-white/10 p-2 transition hover:bg-white/20"
                                                        >
                                                            <Minus size={16} />
                                                        </button>

                                                        <span className="w-10 text-center font-black">
                                                            {item.cantidad}
                                                        </span>

                                                        <button
                                                            onClick={() => aumentarCantidad(item.producto.productoId)}
                                                            className="rounded-full bg-white/10 p-2 transition hover:bg-white/20"
                                                        >
                                                            <Plus size={16} />
                                                        </button>
                                                    </div>

                                                    <span className="text-xs text-slate-400">
                                                        Stock: {item.producto.stock}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className=" bottom-0 mt-6 rounded-3xl border border-cyan-400/20 bg-slate-900 p-5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-300">Total</span>
                                        <span className="text-3xl font-black text-cyan-300">
                                            ${totalCarrito.toFixed(2)}
                                        </span>
                                    </div>

                                    <button
                                        onClick={() => {
                                            if (pedidoActivoId) {
                                                actualizarPedidoPendiente(carrito);
                                            } else {
                                                setModalPedido(true);
                                            }
                                        }}
                                        className="mt-4 flex w-full items-center justify-center gap-3 rounded-2xl bg-cyan-400 px-5 py-4 font-black text-slate-950 transition hover:bg-cyan-300"
                                    >
                                        <ShoppingCart size={22} />
                                        {pedidoActivoId ? "Actualizar pedido" : "Terminar pedido"}
                                    </button>
                                    {pedidoActivoId && pedidoPendienteCargado && (
                                        <button
                                            onClick={() => { router.push(`/inventario/tienda/${pedidoActivoId}`); }}
                                            className="mt-3 w-full rounded-2xl bg-yellow-400 px-5 py-4 font-black text-slate-950 transition hover:bg-yellow-300"
                                        >
                                            Ir a pagar pedido
                                        </button>
                                    )}

                                    <a
                                        href={whatsappCarrito()}
                                        target="_blank"
                                        className="mt-3 flex w-full items-center justify-center gap-3 rounded-2xl bg-emerald-500 px-5 py-4 font-black text-white transition hover:bg-emerald-400"
                                    >
                                        <MessageCircle size={22} />
                                        Enviar por WhatsApp
                                    </a>

                                    <button
                                        onClick={pedidoActivoId ? anularPedidoPendiente : vaciarCarrito}
                                        className="mt-3 w-full rounded-2xl border border-white/10 px-5 py-3 font-bold text-slate-300 transition hover:bg-white/10"
                                    >
                                        {pedidoActivoId ? "Anular pedido y vaciar carrito" : "Vaciar carrito"}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {productoModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur">
                    <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-white/10 bg-slate-950 p-5 shadow-2xl">
                        <button
                            onClick={() => setProductoModal(null)}
                            className="absolute right-5 top-5 rounded-full bg-white/10 p-2 transition hover:bg-white/20"
                        >
                            <X size={22} />
                        </button>

                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="flex aspect-square items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-white/5">
                                {productoModal.imagen_url ? (
                                    <img
                                        src={productoModal.imagen_url}
                                        alt={productoModal.nombre}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <Package size={90} className="text-slate-500" />
                                )}
                            </div>

                            <div className="pr-0 md:pr-8">
                                <p className="text-sm font-bold text-cyan-300">
                                    {productoModal.categoria || "Sin categoría"}
                                </p>

                                <h2 className="mt-2 text-3xl font-black">
                                    {productoModal.nombre}
                                </h2>

                                <p className="mt-4 text-slate-300">
                                    {productoModal.descripcion || "Producto disponible en Netcomp RF."}
                                </p>

                                <div className="mt-6 rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-5">
                                    <p className="text-sm text-cyan-200">Precio de venta</p>
                                    <p className="text-5xl font-black text-cyan-300">
                                        ${precioNumero(productoModal.precio_venta).toFixed(2)}
                                    </p>
                                </div>

                                <button
                                    onClick={() => agregarAlCarrito(productoModal)}
                                    className="mt-6 flex w-full items-center justify-center gap-3 rounded-2xl bg-cyan-400 px-5 py-4 font-black text-slate-950 transition hover:bg-cyan-300"
                                >
                                    <ShoppingCart size={22} />
                                    Agregar al carrito
                                </button>

                                <a
                                    href={whatsappProducto(productoModal)}
                                    target="_blank"
                                    className="mt-3 flex w-full items-center justify-center gap-3 rounded-2xl bg-emerald-500 px-5 py-4 font-black text-white transition hover:bg-emerald-400"
                                >
                                    <MessageCircle size={22} />
                                    Comprar por WhatsApp
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {modalPedido && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur">
                    <div className="w-full max-w-lg rounded-[2rem] border border-cyan-400/20 bg-slate-950 p-5 shadow-2xl">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-black">Finalizar pedido</h2>
                                <p className="mt-1 text-sm text-slate-400">
                                    Completa tus datos para crear el pedido.
                                </p>
                            </div>

                            <button
                                onClick={() => setModalPedido(false)}
                                className="rounded-full bg-white/10 p-2 transition hover:bg-white/20"
                            >
                                <X size={22} />
                            </button>
                        </div>

                        <div className="mt-5 rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-4">
                            <div className="flex items-center justify-between">
                                <span className="text-slate-300">Total del pedido</span>
                                <span className="text-3xl font-black text-cyan-300">
                                    ${totalCarrito.toFixed(2)}
                                </span>
                            </div>
                        </div>

                        <div className="mt-5 space-y-3">
                            <input
                                value={clienteNombre}
                                onChange={(e) => setClienteNombre(e.target.value)}
                                placeholder="Nombre del cliente"
                                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-400"
                            />

                            <input
                                value={clienteTelefono}
                                onChange={(e) => setClienteTelefono(e.target.value)}
                                placeholder="Teléfono / WhatsApp"
                                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-400"
                            />

                            <input
                                value={clienteEmail}
                                onChange={(e) => setClienteEmail(e.target.value)}
                                placeholder="Correo opcional"
                                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-400"
                            />

                            <textarea
                                value={clienteDireccion}
                                onChange={(e) => setClienteDireccion(e.target.value)}
                                placeholder="Dirección de entrega opcional"
                                rows={2}
                                className="w-full resize-none rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-400"
                            />

                            <textarea
                                value={observacion}
                                onChange={(e) => setObservacion(e.target.value)}
                                placeholder="Observación opcional"
                                rows={2}
                                className="w-full resize-none rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-400"
                            />
                        </div>

                        <button
                            onClick={crearPedido}
                            disabled={creandoPedido}
                            className="mt-5 flex w-full items-center justify-center gap-3 rounded-2xl bg-cyan-400 px-5 py-4 font-black text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <ShoppingCart size={22} />
                            {creandoPedido ? "Creando pedido..." : "Crear pedido"}
                        </button>

                        <button
                            onClick={() => setModalPedido(false)}
                            className="mt-3 w-full rounded-2xl border border-white/10 px-5 py-3 font-bold text-slate-300 transition hover:bg-white/10"
                        >
                            Seguir agregando productos
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
}