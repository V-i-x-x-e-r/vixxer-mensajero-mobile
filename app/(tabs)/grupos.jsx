import { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, Pressable, FlatList, RefreshControl, Modal, StyleSheet } from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import * as api from "../../lib/api";
import { descifrar } from "../../lib/crypto";
import { leer, MI_ID, CLAVE_PRIVADA } from "../../lib/storage";
import { leerVistos } from "../../lib/grupoVisto";
import { leerCacheGrupos, guardarCacheGrupos } from "../../lib/chatCache";
import { leerBorrador } from "../../lib/borradores";
import { obtenerSocket } from "../../lib/socket";
import { useTema } from "../../components/tema";
import { Vidrio } from "../../components/Vidrio";
import { BrilloVidrio } from "../../components/Superficie";
import { DeslizarPestanas } from "../../components/DeslizarPestanas";
import { fuentes } from "../../assets/themes/temas";
import { Presionable } from "../../components/Presionable";
import { Avatar } from "../../components/Avatar";
import { Grupos as GruposIcono } from "../../components/Grupos";
import { EstadoLista } from "../../components/EstadoLista";
import { Confirmacion } from "../../components/Confirmacion";

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

function resumen(texto)
{
  if (!texto)
  {
    return "Mensaje cifrado";
  }
  if (texto[0] === "{")
  {
    if (texto.includes("\"t\":\"img\"")) { return "Foto"; }
    if (texto.includes("\"t\":\"video\"")) { return "Video"; }
    if (texto.includes("\"t\":\"audio\"")) { return "Audio"; }
    if (texto.includes("\"t\":\"sticker\"")) { return "Sticker"; }
    if (texto.includes("\"t\":\"file\"")) { return "Documento"; }
  }
  return texto;
}

async function aplicarBorradores(lista)
{
  const pares = await Promise.all(lista.map(async (g) => [g.id, await leerBorrador(`grupo-${g.id}`)]));
  const porId = Object.fromEntries(pares);
  return lista.map((g) =>
  {
    const b = porId[g.id];
    if (!b || (!b.texto && !b.audio))
    {
      return g;
    }
    return {
      ...g,
      preview: b.texto ? `Borrador: ${b.texto}` : "Borrador: nota de voz",
      borrador: true,
    };
  });
}

