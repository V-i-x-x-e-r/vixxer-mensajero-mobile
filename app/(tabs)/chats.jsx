import { useEffect, useState, useCallback } from "react";
import { View, Text, Pressable, FlatList, RefreshControl, Modal, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import * as api from "../../lib/api";
import { conectarSocket, obtenerSocket } from "../../lib/socket";
import { descifrar } from "../../lib/crypto";
import { llavePublicaDe } from "../../lib/llaves";
import { leer, TOKEN, MI_ID, CLAVE_PRIVADA } from "../../lib/storage";
import { leerEstados, alternarFijado, alternarSilenciado, ocultar, mostrar } from "../../lib/chatLocal";
import { leerCacheLista, guardarCacheLista } from "../../lib/chatCache";
import { useTema } from "../../components/tema";
import { fuentes } from "../../assets/themes/temas";
import { Logo } from "../../components/Logo";
import { Engrane } from "../../components/Engrane";
import { Avatar } from "../../components/Avatar";
import { Presionable } from "../../components/Presionable";
import { Pin } from "../../components/Pin";
import { Silencio } from "../../components/Silencio";
import { Bote } from "../../components/Bote";
import { EstadoLista } from "../../components/EstadoLista";

function cuando(iso)
{
  if (!iso)
  {
    return "";
  }
  const f = new Date(iso);
  const hoy = new Date();
  if (f.toDateString() === hoy.toDateString())
  {
    return `${String(f.getHours()).padStart(2, "0")}:${String(f.getMinutes()).padStart(2, "0")}`;
  }
  return f.toLocaleDateString();
}

export default function Chats()
{
  const { colores } = useTema();
  const insets = useSafeAreaInsets();
  const [amigos, setAmigos] = useState([]);
  const [convs, setConvs] = useState({});
  const [estados, setEstados] = useState({ fijados: [], silenciados: [], ocultos: [] });
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState(false);
  const [estado, setEstado] = useState("conectando…");
  const [sel, setSel] = useState(null);
  const [borrando, setBorrando] = useState(false);

  const cargar = useCallback(async () =>
  {
    setError(false);
    try
    {
      const e = await leerEstados();
      setEstados(e);
      const [lista, conversaciones] = await Promise.all([
        api.amigos(),
        api.conversaciones(),
      ]);

      const miId = await leer(MI_ID);
      const priv = await leer(CLAVE_PRIVADA);
      const mapa = {};
      for (const c of conversaciones)
      {
        const pub = await llavePublicaDe(c.otro_id);
        let claro = descifrar(c.ultimo_cifrado, c.ultimo_nonce, pub, priv);
        if (claro === null)
        {
          const fresca = await llavePublicaDe(c.otro_id, true);
          claro = descifrar(c.ultimo_cifrado, c.ultimo_nonce, fresca, priv);
        }
        let texto = claro ?? "Mensaje cifrado";
        if (texto[0] === "{")
        {
          if (texto.includes("\"t\":\"img\"")) { texto = "Foto"; }
          else if (texto.includes("\"t\":\"video\"")) { texto = "Video"; }
          else if (texto.includes("\"t\":\"audio\"")) { texto = "Audio"; }
        }
        mapa[c.otro_id] = {
          preview: c.ultimo_remitente_id === miId ? `Tú: ${texto}` : texto,
          enviado_en: c.enviado_en,
          noLeidos: c.no_leidos,
        };
      }

      const visibles = lista.filter((a) => mapa[a.id] && !e.ocultos.includes(a.id));
      visibles.sort((a, b) => (mapa[b.id]?.enviado_en || "").localeCompare(mapa[a.id]?.enviado_en || ""));
      const fijados = visibles.filter((a) => e.fijados.includes(a.id));
      const resto = visibles.filter((a) => !e.fijados.includes(a.id));
      const ordenados = [...fijados, ...resto];
      setAmigos(ordenados);
      setConvs(mapa);
      guardarCacheLista({ amigos: ordenados, convs: mapa });
    }
    catch (e)
    {
      setError(true);
    }
    finally
    {
      setCargando(false);
    }
  }, []);

  useEffect(() =>
  {
    leerCacheLista().then((c) =>
    {
      if (c)
      {
        setAmigos(c.amigos);
        setConvs(c.convs);
        setCargando(false);
      }
    });
  }, []);

  useEffect(() =>
  {
    let socket;
    (async () =>
    {
      const token = await leer(TOKEN);
      if (!token)
      {
        router.replace("/");
        return;
      }
      socket = conectarSocket(token);
      setEstado(socket.connected ? "conectado" : "conectando…");
      socket.on("connect", () => setEstado("conectado"));
      socket.on("disconnect", () => setEstado("sin conexión"));
      socket.on("connect_error", () => setEstado("sin conexión"));
      socket.on("mensaje:recibido", async (fila) =>
      {
        socket.emit("mensaje:entregado", { id: fila.id });
        await mostrar(fila.remitente_id);
        cargar();
      });
    })();

    return () =>
    {
      if (socket)
      {
        socket.off("connect");
        socket.off("disconnect");
        socket.off("connect_error");
        socket.off("mensaje:recibido");
      }
    };
  }, [cargar]);

  useFocusEffect(
    useCallback(() =>
    {
      cargar();
      const s = obtenerSocket();
      if (s)
      {
        s.emit("entregar:pendientes");
      }
    }, [cargar]),
  );

  function reintentar()
  {
    setCargando(true);
    cargar();
  }

  async function refrescar()
  {
    setRefrescando(true);
    await cargar();
    setRefrescando(false);
  }

  async function fijar()
  {
    await alternarFijado(sel);
    cargar();
  }

  async function silenciar()
  {
    await alternarSilenciado(sel);
    cargar();
  }

  async function quitarDeLista()
  {
    await ocultar(sel);
    setBorrando(false);
    setSel(null);
    cargar();
  }

  async function borrarConversacion()
  {
    try
    {
      await api.limpiarConversacion(sel);
    }
    catch (e)
    {
    }
    setBorrando(false);
    setSel(null);
    cargar();
  }

  const conectado = estado === "conectado";
  const selFijado = sel ? estados.fijados.includes(sel) : false;
  const selSilenciado = sel ? estados.silenciados.includes(sel) : false;

  return (
    <View style={[estilos.pantalla, { backgroundColor: colores.fondo, paddingTop: insets.top + 12 }]}>
      {sel ? (
        <View style={estilos.cabecera}>
          <Pressable onPress={() => setSel(null)} hitSlop={8} style={({ pressed }) => pressed && estilos.presionado}>
            <Text style={{ color: colores.texto, fontSize: 22 }}>{"✕"}</Text>
          </Pressable>
          <View style={estilos.herramientas}>
            <Pressable onPress={fijar} hitSlop={8} style={({ pressed }) => pressed && estilos.presionado}>
              <Pin color={selFijado ? colores.texto : colores.muted} />
            </Pressable>
            <Pressable onPress={silenciar} hitSlop={8} style={({ pressed }) => pressed && estilos.presionado}>
              <Silencio color={selSilenciado ? colores.texto : colores.muted} />
            </Pressable>
            <Pressable onPress={() => setBorrando(true)} hitSlop={8} style={({ pressed }) => pressed && estilos.presionado}>
              <Bote color={colores.error} />
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={estilos.cabecera}>
          <View style={estilos.marca}>
            <Logo alto={24} />
            <Text style={[estilos.titulo, { color: colores.texto }]}>Vixxer</Text>
          </View>
          <Pressable onPress={() => router.push("/ajustes")} hitSlop={8} style={({ pressed }) => pressed && estilos.presionado}>
            <Engrane color={colores.texto} />
          </Pressable>
        </View>
      )}

      <View style={estilos.estado}>
        <View style={[estilos.punto, { backgroundColor: conectado ? "#22C55E" : colores.muted }]} />
        <Text style={[estilos.estadoTxt, { color: colores.muted }]}>{estado}</Text>
      </View>

      <FlatList
        data={amigos}
        keyExtractor={(a) => a.id}
        style={estilos.lista}
        refreshControl={
          <RefreshControl refreshing={refrescando} onRefresh={refrescar} tintColor={colores.muted} colors={[colores.texto]} />
        }
        ListEmptyComponent={
          <EstadoLista
            cargando={cargando}
            error={error}
            vacio="Aún no tienes conversaciones. Ve a Amigos para empezar una."
            onReintentar={reintentar}
          />
        }
        ItemSeparatorComponent={() => <View style={[estilos.separadorFila, { backgroundColor: colores.borde }]} />}
        renderItem={({ item }) =>
        {
          const c = convs[item.id];
          const fijado = estados.fijados.includes(item.id);
          const silenciado = estados.silenciados.includes(item.id);
          const elegido = sel === item.id;
          return (
            <Presionable
              onPress={() => (sel ? setSel(item.id) : router.push({ pathname: "/chat/[id]", params: { id: item.id, usuario: item.usuario, avatar: item.avatar_url || "" } }))}
              onLongPress={() => setSel(item.id)}
              delayLongPress={250}
              style={[estilos.fila, elegido && { backgroundColor: colores.surface }]}
            >
              <Avatar nombre={item.usuario} uri={item.avatar_url} tamano={44} />
              <View style={estilos.centro}>
                <View style={estilos.lineaNombre}>
                  {fijado ? <Pin color={colores.muted} tamano={13} /> : null}
                  <Text style={[estilos.nombre, { color: colores.texto }]} numberOfLines={1}>{item.usuario}</Text>
                  {silenciado ? <Silencio color={colores.muted} tamano={13} /> : null}
                </View>
                {c ? (
                  <Text style={[estilos.preview, { color: colores.muted }]} numberOfLines={1}>{c.preview}</Text>
                ) : null}
              </View>
              {c ? (
                <View style={estilos.derecha}>
                  <Text style={[estilos.hora, { color: colores.muted }]}>{cuando(c.enviado_en)}</Text>
                  {c.noLeidos > 0 ? (
                    <View style={[estilos.badge, { backgroundColor: colores.botonFondo }]}>
                      <Text style={[estilos.badgeTxt, { color: colores.botonTexto }]}>{c.noLeidos}</Text>
                    </View>
                  ) : null}
                </View>
              ) : null}
            </Presionable>
          );
        }}
      />

      <Modal transparent visible={borrando} animationType="fade" onRequestClose={() => setBorrando(false)}>
        <Pressable style={estilos.fondoModal} onPress={() => setBorrando(false)}>
          <Pressable style={[estilos.hoja, { backgroundColor: colores.surface, borderColor: colores.borde }]}>
            <Pressable onPress={quitarDeLista} style={({ pressed }) => [estilos.opcion, pressed && estilos.presionado]}>
              <Text style={[estilos.opcionTxt, { color: colores.texto }]}>Quitar de la lista</Text>
              <Text style={[estilos.opcionSub, { color: colores.muted }]}>La conversación se conserva</Text>
            </Pressable>
            <View style={[estilos.separador, { backgroundColor: colores.borde }]} />
            <Pressable onPress={borrarConversacion} style={({ pressed }) => [estilos.opcion, pressed && estilos.presionado]}>
              <Text style={[estilos.opcionTxt, { color: colores.error }]}>Borrar conversación</Text>
              <Text style={[estilos.opcionSub, { color: colores.muted }]}>Se borra solo para ti</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, paddingHorizontal: 20, gap: 12 },
  cabecera: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 34 },
  marca: { flexDirection: "row", alignItems: "center", gap: 10 },
  titulo: { fontSize: 18, fontFamily: fuentes.semibold },
  herramientas: { flexDirection: "row", alignItems: "center", gap: 20 },
  estado: { flexDirection: "row", alignItems: "center", gap: 6 },
  punto: { width: 8, height: 8, borderRadius: 4 },
  estadoTxt: { fontSize: 13 },
  lista: { flex: 1 },
  fila: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 10, borderRadius: 12 },
  separadorFila: { height: 1, marginLeft: 66 },
  centro: { flex: 1, gap: 2 },
  lineaNombre: { flexDirection: "row", alignItems: "center", gap: 6 },
  nombre: { fontSize: 16, flexShrink: 1 },
  preview: { fontSize: 13 },
  derecha: { alignItems: "flex-end", gap: 4 },
  hora: { fontSize: 11 },
  badge: { minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 6, alignItems: "center", justifyContent: "center" },
  badgeTxt: { fontSize: 12, fontFamily: fuentes.semibold },
  presionado: { opacity: 0.6 },
  fondoModal: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  hoja: { borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, paddingVertical: 8, paddingBottom: 32 },
  opcion: { paddingVertical: 14, paddingHorizontal: 24, gap: 2 },
  opcionTxt: { fontSize: 16 },
  opcionSub: { fontSize: 12 },
  separador: { height: 1, marginHorizontal: 16 },
});
