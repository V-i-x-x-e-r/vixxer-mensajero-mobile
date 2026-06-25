import { useEffect, useState } from "react";
import { View, Text, Pressable, Switch, ScrollView, StyleSheet } from "react-native";
import { router } from "expo-router";
import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";
import * as api from "../lib/api";
import { cerrarSesion } from "../lib/storage";
import { desconectarSocket } from "../lib/socket";
import { useTema } from "../components/tema";
import { fuentes } from "../assets/themes/temas";
import { BotonTema } from "../components/BotonTema";
import { Confirmacion } from "../components/Confirmacion";
import { Avatar } from "../components/Avatar";

export default function Ajustes()
{
  const { colores } = useTema();
  const [usuario, setUsuario] = useState("");
  const [codigo, setCodigo] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [copiado, setCopiado] = useState(false);
  const [prefs, setPrefs] = useState({ mostrar_conexion: true, mostrar_acuses: true });
  const [confirmar, setConfirmar] = useState(false);

  useEffect(() =>
  {
    api.miCodigo().then((d) =>
    {
      setUsuario(d.usuario);
      setCodigo(d.codigo);
      setAvatar(d.avatar_url);
    }).catch(() => {});
    api.preferencias().then(setPrefs).catch(() => {});
  }, []);

  async function cambiarFoto()
  {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted)
    {
      return;
    }
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
      base64: true,
    });
    if (r.canceled)
    {
      return;
    }
    try
    {
      const res = await api.subirAvatar(r.assets[0].base64, "image/jpeg");
      setAvatar(res.avatar_url);
    }
    catch (e)
    {
    }
  }

  function cambiar(clave, valor)
  {
    setPrefs((p) => ({ ...p, [clave]: valor }));
    api.actualizarPreferencias({ [clave]: valor }).catch(() => {});
  }

  async function copiar()
  {
    if (!codigo)
    {
      return;
    }
    await Clipboard.setStringAsync(codigo);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1500);
  }

  async function cerrar()
  {
    setConfirmar(false);
    desconectarSocket();
    await cerrarSesion();
    router.replace("/");
  }

  return (
    <View style={{ flex: 1, backgroundColor: colores.fondo }}>
      <ScrollView contentContainerStyle={estilos.pantalla} showsVerticalScrollIndicator={false}>
      <View style={estilos.perfil}>
        <Pressable onPress={cambiarFoto} style={({ pressed }) => pressed && estilos.presionado}>
          <Avatar nombre={usuario} uri={avatar} tamano={92} />
        </Pressable>
        <Text style={[estilos.usuario, { color: colores.texto }]}>{usuario}</Text>
        <Text style={[estilos.cambiar, { color: colores.muted }]}>tocar la foto para cambiarla</Text>
      </View>

      <Text style={[estilos.seccion, { color: colores.muted }]}>TU CÓDIGO DE AMIGO</Text>
      <Pressable onPress={copiar} style={({ pressed }) => [estilos.codigoCaja, { borderColor: colores.borde }, pressed && estilos.presionado]}>
        <Text style={[estilos.codigo, { color: colores.texto }]}>{codigo || "…"}</Text>
        <Text style={[estilos.copiar, { color: colores.muted }]}>{copiado ? "copiado" : "tocar para copiar"}</Text>
      </Pressable>

      <Text style={[estilos.seccion, { color: colores.muted, marginTop: 24 }]}>APARIENCIA</Text>
      <View style={[estilos.fila, { borderColor: colores.borde }]}>
        <Text style={[estilos.etiqueta, { color: colores.texto }]}>Tema claro / oscuro</Text>
        <BotonTema />
      </View>

      <Text style={[estilos.seccion, { color: colores.muted, marginTop: 24 }]}>PRIVACIDAD</Text>
      <View style={[estilos.fila, { borderColor: colores.borde }]}>
        <Text style={[estilos.etiqueta, { color: colores.texto }]}>Mostrar mi conexión</Text>
        <Switch
          value={prefs.mostrar_conexion}
          onValueChange={(v) => cambiar("mostrar_conexion", v)}
          trackColor={{ true: colores.texto, false: colores.borde }}
          thumbColor={colores.fondo}
          ios_backgroundColor={colores.borde}
        />
      </View>
      <View style={[estilos.fila, { borderColor: colores.borde, marginTop: 8 }]}>
        <Text style={[estilos.etiqueta, { color: colores.texto }]}>Acuses de lectura</Text>
        <Switch
          value={prefs.mostrar_acuses}
          onValueChange={(v) => cambiar("mostrar_acuses", v)}
          trackColor={{ true: colores.texto, false: colores.borde }}
          thumbColor={colores.fondo}
          ios_backgroundColor={colores.borde}
        />
      </View>

      <Text style={[estilos.seccion, { color: colores.muted, marginTop: 24 }]}>CUENTA</Text>
      <Pressable onPress={() => setConfirmar(true)} style={({ pressed }) => [estilos.salir, { borderColor: colores.borde }, pressed && estilos.presionado]}>
        <Text style={[estilos.salirTxt, { color: colores.error }]}>Cerrar sesión</Text>
      </Pressable>
      </ScrollView>

      <Confirmacion
        visible={confirmar}
        titulo="Cerrar sesión"
        mensaje="¿Seguro que quieres salir?"
        textoConfirmar="Salir"
        destructivo
        onConfirmar={cerrar}
        onCancelar={() => setConfirmar(false)}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: { padding: 20, paddingBottom: 48 },
  perfil: { alignItems: "center", gap: 8, marginBottom: 24 },
  usuario: { fontSize: 18, fontFamily: fuentes.semibold },
  cambiar: { fontSize: 12 },
  seccion: { fontSize: 12, fontWeight: "600", letterSpacing: 1, marginBottom: 10 },
  codigoCaja: { borderWidth: 1, borderRadius: 12, paddingVertical: 18, alignItems: "center", gap: 6 },
  codigo: { fontSize: 28, fontFamily: fuentes.bold, letterSpacing: 4 },
  copiar: { fontSize: 12 },
  fila:
  {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  etiqueta: { fontSize: 15 },
  salir: { borderWidth: 1, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  salirTxt: { fontSize: 15, fontWeight: "600" },
  presionado: { opacity: 0.6 },
});
