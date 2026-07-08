import { useState } from "react";
import { View, Text, Pressable, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as api from "../lib/api";
import { restaurarDeRespaldo, crearIdentidad } from "../lib/crypto";
import { publicarLlaveFirma } from "../lib/firma";
import { importarRespaldoArchivo } from "../lib/respaldo";
import { useTema } from "../components/tema";
import { fuentes } from "../assets/themes/temas";
import { Logo } from "../components/Logo";
import { Boton } from "../components/Boton";
import { Campo } from "../components/Campo";
import { RespaldoCodigo } from "../components/RespaldoCodigo";
import { Confirmacion } from "../components/Confirmacion";
import { EscanerQR } from "../components/EscanerQR";
import { PREFIJO_VINCULO } from "../components/VincularDispositivo";

export default function Recuperar()
{
  const { coloresAuth: colores } = useTema();
  const insets = useSafeAreaInsets();
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [nuevoCodigo, setNuevoCodigo] = useState("");
  const [confirmarNuevo, setConfirmarNuevo] = useState(false);
  const [archivo, setArchivo] = useState(null);
  const [escaneando, setEscaneando] = useState(false);

  async function elegirArchivo()
  {
    try
    {
      const respaldo = await importarRespaldoArchivo();
      if (respaldo)
      {
        setArchivo(respaldo);
        setError("");
      }
    }
    catch (e)
    {
    }
  }

  function alLeerQR(valor)
  {
    setEscaneando(false);
    if (!valor.startsWith(PREFIJO_VINCULO))
    {
      setError("Ese QR no es de vincular dispositivo");
      return;
    }
    const leido = valor.slice(PREFIJO_VINCULO.length);
    setCodigo(leido);
    recuperar(leido);
  }

  async function recuperar(codigoQR)
  {
    const cod = typeof codigoQR === "string" ? codigoQR : codigo;
    if (!cod.trim())
    {
      setError("Escribe tu código de recuperación");
      return;
    }
    setError("");
    setCargando(true);

    try
    {
      const respaldo = archivo || await api.obtenerRespaldo();
      const pub = await restaurarDeRespaldo(respaldo, cod);
      if (!pub)
      {
        setError("Código incorrecto. Revísalo e intenta de nuevo.");
        return;
      }
      await api.actualizarLlavePublica(pub).catch(() => {});
      await publicarLlaveFirma().catch(() => {});
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
    setConfirmarNuevo(false);
    setError("");
    setCargando(true);
    try
    {
      const identidad = await crearIdentidad();
      await api.actualizarLlavePublica(identidad.publicKey).catch(() => {});
      await publicarLlaveFirma().catch(() => {});
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

          <Boton titulo="Recuperar" onPress={() => recuperar()} cargando={cargando} />

          <View style={estilos.opciones}>
            {Platform.OS !== "web" ? (
              <Pressable onPress={() => setEscaneando(true)} style={({ pressed }) => [estilos.opcion, { borderColor: colores.borde }, pressed && estilos.presionado]}>
                <Text style={[estilos.opcionTxt, { color: colores.texto }]}>Escanear desde tu otro teléfono</Text>
              </Pressable>
            ) : null}
            <Pressable onPress={elegirArchivo} style={({ pressed }) => [estilos.opcion, { borderColor: colores.borde }, pressed && estilos.presionado]}>
              <Text style={[estilos.opcionTxt, { color: archivo ? colores.botonFondo : colores.texto }]}>
                {archivo ? "Archivo cargado ✓ — escribe tu código" : "Restaurar desde un archivo"}
              </Text>
            </Pressable>
            <Pressable onPress={() => setConfirmarNuevo(true)} style={({ pressed }) => [estilos.opcion, { borderColor: colores.borde }, pressed && estilos.presionado]}>
              <Text style={[estilos.opcionTxt, { color: colores.texto }]}>No tengo el código — empezar de nuevo</Text>
            </Pressable>
          </View>
          <Text style={[estilos.aviso, { color: colores.muted }]}>
            Empezar de nuevo descarta el historial cifrado anterior.
          </Text>
        </View>
      </KeyboardAvoidingView>

      <EscanerQR visible={escaneando} onLeido={alLeerQR} onCerrar={() => setEscaneando(false)} />

      <RespaldoCodigo
        visible={!!nuevoCodigo}
        codigo={nuevoCodigo}
        onCerrar={() => router.replace("/chats")}
      />

      <Confirmacion
        visible={confirmarNuevo}
        titulo="Empezar de nuevo"
        mensaje="Sin tu código de recuperación perderás para siempre el acceso a los mensajes anteriores, tuyos y los de tus chats. Esto no se puede deshacer."
        textoConfirmar="Crear identidad nueva"
        destructivo
        onConfirmar={empezarDeNuevo}
        onCancelar={() => setConfirmarNuevo(false)}
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
  opciones: { marginTop: 16, gap: 10 },
  opcion: { borderWidth: 1, borderRadius: 12, paddingVertical: 13, alignItems: "center" },
  opcionTxt: { fontSize: 14, fontFamily: fuentes.media },
  presionado: { opacity: 0.6 },
  aviso: { textAlign: "center", fontSize: 12, marginTop: 10 },
});
