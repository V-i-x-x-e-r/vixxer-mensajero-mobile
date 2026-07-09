import { useState, useEffect } from "react";
import { View, Text, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as api from "../lib/api";
import { registrarPush } from "../lib/push";
import { publicarLlaveFirma } from "../lib/firma";
import { guardar, leer, TOKEN, MI_ID, CLAVE_PRIVADA, CLAVE_PUBLICA } from "../lib/storage";
import { useTema } from "../components/tema";
import { fuentes } from "../assets/themes/temas";
import { LogoPendulo } from "../components/LogoPendulo";
import { Boton } from "../components/Boton";
import { Campo } from "../components/Campo";
import { BotonTema } from "../components/BotonTema";
import { Confirmacion } from "../components/Confirmacion";

export default function Login()
{
  const { coloresAuth: colores } = useTema();
  const insets = useSafeAreaInsets();
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [olvido, setOlvido] = useState(false);

  async function entrarTrasSesion()
  {
    const priv = await leer(CLAVE_PRIVADA);
    if (priv)
    {
      const pub = await leer(CLAVE_PUBLICA);
      api.actualizarLlavePublica(pub).catch(() => {});
      publicarLlaveFirma().catch(() => {});
      registrarPush();
      router.replace("/chats");
      return;
    }
    router.replace("/recuperar");
  }

  useEffect(() =>
  {
    leer(TOKEN).then((t) =>
    {
      if (t)
      {
        entrarTrasSesion();
      }
    });
  }, []);

  async function entrar()
  {
    if (!usuario.trim() || !contrasena)
    {
      setError("Escribe tu usuario y contraseña");
      return;
    }
    setError("");
    setCargando(true);

    try
    {
      const data = await api.login(usuario.trim(), contrasena);
      await guardar(TOKEN, data.token);
      await guardar(MI_ID, data.usuario.id);
      await entrarTrasSesion();
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
      <View style={[estilos.cabecera, { paddingTop: insets.top + 16 }]}>
        <BotonTema />
      </View>

      <KeyboardAvoidingView
        style={estilos.zona}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={estilos.logoHero}>
          <LogoPendulo variante="login" alto={144} colorTexto={colores.texto} />
        </View>
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

          <Text style={[estilos.olvido, { color: colores.muted }]} onPress={() => setOlvido(true)}>¿Olvidaste tu contraseña?</Text>

          {error ? <Text style={[estilos.error, { color: colores.error }]}>{error}</Text> : null}

          <Boton titulo="Entrar" onPress={entrar} cargando={cargando} glass />
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

      <Confirmacion
        visible={olvido}
        titulo="¿Olvidaste tu contraseña?"
        mensaje="Vixxer no pide correo ni teléfono, así que nadie puede restablecerla por ti. Si la recuerdas más tarde, entra normal. Si no, crea una cuenta nueva y comparte tu código de amigo otra vez."
        textoConfirmar="Crear cuenta"
        textoCancelar="Entendido"
        onConfirmar={() => { setOlvido(false); router.push("/registro"); }}
        onCancelar={() => setOlvido(false)}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, paddingHorizontal: 28 },
  cabecera:
  {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  zona: { flex: 1, justifyContent: "center", paddingBottom: 72 },
  logoHero: { alignItems: "center", marginBottom: 12 },
  titulos: { marginBottom: 18 },
  titulo: { fontSize: 24, fontFamily: fuentes.semibold, letterSpacing: -0.5 },
  subtitulo: { marginTop: 4, fontSize: 14 },
  form: { gap: 10 },
  olvido: { alignSelf: "flex-end", fontSize: 12, marginTop: -2 },
  error: { fontSize: 13 },
  pie: { marginTop: 22, textAlign: "center", fontSize: 14 },
  enlace: { fontWeight: "600", textDecorationLine: "underline" },
});
