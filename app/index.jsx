// app/index.jsx — Login.
// LÓGICA (Paola): entrar(), sesión persistente, navegación. Es lo que de verdad
// importa de esta pantalla.
// VISUAL (Raúl): todo el JSX de abajo es un layout MÍNIMO y provisional. Rehazlo
// con los componentes y estilos de la app. No cambies la lógica de entrar().

import { useState, useEffect } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import * as api from "../lib/api";
import { guardar, leer, TOKEN, MI_ID } from "../lib/storage";

export default function Login() {
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  // Sesión persistente: si ya hay token guardado, entra directo (sin volver a loguear).
  useEffect(() => {
    leer(TOKEN).then((t) => {
      if (t) router.replace("/chats");
    });
  }, []);

  async function entrar() {
    setError("");
    setCargando(true);
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

  // ----- VISUAL provisional (Raúl) -----
  return (
    <View style={s.cont}>
      <Text style={s.titulo}>Vixxer</Text>
      <TextInput
        value={usuario}
        onChangeText={setUsuario}
        placeholder="Usuario"
        placeholderTextColor="#7c8597"
        autoCapitalize="none"
        style={s.campo}
      />
      <TextInput
        value={contrasena}
        onChangeText={setContrasena}
        placeholder="Contraseña"
        placeholderTextColor="#7c8597"
        secureTextEntry
        style={s.campo}
      />
      {error ? <Text style={s.error}>{error}</Text> : null}
      <Pressable onPress={entrar} disabled={cargando} style={s.boton}>
        {cargando ? <ActivityIndicator color="#0f1115" /> : <Text style={s.botonTxt}>Entrar</Text>}
      </Pressable>
      <Pressable onPress={() => router.push("/registro")}>
        <Text style={s.link}>¿No tienes cuenta? Crea una</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  cont: { flex: 1, justifyContent: "center", padding: 24, gap: 12, backgroundColor: "#0f1115" },
  titulo: { color: "#35d487", fontSize: 40, fontWeight: "800", textAlign: "center", marginBottom: 12 },
  campo: { borderWidth: 1, borderColor: "#2a2f3a", borderRadius: 10, padding: 12, color: "#fff" },
  boton: { backgroundColor: "#35d487", borderRadius: 10, padding: 14, alignItems: "center" },
  botonTxt: { color: "#0f1115", fontWeight: "700" },
  error: { color: "#ff6b6b" },
  link: { color: "#65a7ff", textAlign: "center", marginTop: 8 },
});
