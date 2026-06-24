import { useState } from "react";
import { View, Text, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as api from "../lib/api";
import { asegurarClaves } from "../lib/crypto";
import { guardar, TOKEN, MI_ID } from "../lib/storage";
import { useTema } from "../components/tema";
import { fuentes } from "../assets/themes/temas";
import { Logo } from "../components/Logo";
import { Boton } from "../components/Boton";
import { Campo } from "../components/Campo";
import { BotonTema } from "../components/BotonTema";

export default function Registro()
{
  const { colores } = useTema();
  const insets = useSafeAreaInsets();
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function crear()
  {
    const u = usuario.trim();
    if (u.length < 3 || u.length > 20)
    {
      setError("El usuario debe tener entre 3 y 20 caracteres");
      return;
    }
    if (contrasena.length < 6)
    {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    setError("");
    setCargando(true);

    try
    {
      const llave_publica = await asegurarClaves();
      await api.registrar(usuario.trim(), contrasena, llave_publica);
      const data = await api.login(usuario.trim(), contrasena);
      await guardar(TOKEN, data.token);
      await guardar(MI_ID, data.usuario.id);
      router.replace("/chats");
    }
    catch (e)
    {
      if (e.status === 409)
      {
        setError("Ese usuario ya existe");
      }
      else if (e.status === 422)
      {
        setError("Usuario (3-20) y contraseña (mín. 6)");
      }
      else
      {
        setError("No se pudo registrar. ¿Está arriba el backend?");
      }
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
        <BotonTema />
      </View>

      <KeyboardAvoidingView
        style={estilos.zona}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={estilos.titulos}>
          <Text style={[estilos.titulo, { color: colores.texto }]}>Crear cuenta</Text>
          <Text style={[estilos.subtitulo, { color: colores.muted }]}>Sin correo, sin teléfono</Text>
        </View>

        <View style={estilos.form}>
          <Campo
            valor={usuario}
            setValor={setUsuario}
            placeholder="Usuario"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Campo
            valor={contrasena}
            setValor={setContrasena}
            placeholder="Contraseña"
            secureTextEntry
          />

          {error ? <Text style={[estilos.error, { color: colores.error }]}>{error}</Text> : null}

          <Boton titulo="Registrarme" onPress={crear} cargando={cargando} />
        </View>

        <Text style={[estilos.pie, { color: colores.muted }]}>
          ¿Ya tienes cuenta?{" "}
          <Text
            style={[estilos.enlace, { color: colores.enlace }]}
            onPress={() => router.back()}
          >
            Inicia sesión
          </Text>
        </Text>
      </KeyboardAvoidingView>
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, paddingHorizontal: 28 },
  cabecera:
  {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  marca: { flexDirection: "row", alignItems: "center", gap: 10 },
  nombre: { fontSize: 18, fontFamily: fuentes.semibold },
  zona: { flex: 1, justifyContent: "center" },
  titulos: { marginBottom: 36 },
  titulo: { fontSize: 24, fontFamily: fuentes.semibold, letterSpacing: -0.5 },
  subtitulo: { marginTop: 4, fontSize: 14 },
  form: { gap: 12 },
  error: { fontSize: 13 },
  pie: { marginTop: 28, textAlign: "center", fontSize: 14 },
  enlace: { fontWeight: "600", textDecorationLine: "underline" },
});
