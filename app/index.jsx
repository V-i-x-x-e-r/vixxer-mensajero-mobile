import { useState, useEffect } from "react";
import { View, Text, KeyboardAvoidingView, Platform,useWindowDimensions,ScrollView, StyleSheet } from "react-native";
import { router } from "expo-router";
import * as api from "../lib/api";
import { guardar, leer, TOKEN, MI_ID } from "../lib/storage";
import { colores } from "../assets/themes/colores";
import { Boton } from "../components/Boton";
import { Campo } from "../components/Campo";

export default function Login() {
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
   const { width } = useWindowDimensions();

   const isSmall = width < 600;
  const maxWidth = isSmall ? '100%' : 420;
  const paddingHorizontal = isSmall ? 24 : 40;


  useEffect(() => {
    leer(TOKEN).then((t) => {
      if (t) router.replace("/chats");
    });
  }, []);

  async function entrar() {
    setError("");
    setCargando(true);

    // ---- BACKDOOR para pruebas (eliminar después) ----
    if (usuario.trim() === "admin" && contrasena === "123456") {
      await guardar(TOKEN, "fake-token-admin");
      await guardar(MI_ID, "admin-id-123");
      setCargando(false);
      router.replace("/chats");
      return;
    }
    // ------------------------------------------------

    try {
      const data = await api.login(usuario.trim(), contrasena);
      await guardar(TOKEN, data.token);
      await guardar(MI_ID, data.usuario.id);
      router.replace("/chats");
    } catch (e) {
      setError(
        e.status === 401
          ? "Usuario o contraseña incorrectos"
          : "No se pudo conectar. ¿Está arriba el backend?",
      );
    } finally {
      setCargando(false);
    }
  }

      return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.card}>
        <Text style={styles.titulo}>Vixxer</Text>

        <Campo valor={usuario} setValor={setUsuario} placeholder="Usuario" />
        <Campo
          valor={contrasena}
          setValor={setContrasena}
          placeholder="Contraseña"
          secureTextEntry
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Boton titulo="Entrar" onPress={entrar} cargando={cargando} />

        <Text style={styles.link} onPress={() => router.push("/registro")}>
          ¿No tienes cuenta? Regístrate
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colores.fondo,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400, // en web no se estira más allá
    backgroundColor: colores.surface,
    borderRadius: 20,
    padding: 24,
    gap: 16,
    // Sombra suave (opcional)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  titulo: {
    fontSize: 36,
    fontWeight: '800',
    color: colores.azul,
    textAlign: 'center',
    marginBottom: 8,
  },
  error: {
    color: colores.error,
    textAlign: 'center',
    backgroundColor: 'rgba(255,107,107,0.1)',
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
  },
  link: {
    color: colores.azul,
    textAlign: 'center',
    marginTop: 4,
    fontSize: 15,
  },
});