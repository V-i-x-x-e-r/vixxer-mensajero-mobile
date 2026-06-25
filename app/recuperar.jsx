import { useState } from "react";
import { View, Text, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as api from "../lib/api";
import { restaurarDeRespaldo, crearIdentidad } from "../lib/crypto";
import { useTema } from "../components/tema";
import { fuentes } from "../assets/themes/temas";
import { Logo } from "../components/Logo";
import { Boton } from "../components/Boton";
import { Campo } from "../components/Campo";
import { RespaldoCodigo } from "../components/RespaldoCodigo";

export default function Recuperar()
{
  const { colores } = useTema();
  const insets = useSafeAreaInsets();
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [nuevoCodigo, setNuevoCodigo] = useState("");

  async function recuperar()
  {
    if (!codigo.trim())
    {
      setError("Escribe tu código de recuperación");
      return;
    }
    setError("");
    setCargando(true);

    try
    {
      const respaldo = await api.obtenerRespaldo();
      const pub = await restaurarDeRespaldo(respaldo, codigo);
      if (!pub)
      {
        setError("Código incorrecto. Revísalo e intenta de nuevo.");
        return;
      }
      await api.actualizarLlavePublica(pub).catch(() => {});
      router.replace("/chats");
    }
    catch (e)
    {
      setError("No se pudo recuperar. Revisa tu conexión.");
    }
    finally
    {
      setCargando(false);
    }
  }

  async function empezarDeNuevo()
  {
    setError("");
    setCargando(true);
    try
    {
      const identidad = await crearIdentidad();
      await api.actualizarLlavePublica(identidad.publicKey).catch(() => {});
      await api.subirRespaldo(identidad.respaldo).catch(() => {});
      setNuevoCodigo(identidad.codigo);
    }
    catch (e)
    {
      setError("No se pudo crear una identidad nueva.");
    }
    finally
    {
      setCargando(false);
    }
  }

  return (
    <View style={[estilos.pantalla, { backgroundColor: colores.fondo }]}>
      <View style={[estilos.cabecera, { paddingTop: insets.top + 16 }]}>
        <View style={estilos.marca}>
          <Logo alto={26} />
          <Text style={[estilos.nombre, { color: colores.texto }]}>Vixxer</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={estilos.zona}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={estilos.titulos}>
          <Text style={[estilos.titulo, { color: colores.texto }]}>Recuperar tus chats</Text>
          <Text style={[estilos.subtitulo, { color: colores.muted }]}>
            Escribe el código de recuperación que guardaste al crear tu cuenta.
          </Text>
        </View>

        <View style={estilos.form}>
          <Campo
            valor={codigo}
            setValor={setCodigo}
            placeholder="Código de recuperación"
            autoCapitalize="characters"
            autoCorrect={false}
          />

          {error ? <Text style={[estilos.error, { color: colores.error }]}>{error}</Text> : null}

          <Boton titulo="Recuperar" onPress={recuperar} cargando={cargando} />

          <Text style={[estilos.nuevo, { color: colores.muted }]} onPress={empezarDeNuevo}>
            No tengo el código · empezar de nuevo
          </Text>
          <Text style={[estilos.aviso, { color: colores.muted }]}>
            Empezar de nuevo descarta el historial cifrado anterior.
          </Text>
        </View>
      </KeyboardAvoidingView>

      <RespaldoCodigo
        visible={!!nuevoCodigo}
        codigo={nuevoCodigo}
        onCerrar={() => router.replace("/chats")}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, paddingHorizontal: 28 },
  cabecera: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  marca: { flexDirection: "row", alignItems: "center", gap: 10 },
  nombre: { fontSize: 18, fontFamily: fuentes.semibold },
  zona: { flex: 1, justifyContent: "center" },
  titulos: { marginBottom: 36 },
  titulo: { fontSize: 24, fontFamily: fuentes.semibold, letterSpacing: -0.5 },
  subtitulo: { marginTop: 6, fontSize: 14, lineHeight: 20 },
  form: { gap: 12 },
  error: { fontSize: 13 },
  nuevo: { marginTop: 16, textAlign: "center", fontSize: 14, textDecorationLine: "underline" },
  aviso: { textAlign: "center", fontSize: 12 },
});
