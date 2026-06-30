import { useEffect, useState } from "react";
import { View, Text, Pressable, FlatList, StyleSheet } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as api from "../../lib/api";
import { descifrar, numeroSeguridad } from "../../lib/crypto";
import { llavePublicaDe } from "../../lib/llaves";
import { leer, CLAVE_PRIVADA, CLAVE_PUBLICA } from "../../lib/storage";
import { useTema } from "../../components/tema";
import { fuentes } from "../../assets/themes/temas";
import { Avatar } from "../../components/Avatar";
import { Confirmacion } from "../../components/Confirmacion";
import { AdjuntoImagen } from "../../components/AdjuntoImagen";
import { Bote } from "../../components/Bote";

function leerMedia(texto)
{
  if (!texto || texto[0] !== "{")
  {
    return null;
  }
  try
  {
    const obj = JSON.parse(texto);
    return obj && (obj.t === "img" || obj.t === "video") ? obj : null;
  }
  catch (e)
  {
    return null;
  }
}

function estadoTexto(presencia)
{
  if (!presencia)
  {
    return null;
  }
  if (presencia.en_linea)
  {
    return "en línea";
  }
  if (presencia.ultima_conexion)
  {
    return `últ. vez ${new Date(presencia.ultima_conexion).toLocaleString()}`;
  }
  return null;
}

function Fila({ etiqueta, icono, color, onPress })
{
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [estilos.fila, pressed && estilos.presionado]}>
      <Text style={[estilos.filaTxt, { color }]}>{etiqueta}</Text>
      {icono}
    </Pressable>
  );
}

