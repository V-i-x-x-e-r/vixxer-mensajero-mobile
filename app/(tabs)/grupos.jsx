import { useState, useEffect, useCallback } from "react";
import { View, Text, Pressable, FlatList, RefreshControl, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import * as api from "../../lib/api";
import { descifrar } from "../../lib/crypto";
import { leer, MI_ID, CLAVE_PRIVADA } from "../../lib/storage";
import { leerVistos } from "../../lib/grupoVisto";
import { leerCacheGrupos, guardarCacheGrupos } from "../../lib/chatCache";
import { obtenerSocket } from "../../lib/socket";
import { useTema } from "../../components/tema";
import { fuentes } from "../../assets/themes/temas";
import { Presionable } from "../../components/Presionable";
import { Grupos as GruposIcono } from "../../components/Grupos";
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
  }
  return texto;
}

export default function Grupos()
{
  const { colores } = useTema();
  const insets = useSafeAreaInsets();
  const [grupos, setGrupos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState(false);

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
      setGrupos(lista);
      guardarCacheGrupos(lista);
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
    const alCambio = () => cargar();
    socket.on("grupo:nuevo", alCambio);
    socket.on("grupo:mensaje", alCambio);
    return () =>
    {
      socket.off("grupo:nuevo", alCambio);
      socket.off("grupo:mensaje", alCambio);
    };
  }, [cargar]);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  async function refrescar()
  {
    setRefrescando(true);
    await cargar();
    setRefrescando(false);
  }

  return (
    <View style={[estilos.pantalla, { backgroundColor: colores.fondo, paddingTop: insets.top + 12 }]}>
      <View style={estilos.cabecera}>
        <Text style={[estilos.titulo, { color: colores.texto }]}>Grupos</Text>
        <Pressable onPress={() => router.push("/grupo/crear")} hitSlop={8} style={({ pressed }) => [estilos.crear, { backgroundColor: colores.botonFondo }, pressed && estilos.presionado]}>
          <Text style={[estilos.crearTxt, { color: colores.botonTexto }]}>+ Nuevo</Text>
        </Pressable>
      </View>

      <FlatList
        data={grupos}
        keyExtractor={(g) => g.id}
        style={estilos.lista}
        refreshControl={
          <RefreshControl refreshing={refrescando} onRefresh={refrescar} tintColor={colores.muted} colors={[colores.texto]} />
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
            style={estilos.fila}
          >
            <View style={[estilos.icono, { backgroundColor: colores.surface }]}>
              <GruposIcono color={colores.muted} tamano={22} />
            </View>
            <View style={estilos.centro}>
              <Text style={[estilos.nombre, { color: colores.texto }]} numberOfLines={1}>{item.nombre}</Text>
              <Text style={[estilos.sub, { color: colores.muted }]} numberOfLines={1}>
                {item.preview || `${item.miembros} miembros`}
              </Text>
            </View>
            <View style={estilos.derecha}>
              {item.hora ? <Text style={[estilos.hora, { color: colores.muted }]}>{cuando(item.hora)}</Text> : null}
              {item.nuevo ? <View style={[estilos.punto, { backgroundColor: colores.botonFondo }]} /> : null}
            </View>
          </Presionable>
        )}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, paddingHorizontal: 20, gap: 12 },
  cabecera: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 34 },
  titulo: { fontSize: 18, fontFamily: fuentes.semibold },
  crear: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  crearTxt: { fontSize: 13, fontFamily: fuentes.semibold },
  lista: { flex: 1 },
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
});
