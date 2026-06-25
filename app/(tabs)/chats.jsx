import { useEffect, useState, useCallback } from "react";
import { View, Text, Pressable, FlatList, RefreshControl, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import * as api from "../../lib/api";
import { conectarSocket } from "../../lib/socket";
import { descifrar } from "../../lib/crypto";
import { llavePublicaDe } from "../../lib/llaves";
import { leer, TOKEN, MI_ID, CLAVE_PRIVADA } from "../../lib/storage";
import { useTema } from "../../components/tema";
import { fuentes } from "../../assets/themes/temas";
import { Logo } from "../../components/Logo";
import { Engrane } from "../../components/Engrane";
import { Avatar } from "../../components/Avatar";
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
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState(false);
  const [estado, setEstado] = useState("conectando…");

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
    })();

    return () =>
    {
      if (socket)
      {
        socket.off("connect");
        socket.off("disconnect");
        socket.off("connect_error");
      }
    };
  }, []);

  const cargar = useCallback(async () =>
  {
    setError(false);
    try
    {
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
        const texto = descifrar(c.ultimo_cifrado, c.ultimo_nonce, pub, priv) ?? "Mensaje cifrado";
        mapa[c.otro_id] = {
          preview: c.ultimo_remitente_id === miId ? `Tú: ${texto}` : texto,
          enviado_en: c.enviado_en,
          noLeidos: c.no_leidos,
        };
      }

      const conConversacion = lista.filter((a) => mapa[a.id]);
      const ordenados = conConversacion.sort((a, b) =>
        (mapa[b.id]?.enviado_en || "").localeCompare(mapa[a.id]?.enviado_en || ""),
      );
      setAmigos(ordenados);
      setConvs(mapa);
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

  useFocusEffect(
    useCallback(() =>
    {
      cargar();
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

  const conectado = estado === "conectado";

  return (
    <View style={[estilos.pantalla, { backgroundColor: colores.fondo, paddingTop: insets.top + 12 }]}>
      <View style={estilos.cabecera}>
        <View style={estilos.marca}>
          <Logo alto={24} />
          <Text style={[estilos.titulo, { color: colores.texto }]}>Vixxer</Text>
        </View>
        <Pressable onPress={() => router.push("/ajustes")} hitSlop={8} style={({ pressed }) => pressed && estilos.presionado}>
          <Engrane color={colores.texto} />
        </Pressable>
      </View>

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
        renderItem={({ item }) =>
        {
          const c = convs[item.id];
          return (
            <Pressable
              onPress={() => router.push({ pathname: "/chat/[id]", params: { id: item.id, usuario: item.usuario, avatar: item.avatar_url || "" } })}
              style={({ pressed }) => [estilos.fila, { backgroundColor: colores.surface, borderColor: colores.borde }, pressed && estilos.presionado]}
            >
              <Avatar nombre={item.usuario} uri={item.avatar_url} tamano={44} />
              <View style={estilos.centro}>
                <Text style={[estilos.nombre, { color: colores.texto }]} numberOfLines={1}>{item.usuario}</Text>
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
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, paddingHorizontal: 20, gap: 12 },
  cabecera: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  marca: { flexDirection: "row", alignItems: "center", gap: 10 },
  titulo: { fontSize: 18, fontFamily: fuentes.semibold },
  estado: { flexDirection: "row", alignItems: "center", gap: 6 },
  punto: { width: 8, height: 8, borderRadius: 4 },
  estadoTxt: { fontSize: 13 },
  lista: { flex: 1 },
  fila: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 10, borderWidth: 1, marginBottom: 8 },
  centro: { flex: 1, gap: 2 },
  nombre: { fontSize: 16 },
  preview: { fontSize: 13 },
  derecha: { alignItems: "flex-end", gap: 4 },
  hora: { fontSize: 11 },
  badge: { minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 6, alignItems: "center", justifyContent: "center" },
  badgeTxt: { fontSize: 12, fontFamily: fuentes.semibold },
  presionado: { opacity: 0.6 },
});
