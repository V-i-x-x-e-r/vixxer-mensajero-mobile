import { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as api from "../../lib/api";
import { useTema } from "../../components/tema";
import { fuentes } from "../../assets/themes/temas";
import { Avatar } from "../../components/Avatar";
import { Confirmacion } from "../../components/Confirmacion";

function estadoTexto(presencia)
{
  if (!presencia)
  {
    return "";
  }
  if (presencia.en_linea)
  {
    return "en línea";
  }
  if (presencia.ultima_conexion)
  {
    return `últ. vez ${new Date(presencia.ultima_conexion).toLocaleString()}`;
  }
  return "";
}

export default function Perfil()
{
  const { colores } = useTema();
  const { id, usuario, avatar } = useLocalSearchParams();
  const [presencia, setPresencia] = useState(null);
  const [confirmar, setConfirmar] = useState(false);

  useEffect(() =>
  {
    api.presencia(id).then(setPresencia).catch(() => {});
  }, [id]);

  async function borrar()
  {
    setConfirmar(false);
    try
    {
      await api.limpiarConversacion(id);
    }
    catch (e)
    {
    }
    router.back();
  }

  const sub = estadoTexto(presencia);

  return (
    <View style={{ flex: 1, backgroundColor: colores.fondo }}>
      <View style={estilos.cabecera}>
        <Avatar nombre={usuario || ""} uri={avatar || null} tamano={104} />
        <Text style={[estilos.nombre, { color: colores.texto }]}>{usuario}</Text>
        {sub ? <Text style={[estilos.sub, { color: colores.muted }]}>{sub}</Text> : null}
      </View>

      <View style={estilos.cuerpo}>
        <Pressable onPress={() => setConfirmar(true)} style={({ pressed }) => [estilos.accion, { borderColor: colores.borde }, pressed && estilos.presionado]}>
          <Text style={[estilos.accionTxt, { color: colores.error }]}>Borrar conversación</Text>
        </Pressable>
      </View>

      <Confirmacion
        visible={confirmar}
        titulo="Borrar conversación"
        mensaje="Se quitarán los mensajes de este chat en tu dispositivo."
        textoConfirmar="Borrar"
        destructivo
        onConfirmar={borrar}
        onCancelar={() => setConfirmar(false)}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  cabecera: { alignItems: "center", gap: 8, paddingTop: 32, paddingBottom: 28 },
  nombre: { fontSize: 22, fontFamily: fuentes.semibold },
  sub: { fontSize: 13 },
  cuerpo: { paddingHorizontal: 20 },
  accion: { borderWidth: 1, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  accionTxt: { fontSize: 15, fontWeight: "600" },
  presionado: { opacity: 0.6 },
});
