import { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, Switch, ScrollView, Modal, StyleSheet } from "react-native";
import { router } from "expo-router";
import Constants from "expo-constants";
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
import { CodigoQR } from "../components/CodigoQR";
import { ConfigurarPin } from "../components/ConfigurarPin";
import { tienePin, quitarPin } from "../lib/pin";
import { biometricoDisponible, biometricoActivo, activarBiometrico } from "../lib/biometrico";
import { capturasBloqueadas, guardarBloqueoCapturas } from "../lib/privacidad";
import { RespaldoCodigo } from "../components/RespaldoCodigo";
import { leerConfig, guardarConfig, FRECUENCIAS, ETIQUETA_FRECUENCIA } from "../lib/respaldoConfig";
import { hacerRespaldo, exportarRespaldoLocal } from "../lib/respaldo";
import { cercaniaSoportada, modoGuardado, activarModo } from "../lib/cercania";

export default function Ajustes()
{
  const { colores } = useTema();
  const [usuario, setUsuario] = useState("");
  const [codigo, setCodigo] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [copiado, setCopiado] = useState(false);
  const [qr, setQr] = useState(false);
  const [pinActivo, setPinActivo] = useState(false);
  const [configPin, setConfigPin] = useState(false);
  const [bioActivo, setBioActivo] = useState(false);
  const [bioHay, setBioHay] = useState(false);
  const [capturas, setCapturas] = useState(false);
  const [prefs, setPrefs] = useState({ mostrar_conexion: true, mostrar_acuses: true });
  const [confirmar, setConfirmar] = useState(false);
  const [respaldoCfg, setRespaldoCfg] = useState({ frecuencia: "nunca", hora: 3, destino: "nube", ultimo: null });
  const [respaldando, setRespaldando] = useState(false);
  const [nuevoCodigo, setNuevoCodigo] = useState("");
  const [cercania, setCercania] = useState(false);
  const [cambiandoPass, setCambiandoPass] = useState(false);
  const [passActual, setPassActual] = useState("");
  const [passNueva, setPassNueva] = useState("");
  const [passRepetir, setPassRepetir] = useState("");
  const [passError, setPassError] = useState("");
  const [passOcupado, setPassOcupado] = useState(false);
  const [passListo, setPassListo] = useState(false);

  useEffect(() =>
  {
    api.miCodigo().then((d) =>
    {
      setUsuario(d.usuario);
      setCodigo(d.codigo);
      setAvatar(d.avatar_url);
    }).catch(() => {});
    api.preferencias().then(setPrefs).catch(() => {});
    tienePin().then(setPinActivo);
    biometricoDisponible().then(setBioHay);
    biometricoActivo().then(setBioActivo);
    capturasBloqueadas().then(setCapturas);
    leerConfig().then(setRespaldoCfg);
    modoGuardado().then(setCercania);
  }, []);

  async function alternarCercania(valor)
  {
    setCercania(valor);
    const activo = await activarModo(valor);
    if (valor && !activo)
    {
      setCercania(false);
    }
  }

  function guardarRespaldoCfg(cambios)
  {
    setRespaldoCfg((c) =>
    {
      const nueva = { ...c, ...cambios };
      guardarConfig(nueva);
      return nueva;
    });
  }

  function cambiarFrecuencia()
  {
    const i = FRECUENCIAS.indexOf(respaldoCfg.frecuencia);
    guardarRespaldoCfg({ frecuencia: FRECUENCIAS[(i + 1) % FRECUENCIAS.length] });
  }

  function cambiarHora()
  {
    guardarRespaldoCfg({ hora: (respaldoCfg.hora + 1) % 24 });
  }

  function cambiarDestino()
  {
    guardarRespaldoCfg({ destino: respaldoCfg.destino === "nube" ? "local" : "nube" });
  }

  async function hacerCopiaAhora()
  {
    setRespaldando(true);
    try
    {
      const codigo = respaldoCfg.destino === "local" ? await exportarRespaldoLocal() : await hacerRespaldo();
      if (codigo)
      {
        setNuevoCodigo(codigo);
        setRespaldoCfg((c) => ({ ...c, ultimo: new Date().toISOString() }));
      }
    }
    catch (e)
    {
    }
    setRespaldando(false);
  }

  function alternarBio(valor)
  {
    setBioActivo(valor);
    activarBiometrico(valor);
  }

  function alternarCapturas(valor)
  {
    setCapturas(valor);
    guardarBloqueoCapturas(valor);
  }

  function alternarPin(valor)
  {
    if (valor)
    {
      setConfigPin(true);
    }
    else
    {
      quitarPin();
      setPinActivo(false);
      setBioActivo(false);
      activarBiometrico(false);
    }
  }

  async function cambiarFoto()
  {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted)
    {
      return;
    }
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
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

  function abrirCambioPass()
  {
    setPassActual("");
    setPassNueva("");
    setPassRepetir("");
    setPassError("");
    setPassListo(false);
    setCambiandoPass(true);
  }

  async function confirmarCambioPass()
  {
    if (passNueva.length < 6)
    {
      setPassError("La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (passNueva !== passRepetir)
    {
      setPassError("Las contraseñas no coinciden");
      return;
    }
    setPassError("");
    setPassOcupado(true);
    try
    {
      await api.cambiarContrasena(passActual, passNueva);
      setPassListo(true);
      setTimeout(() => setCambiandoPass(false), 1200);
    }
    catch (e)
    {
      setPassError(e.status === 400 ? "La contraseña actual no es correcta" : "No se pudo cambiar. Intenta de nuevo.");
    }
    finally
    {
      setPassOcupado(false);
    }
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
      <Pressable onPress={() => setQr(true)} disabled={!codigo} style={({ pressed }) => [estilos.qrBoton, { borderColor: colores.borde }, pressed && estilos.presionado]}>
        <Text style={[estilos.qrBotonTxt, { color: colores.texto }]}>Mostrar código QR</Text>
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
      <View style={[estilos.fila, { borderColor: colores.borde, marginTop: 8 }]}>
        <Text style={[estilos.etiqueta, { color: colores.texto }]}>Bloqueo con PIN</Text>
        <Switch
          value={pinActivo}
          onValueChange={alternarPin}
          trackColor={{ true: colores.texto, false: colores.borde }}
          thumbColor={colores.fondo}
          ios_backgroundColor={colores.borde}
        />
      </View>
      {pinActivo && bioHay ? (
        <View style={[estilos.fila, { borderColor: colores.borde, marginTop: 8 }]}>
          <Text style={[estilos.etiqueta, { color: colores.texto }]}>Desbloqueo biométrico</Text>
          <Switch
            value={bioActivo}
            onValueChange={alternarBio}
            trackColor={{ true: colores.texto, false: colores.borde }}
            thumbColor={colores.fondo}
            ios_backgroundColor={colores.borde}
          />
        </View>
      ) : null}
      <View style={[estilos.fila, { borderColor: colores.borde, marginTop: 8 }]}>
        <Text style={[estilos.etiqueta, { color: colores.texto }]}>Bloquear capturas de pantalla</Text>
        <Switch
          value={capturas}
          onValueChange={alternarCapturas}
          trackColor={{ true: colores.texto, false: colores.borde }}
          thumbColor={colores.fondo}
          ios_backgroundColor={colores.borde}
        />
      </View>
      <Pressable onPress={() => router.push("/bloqueados")} style={({ pressed }) => [estilos.fila, { borderColor: colores.borde, marginTop: 8 }, pressed && estilos.presionado]}>
        <Text style={[estilos.etiqueta, { color: colores.texto }]}>Usuarios bloqueados</Text>
        <Text style={{ color: colores.muted, fontSize: 18 }}>{"›"}</Text>
      </Pressable>

      {cercaniaSoportada() ? (
        <>
          <Text style={[estilos.seccion, { color: colores.muted, marginTop: 24 }]}>SIN INTERNET</Text>
          <View style={[estilos.fila, { borderColor: colores.borde }]}>
            <Text style={[estilos.etiqueta, { color: colores.texto }]}>Mensajes por cercanía</Text>
            <Switch
              value={cercania}
              onValueChange={alternarCercania}
              trackColor={{ true: colores.texto, false: colores.borde }}
              thumbColor={colores.fondo}
              ios_backgroundColor={colores.borde}
            />
          </View>
          <Text style={[estilos.notaRespaldo, { color: colores.muted }]}>
            Cuando no haya internet, tus mensajes viajan cifrados por Bluetooth entre teléfonos con Vixxer cerca, saltando hasta llegar a su destino o a un teléfono con conexión. Nadie en el camino puede leerlos.
          </Text>
        </>
      ) : null}

      <Text style={[estilos.seccion, { color: colores.muted, marginTop: 24 }]}>COPIA DE SEGURIDAD</Text>
      <View style={[estilos.fila, { borderColor: colores.borde }]}>
        <Text style={[estilos.etiqueta, { color: colores.texto }]}>Frecuencia</Text>
        <Pressable onPress={cambiarFrecuencia} hitSlop={8}>
          <Text style={[estilos.valor, { color: colores.botonFondo }]}>{ETIQUETA_FRECUENCIA[respaldoCfg.frecuencia]}</Text>
        </Pressable>
      </View>
      <View style={[estilos.fila, { borderColor: colores.borde }]}>
        <Text style={[estilos.etiqueta, { color: colores.texto, opacity: respaldoCfg.frecuencia === "nunca" ? 0.4 : 1 }]}>Hora</Text>
        <Pressable onPress={cambiarHora} disabled={respaldoCfg.frecuencia === "nunca"} hitSlop={8}>
          <Text style={[estilos.valor, { color: respaldoCfg.frecuencia === "nunca" ? colores.muted : colores.botonFondo, opacity: respaldoCfg.frecuencia === "nunca" ? 0.4 : 1 }]}>{String(respaldoCfg.hora).padStart(2, "0")}:00</Text>
        </Pressable>
      </View>
      <View style={[estilos.fila, { borderColor: colores.borde }]}>
        <Text style={[estilos.etiqueta, { color: colores.texto }]}>Destino</Text>
        <Pressable onPress={cambiarDestino} hitSlop={8}>
          <Text style={[estilos.valor, { color: colores.botonFondo }]}>{respaldoCfg.destino === "nube" ? "Nube" : "Local"}</Text>
        </Pressable>
      </View>
      <Pressable onPress={hacerCopiaAhora} disabled={respaldando} style={({ pressed }) => [estilos.qrBoton, { borderColor: colores.borde }, pressed && estilos.presionado]}>
        <Text style={[estilos.qrBotonTxt, { color: colores.texto }]}>{respaldando ? "Respaldando…" : "Hacer copia ahora"}</Text>
      </Pressable>
      <Text style={[estilos.notaRespaldo, { color: colores.muted }]}>
        Respalda tu identidad (llave privada cifrada) para recuperar tu cuenta en otro dispositivo. {respaldoCfg.ultimo ? `Última copia: ${new Date(respaldoCfg.ultimo).toLocaleDateString()}.` : "Aún no has hecho una copia."} {respaldoCfg.destino === "local" ? "Guarda bien el código que te damos: es tu copia." : "Se guarda cifrado en el servidor; solo tu código lo abre."}
      </Text>

      <Text style={[estilos.seccion, { color: colores.muted, marginTop: 24 }]}>CUENTA</Text>
      <Pressable onPress={abrirCambioPass} style={({ pressed }) => [estilos.fila, { borderColor: colores.borde }, pressed && estilos.presionado]}>
        <Text style={[estilos.etiqueta, { color: colores.texto }]}>Cambiar contraseña</Text>
        <Text style={{ color: colores.muted, fontSize: 18 }}>{"›"}</Text>
      </Pressable>
      <Pressable onPress={() => setConfirmar(true)} style={({ pressed }) => [estilos.salir, { borderColor: colores.borde, marginTop: 8 }, pressed && estilos.presionado]}>
        <Text style={[estilos.salirTxt, { color: colores.error }]}>Cerrar sesión</Text>
      </Pressable>

      <Text style={[estilos.version, { color: colores.muted }]}>Vixxer {Constants.expoConfig?.version || ""}</Text>
      </ScrollView>

      <CodigoQR visible={qr} codigo={codigo} onCerrar={() => setQr(false)} />

      <RespaldoCodigo visible={!!nuevoCodigo} codigo={nuevoCodigo} onCerrar={() => setNuevoCodigo("")} />

      <Modal transparent visible={cambiandoPass} animationType="fade" onRequestClose={() => setCambiandoPass(false)}>
        <Pressable style={estilos.modalFondo} onPress={() => setCambiandoPass(false)}>
          <Pressable style={[estilos.modalCaja, { backgroundColor: colores.surface, borderColor: colores.borde }]}>
            <Text style={[estilos.modalTitulo, { color: colores.texto }]}>Cambiar contraseña</Text>
            <TextInput
              value={passActual}
              onChangeText={setPassActual}
              placeholder="Contraseña actual"
              placeholderTextColor={colores.placeholder}
              secureTextEntry
              style={[estilos.modalCampo, { color: colores.texto, borderColor: colores.borde }]}
            />
            <TextInput
              value={passNueva}
              onChangeText={setPassNueva}
              placeholder="Nueva contraseña"
              placeholderTextColor={colores.placeholder}
              secureTextEntry
              style={[estilos.modalCampo, { color: colores.texto, borderColor: colores.borde }]}
            />
            <TextInput
              value={passRepetir}
              onChangeText={setPassRepetir}
              placeholder="Repite la nueva contraseña"
              placeholderTextColor={colores.placeholder}
              secureTextEntry
              style={[estilos.modalCampo, { color: colores.texto, borderColor: colores.borde }]}
            />
            {passError ? <Text style={{ color: colores.error, fontSize: 13 }}>{passError}</Text> : null}
            {passListo ? <Text style={{ color: colores.texto, fontSize: 13 }}>Contraseña actualizada.</Text> : null}
            <View style={estilos.modalAcciones}>
              <Pressable onPress={() => setCambiandoPass(false)} style={({ pressed }) => [estilos.modalBoton, { borderColor: colores.borde }, pressed && estilos.presionado]}>
                <Text style={{ color: colores.texto, fontFamily: fuentes.semibold }}>Cancelar</Text>
              </Pressable>
              <Pressable onPress={confirmarCambioPass} disabled={passOcupado || passListo} style={({ pressed }) => [estilos.modalBoton, { backgroundColor: colores.botonFondo, borderColor: colores.botonFondo }, pressed && estilos.presionado]}>
                <Text style={{ color: colores.botonTexto, fontFamily: fuentes.semibold }}>{passOcupado ? "Cambiando…" : "Cambiar"}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <ConfigurarPin
        visible={configPin}
        onListo={() => { setConfigPin(false); setPinActivo(true); }}
        onCerrar={() => setConfigPin(false)}
      />

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
  valor: { fontSize: 15, fontFamily: fuentes.media },
  notaRespaldo: { fontSize: 12, lineHeight: 17, marginTop: 10 },
  codigoCaja: { borderWidth: 1, borderRadius: 12, paddingVertical: 18, alignItems: "center", gap: 6 },
  codigo: { fontSize: 28, fontFamily: fuentes.bold, letterSpacing: 4 },
  copiar: { fontSize: 12 },
  qrBoton: { borderWidth: 1, borderRadius: 12, paddingVertical: 12, alignItems: "center", marginTop: 8 },
  qrBotonTxt: { fontSize: 14, fontFamily: fuentes.media },
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
  version: { fontSize: 12, textAlign: "center", marginTop: 28 },
  presionado: { opacity: 0.6 },
  modalFondo: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center", padding: 28 },
  modalCaja: { width: "100%", maxWidth: 360, borderWidth: 1, borderRadius: 16, padding: 20, gap: 12 },
  modalTitulo: { fontSize: 17, fontFamily: fuentes.semibold },
  modalCampo: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  modalAcciones: { flexDirection: "row", gap: 10, marginTop: 4 },
  modalBoton: { flex: 1, borderWidth: 1, borderRadius: 10, paddingVertical: 12, alignItems: "center" },
});