export default function Grupos()
{
  const { colores, oscuro } = useTema();
  const insets = useSafeAreaInsets();
  const [grupos, setGrupos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState(false);
  const [sel, setSel] = useState(null);
  const [escribiendo, setEscribiendo] = useState({});
  const [confirmarSalir, setConfirmarSalir] = useState(false);
  const recargaPendiente = useRef(null);

  const cargar = useCallback(async () =>
  {
    setError(false);
    try
    {
      const [data, vistos, miId, priv] = await Promise.all([
        api.misGrupos(),
        leerVistos(),
        leer(MI_ID),
        leer(CLAVE_PRIVADA),
      ]);
      const lista = data.map((g) =>
      {
        if (!g.ultimo)
        {
          return { ...g, preview: null, hora: null, nuevo: false };
        }
        const claro = descifrar(g.ultimo.contenido_cifrado, g.ultimo.nonce, g.ultimo.llave_publica, priv);
        const mio = g.ultimo.remitente_id === miId;
        const quien = mio ? "Tú" : g.ultimo.remitente;
        const visto = vistos[g.id];
        return {
          ...g,
          preview: `${quien}: ${resumen(claro)}`,
          hora: g.ultimo.enviado_en,
          nuevo: !mio && (!visto || g.ultimo.enviado_en > visto),
        };
      });
      const conBorradores = await aplicarBorradores(lista);
      setGrupos(conBorradores);
      guardarCacheGrupos(conBorradores);
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

  const programarCarga = useCallback(() =>
  {
    if (recargaPendiente.current)
    {
      return;
    }
    recargaPendiente.current = setTimeout(() =>
    {
      recargaPendiente.current = null;
      cargar();
    }, 250);
  }, [cargar]);

  useEffect(() =>
  {
    leerCacheGrupos().then((c) =>
    {
      if (c)
      {
        setGrupos(c);
        setCargando(false);
      }
    });
  }, []);

  useEffect(() =>
  {
    const socket = obtenerSocket();
    if (!socket)
    {
      return;
    }
    const alCambio = () => programarCarga();
    const tiempos = {};
    function alEscribiendo(data)
    {
      if (!data || !data.grupo)
      {
        return;
      }
      if (tiempos[data.grupo])
      {
        clearTimeout(tiempos[data.grupo]);
      }
      if (data.activo)
      {
        setEscribiendo((prev) => ({ ...prev, [data.grupo]: true }));
        tiempos[data.grupo] = setTimeout(() => setEscribiendo((prev) => ({ ...prev, [data.grupo]: false })), 3000);
      }
      else
      {
        setEscribiendo((prev) => ({ ...prev, [data.grupo]: false }));
      }
    }
    socket.on("grupo:nuevo", alCambio);
    socket.on("grupo:mensaje", alCambio);
    socket.on("grupo:actualizado", alCambio);
    socket.on("grupo:escribiendo", alEscribiendo);
    return () =>
    {
      socket.off("grupo:nuevo", alCambio);
      socket.off("grupo:mensaje", alCambio);
      socket.off("grupo:actualizado", alCambio);
      socket.off("grupo:escribiendo", alEscribiendo);
      Object.values(tiempos).forEach(clearTimeout);
      if (recargaPendiente.current)
      {
        clearTimeout(recargaPendiente.current);
        recargaPendiente.current = null;
      }
    };
  }, [programarCarga]);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  async function refrescar()
  {
    setRefrescando(true);
    await cargar();
    setRefrescando(false);
  }

  async function salirDelGrupo()
  {
    const grupo = sel;
    setConfirmarSalir(false);
    setSel(null);
    if (!grupo)
    {
      return;
    }
    try
    {
      await api.salirGrupo(grupo.id);
    }
    catch (e)
    {
    }
    cargar();
  }

  return (
    <DeslizarPestanas actual="grupos">
    <View style={[estilos.pantalla, { backgroundColor: colores.fondo, paddingTop: insets.top + 12 }]}>
      <View style={estilos.cabecera}>
        <Text style={[estilos.titulo, { color: colores.texto }]}>Grupos</Text>
        <Pressable onPress={() => router.push("/grupo/crear")} hitSlop={8} style={({ pressed }) => [estilos.crear, { backgroundColor: colores.botonFondo }, pressed && estilos.presionado]}>
          <Text style={[estilos.crearTxt, { color: colores.botonTexto }]}>+ Nuevo</Text>
        </Pressable>
      </View>

      <Animated.FlatList
        data={grupos}
        keyExtractor={(g) => g.id}
        itemLayoutAnimation={LinearTransition.springify().damping(18)}
        windowSize={7}
        maxToRenderPerBatch={10}
        initialNumToRender={12}
        style={estilos.lista}
        refreshControl={
          <RefreshControl refreshing={refrescando} onRefresh={refrescar} tintColor={colores.texto} colors={[colores.texto]} progressBackgroundColor={colores.surface} />
        }
        ListEmptyComponent={
          <EstadoLista
            cargando={cargando}
            error={error}
            vacio="Aún no tienes grupos. Crea uno con el botón de arriba."
            onReintentar={() => { setCargando(true); cargar(); }}
          />
        }
        ItemSeparatorComponent={() => <View style={[estilos.sep, { backgroundColor: colores.borde }]} />}
        renderItem={({ item }) => (
          <Presionable
            onPress={() => router.push({ pathname: "/grupo/[id]", params: { id: item.id, nombre: item.nombre } })}
            onLongPress={() => setSel(item)}
            delayLongPress={300}
            style={estilos.fila}
          >
            {item.avatar_url ? (
              <Avatar nombre={item.nombre} uri={item.avatar_url} tamano={44} />
            ) : (
              <View style={[estilos.icono, { backgroundColor: colores.surface }]}>
                <GruposIcono color={colores.muted} tamano={22} />
              </View>
            )}
            <View style={estilos.centro}>
              <Text style={[estilos.nombre, { color: colores.texto }]} numberOfLines={1}>{item.nombre}</Text>
              {escribiendo[item.id] ? (
                <Text style={[estilos.sub, { color: colores.exito || colores.botonFondo }]} numberOfLines={1}>escribiendo…</Text>
              ) : (
                <Text style={[estilos.sub, { color: item.borrador ? colores.error : colores.muted }]} numberOfLines={1}>
                  {item.preview || `${item.miembros} miembros`}
                </Text>
              )}
            </View>
            <View style={estilos.derecha}>
              {item.hora ? <Text style={[estilos.hora, { color: colores.muted }]}>{cuando(item.hora)}</Text> : null}
              {item.nuevo ? <View style={[estilos.punto, { backgroundColor: colores.botonFondo }]} /> : null}
            </View>
          </Presionable>
        )}
      />

      <Modal transparent visible={!!sel && !confirmarSalir} animationType="fade" onRequestClose={() => setSel(null)}>
        <Pressable style={estilos.menuFondo} onPress={() => setSel(null)}>
          <Pressable style={[estilos.menuHoja, { borderColor: colores.borde, overflow: "hidden" }]}>
            <Vidrio tinte={oscuro ? "dark" : "light"} style={[StyleSheet.absoluteFill, { backgroundColor: `${colores.surface}E8` }]} />
            <BrilloVidrio oscuro={oscuro} />
            <Text style={[estilos.menuTitulo, { color: colores.muted }]}>{sel?.nombre}</Text>
            <Pressable
              onPress={() => { const g = sel; setSel(null); router.push({ pathname: "/grupo/info/[id]", params: { id: g.id, nombre: g.nombre } }); }}
              style={({ pressed }) => [estilos.menuItem, pressed && estilos.presionado]}
            >
              <Text style={[estilos.menuTxt, { color: colores.texto }]}>Ver info y miembros</Text>
            </Pressable>
            <Pressable onPress={() => setConfirmarSalir(true)} style={({ pressed }) => [estilos.menuItem, pressed && estilos.presionado]}>
              <Text style={[estilos.menuTxt, { color: colores.error }]}>Salir del grupo</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Confirmacion
        visible={confirmarSalir}
        titulo="Salir del grupo"
        mensaje="Dejarás de recibir sus mensajes. Podrán volver a agregarte más adelante."
        textoConfirmar="Salir"
        destructivo
        onConfirmar={salirDelGrupo}
        onCancelar={() => { setConfirmarSalir(false); setSel(null); }}
      />
    </View>
    </DeslizarPestanas>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, paddingHorizontal: 20, gap: 12 },
  cabecera: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 28 },
  titulo: { fontSize: 18, fontFamily: fuentes.semibold },
  crear: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  crearTxt: { fontSize: 13, fontFamily: fuentes.semibold },
  lista: { flex: 1, marginHorizontal: -10 },
  fila: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 10, borderRadius: 12 },
  icono: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  centro: { flex: 1, gap: 2 },
  nombre: { fontSize: 16 },
  sub: { fontSize: 13 },
  derecha: { alignItems: "flex-end", gap: 4 },
  hora: { fontSize: 11 },
  punto: { width: 10, height: 10, borderRadius: 5 },
  sep: { height: 1, marginLeft: 66 },
  presionado: { opacity: 0.7 },
  menuFondo: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  menuHoja: { borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, paddingVertical: 8, paddingBottom: 28 },
  menuTitulo: { fontSize: 12, fontFamily: fuentes.semibold, letterSpacing: 1, paddingHorizontal: 24, paddingTop: 8, paddingBottom: 4, textTransform: "uppercase" },
  menuItem: { paddingVertical: 14, paddingHorizontal: 24 },
  menuTxt: { fontSize: 16 },
});
