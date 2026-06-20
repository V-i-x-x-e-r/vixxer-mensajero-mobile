// app/registro.jsx — Registro.
// LÓGICA (Paola): crear() genera el par de claves (asegurarClaves), registra con la
// llave PÚBLICA, y como el backend NO devuelve token al registrar, hace login
// automático para entrar. La clave privada nunca sale del teléfono.
// VISUAL (Raúl): el JSX de abajo es mínimo y provisional.

import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import * as api from "../lib/api";
import { asegurarClaves } from "../lib/crypto";
import { guardar, TOKEN, MI_ID } from "../lib/storage";

export default function Registro() {
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function crear() {
    setError("");
    setCargando(true);
    try {
      const llave_publica = await asegurarClaves(); // genera/guarda el par; sube la pública
      await api.registrar(usuario.trim(), contrasena, llave_publica); // -> 201
      // El backend no devuelve token en /register: entramos con login.
      const data = await api.login(usuario.trim(), contrasena);
      await guardar(TOKEN, data.token);
      await guardar(MI_ID, data.usuario.id);
      router.replace("/chats");
    } catch (e) {
      if (e.status === 409) setError("Ese usuario ya existe");
      else if (e.status === 422) setError("Usuario (3-20) y contraseña (mín. 6)");
      else setError("No se pudo registrar. ¿Está arriba el backend?");
    } finally {
      setCargando(false);
    }
  }

  // ----- VISUAL provisional (Raúl) -----
  return (
    <View style={s.cont}>
      <Text style={s.titulo}>Crear cuenta</Text>
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
      <Pressable onPress={crear} disabled={cargando} style={s.boton}>
        {cargando ? <ActivityIndicator color="#0f1115" /> : <Text style={s.botonTxt}>Registrarme</Text>}
      </Pressable>
      <Pressable onPress={() => router.back()}>
        <Text style={s.link}>Ya tengo cuenta</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  cont: { flex: 1, justifyContent: "center", padding: 24, gap: 12, backgroundColor: "#0f1115" },
  titulo: { color: "#fff", fontSize: 28, fontWeight: "800", textAlign: "center", marginBottom: 12 },
  campo: { borderWidth: 1, borderColor: "#2a2f3a", borderRadius: 10, padding: 12, color: "#fff" },
  boton: { backgroundColor: "#35d487", borderRadius: 10, padding: 14, alignItems: "center" },
  botonTxt: { color: "#0f1115", fontWeight: "700" },
  error: { color: "#ff6b6b" },
  link: { color: "#65a7ff", textAlign: "center", marginTop: 8 },
});
