// app/registro.jsx — Registro.
// LÓGICA (Paola): crear() genera el par de claves (asegurarClaves), registra con la
// llave PÚBLICA, y como el backend NO devuelve token al registrar, hace login
// automático para entrar. La clave privada nunca sale del teléfono.
// VISUAL (Raúl): el JSX de abajo es mínimo y provisional.

import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator,KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import * as api from "../lib/api";
import { asegurarClaves } from "../lib/crypto";
import { guardar, TOKEN, MI_ID } from "../lib/storage";
import { colores } from "../assets/themes/colores";
import { Boton } from "../components/Boton";
import { Campo } from "../components/Campo";

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
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.card}>
        <Text style={styles.titulo}>Crear cuenta</Text>

        <Campo valor={usuario} setValor={setUsuario} placeholder="Usuario" />
        <Campo
          valor={contrasena}
          setValor={setContrasena}
          placeholder="Contraseña"
          secureTextEntry
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Boton titulo="Registrarme" onPress={crear} cargando={cargando} />

        <Text style={styles.link} onPress={() => router.back()}>
          Ya tengo cuenta
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
    maxWidth: 400,
    backgroundColor: colores.surface,
    borderRadius: 20,
    padding: 24,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  titulo: {
    fontSize: 32,
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