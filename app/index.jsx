import { useState, useEffect } from "react";
import { View, Text, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { router } from "expo-router";
import * as api from "../lib/api";
import { guardar, leer, TOKEN, MI_ID } from "../lib/storage";
import { useTema } from "../components/tema";
import { fuentes } from "../assets/themes/temas";
import { Logo } from "../components/Logo";
import { Boton } from "../components/Boton";
import { Campo } from "../components/Campo";
import { BotonTema } from "../components/BotonTema";

export default function Login()
{
  const { colores } = useTema();
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  useEffect(() =>
  {
    leer(TOKEN).then((t) =>
    {
      if (t)
      {
        router.replace("/chats");
      }
    });
  }, []);

  async function entrar()
  {
    setError("");
    setCargando(true);

    try
    {
      const data = await api.login(usuario.trim(), contrasena);
      await guardar(TOKEN, data.token);
      await guardar(MI_ID, data.usuario.id);
      router.replace("/chats");
    }
    catch (e)
    {
      setError(
        e.status === 401
          ? "Usuario o contraseña incorrectos"
          : "No se pudo conectar. ¿Está arriba el backend?",
      );
    }
    finally
    {
      setCargando(false);
    }
  }

  return (
    <View style={[estilos.pantalla, { backgroundColor: colores.fondo }]}>
      <View style={estilos.cabecera}>
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
          <Text style={[estilos.titulo, { color: colores.texto }]}>Iniciar sesión</Text>
          <Text style={[estilos.subtitulo, { color: colores.muted }]}>Bienvenido de vuelta</Text>
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

          <Text style={[estilos.olvido, { color: colores.muted }]}>¿Olvidaste tu contraseña?</Text>

          {error ? <Text style={[estilos.error, { color: colores.error }]}>{error}</Text> : null}

          <Boton titulo="Entrar" onPress={entrar} cargando={cargando} />
        </View>

        <Text style={[estilos.pie, { color: colores.muted }]}>
          ¿No tienes cuenta?{" "}
          <Text
            style={[estilos.enlace, { color: colores.enlace }]}
            onPress={() => router.push("/registro")}
          >
            Regístrate
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
    paddingTop: 64,
  },
  marca: { flexDirection: "row", alignItems: "center", gap: 10 },
  nombre: { fontSize: 18, fontFamily: fuentes.semibold },
  zona: { flex: 1, justifyContent: "center" },
  titulos: { marginBottom: 36 },
  titulo: { fontSize: 24, fontFamily: fuentes.semibold, letterSpacing: -0.5 },
  subtitulo: { marginTop: 4, fontSize: 14 },
  form: { gap: 12 },
  olvido: { alignSelf: "flex-end", fontSize: 12, marginTop: -2 },
  error: { fontSize: 13 },
  pie: { marginTop: 28, textAlign: "center", fontSize: 14 },
  enlace: { fontWeight: "600", textDecorationLine: "underline" },
});