export default function Perfil()
{
  const { colores } = useTema();
  const { id, usuario, avatar } = useLocalSearchParams();
  const [presencia, setPresencia] = useState(null);
  const [confirmar, setConfirmar] = useState(null);
  const [media, setMedia] = useState([]);
  const [seguridad, setSeguridad] = useState(null);

  useEffect(() =>
  {
    api.presencia(id).then(setPresencia).catch(() => {});
  }, [id]);

  useEffect(() =>
  {
    (async () =>
    {
      const mia = await leer(CLAVE_PUBLICA);
      const suya = await llavePublicaDe(id).catch(() => null);
      setSeguridad(numeroSeguridad(mia, suya));
    })();
  }, [id]);

  useEffect(() =>
  {
    let activo = true;
    (async () =>
    {
      try
      {
        const filas = await api.historial(id);
        const priv = await leer(CLAVE_PRIVADA);
        const pub = await llavePublicaDe(id);
        const items = [];
        for (const f of filas)
        {
          const claro = descifrar(f.contenido_cifrado, f.nonce, pub, priv);
          const m = leerMedia(claro);
          if (m && m.t === "img")
          {
            items.push({ id: f.id, media: m });
          }
        }
        if (activo)
        {
          setMedia(items.reverse());
        }
      }
      catch (e)
      {
      }
    })();
    return () => { activo = false; };
  }, [id]);

  async function borrarConversacion()
  {
    setConfirmar(null);
    try
    {
      await api.limpiarConversacion(id);
    }
    catch (e)
    {
    }
    router.back();
  }

  async function bloquear()
  {
    setConfirmar(null);
    try
    {
      await api.bloquear(id);
    }
    catch (e)
    {
    }
    router.dismissAll();
  }

  const sub = estadoTexto(presencia);
  const enLinea = presencia && presencia.en_linea;

  return (
    <View style={{ flex: 1, backgroundColor: colores.fondo }}>
      <View style={estilos.cabecera}>
        <Avatar nombre={usuario || ""} uri={avatar || null} tamano={108} />
        <Text style={[estilos.nombre, { color: colores.texto }]}>{usuario}</Text>
        {sub ? (
          <View style={estilos.presencia}>
            {enLinea ? <View style={estilos.punto} /> : null}
            <Text style={[estilos.sub, { color: colores.muted }]}>{sub}</Text>
          </View>
        ) : null}
      </View>

      {media.length > 0 ? (
        <View style={estilos.cuerpo}>
          <Text style={[estilos.seccion, { color: colores.muted }]}>MEDIA COMPARTIDA</Text>
          <FlatList
            data={media}
            keyExtractor={(m) => m.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ width: 8 }} />}
            renderItem={({ item }) => <AdjuntoImagen media={item.media} color={colores.muted} cuadrado={84} />}
          />
        </View>
      ) : null}

      <View style={[estilos.cuerpo, { marginTop: 24 }]}>
        <Text style={[estilos.seccion, { color: colores.muted }]}>CONVERSACIÓN</Text>
        <View style={[estilos.tarjeta, { backgroundColor: colores.surface, borderColor: colores.borde }]}>
          <Fila
            etiqueta="Borrar conversación"
            color={colores.texto}
            icono={<Bote color={colores.muted} tamano={18} />}
            onPress={() => setConfirmar("borrar")}
          />
        </View>

        <Text style={[estilos.seccion, { color: colores.muted, marginTop: 24 }]}>PRIVACIDAD</Text>
        <View style={[estilos.tarjeta, { backgroundColor: colores.surface, borderColor: colores.borde }]}>
          <Fila
            etiqueta="Bloquear contacto"
            color={colores.error}
            icono={null}
            onPress={() => setConfirmar("bloquear")}
          />
        </View>
        <Text style={[estilos.nota, { color: colores.muted }]}>
          Al bloquear, esta persona no podrá escribirte y se quitará de tus chats.
        </Text>

        {seguridad ? (
          <>
            <Text style={[estilos.seccion, { color: colores.muted, marginTop: 24 }]}>SEGURIDAD</Text>
            <View style={[estilos.tarjeta, { backgroundColor: colores.surface, borderColor: colores.borde, padding: 16 }]}>
              <Text style={[estilos.numero, { color: colores.texto }]}>{seguridad}</Text>
            </View>
            <Text style={[estilos.nota, { color: colores.muted }]}>
              Número de seguridad. Si coincide con el que ve tu contacto, nadie intercepta su conversación.
            </Text>
          </>
        ) : null}
      </View>

      <Confirmacion
        visible={confirmar === "borrar"}
        titulo="Borrar conversación"
        mensaje="Se quitarán los mensajes de este chat en tu dispositivo."
        textoConfirmar="Borrar"
        destructivo
        onConfirmar={borrarConversacion}
        onCancelar={() => setConfirmar(null)}
      />

      <Confirmacion
        visible={confirmar === "bloquear"}
        titulo={`Bloquear a ${usuario || "este contacto"}`}
        mensaje="No podrá escribirte ni volver a agregarte, y se quitará de tus chats. Podrás desbloquearlo más adelante."
        textoConfirmar="Bloquear"
        destructivo
        onConfirmar={bloquear}
        onCancelar={() => setConfirmar(null)}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  cabecera: { alignItems: "center", gap: 10, paddingTop: 36, paddingBottom: 28 },
  nombre: { fontSize: 22, fontFamily: fuentes.semibold },
  presencia: { flexDirection: "row", alignItems: "center", gap: 6 },
  punto: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#22C55E" },
  sub: { fontSize: 13 },
  cuerpo: { paddingHorizontal: 20 },
  seccion: { fontSize: 12, fontWeight: "600", letterSpacing: 1, marginBottom: 10 },
  tarjeta: { borderWidth: 1, borderRadius: 12, overflow: "hidden" },
  fila: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 15 },
  filaTxt: { fontSize: 15 },
  nota: { fontSize: 12, marginTop: 10, lineHeight: 17 },
  presionado: { opacity: 0.6 },
  numero: { fontSize: 17, fontFamily: fuentes.media, letterSpacing: 2, lineHeight: 28, textAlign: "center" },
});
