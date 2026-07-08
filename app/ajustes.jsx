import { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, Switch, ScrollView, Modal, KeyboardAvoidingView, Platform, Alert, Linking, StyleSheet } from "react-native";
import { router } from "expo-router";
import Constants from "expo-constants";
import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as api from "../lib/api";
import { cerrarSesion } from "../lib/storage";
import { desconectarSocket } from "../lib/socket";
import { useTema } from "../components/tema";
import { fuentes } from "../assets/themes/temas";
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
import { VincularDispositivo } from "../components/VincularDispositivo";

const PERFIL_CACHE = "vixxer_perfil";

export default function Ajustes()
{
  const { colores, nombre: nombreTema, elegirTema } = useTema();
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
  const [vinculo, setVinculo] = useState("");
  const [vinculando, setVinculando] = useState(false);
  const [cambiandoPass, setCambiandoPass] = useState(false);
  const [passActual, setPassActual] = useState("");
  const [passNueva, setPassNueva] = useState("");
  const [passRepetir, setPassRepetir] = useState("");
  const [passError, setPassError] = useState("");
  const [passOcupado, setPassOcupado] = useState(false);
  const [passListo, setPassListo] = useState(false);

  useEffect(() =>
  {
    AsyncStorage.getItem(PERFIL_CACHE).then((crudo) =>
    {
      if (crudo)
      {
        try
        {
          const p = JSON.parse(crudo);
          setUsuario((v) => v || p.usuario || "");
          setCodigo((v) => v || p.codigo || "");
          setAvatar((v) => v || p.avatar || null);
        }
        catch (e)
        {
        }
      }
    }).catch(() => {});
    api.miCodigo().then((d) =>
    {
      setUsuario(d.usuario);
      setCodigo(d.codigo);
      setAvatar(d.avatar_url);
      AsyncStorage.setItem(PERFIL_CACHE, JSON.stringify({ usuario: d.usuario, codigo: d.codigo, avatar: d.avatar_url })).catch(() => {});
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
    const r = await activarModo(valor);
    if (valor && !r.ok)
    {
      setCercania(false);
      const botones = r.abrirAjustes
        ? [{ text: "Cancelar", style: "cancel" }, { text: "Abrir ajustes", onPress: () => Linking.openSettings() }]
        : undefined;
      Alert.alert("No se pudo activar", r.razon || "Inténtalo de nuevo.", botones);
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
      const cod = respaldoCfg.destino === "local" ? await exportarRespaldoLocal() : await hacerRespaldo();
      if (cod)
      {
        setNuevoCodigo(cod);
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

  async function vincularDispositivo()
  {
    setVinculando(true);
    try
    {
      const cod = await hacerRespaldo();
      if (cod)
      {
        setVinculo(cod);
      }
    }
    catch (e)
    {
    }
    setVinculando(false);
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

  function Seccion({ titulo })
  {
    return <Text style={[estilos.seccion, { color: colores.muted }]}>{titulo}</Text>;
  }

  function Sep()
  {
    return <View style={[estilos.sep, { backgroundColor: colores.borde }]} />;
  }

  function FilaNav({ etiqueta, valor, onPress, color, cargando })
  {
    return (
      <Pressable onPress={onPress} disabled={!!cargando} style={({ pressed }) => [estilos.fila, pressed && estilos.presionado]}>
        <Text style={[estilos.etiqueta, { color: color || colores.texto }]}>{cargando ? "Un momento…" : etiqueta}</Text>
        <View style={estilos.filaDerecha}>
          {valor ? <Text style={[estilos.valor, { color: colores.muted }]}>{valor}</Text> : null}
          <Text style={{ color: colores.muted, fontSize: 17 }}>{"›"}</Text>
        </View>
      </Pressable>
    );
  }

  function FilaSwitch({ etiqueta, valor, onCambio })
  {
    return (
      <View style={estilos.fila}>
        <Text style={[estilos.etiqueta, { color: colores.texto }]}>{etiqueta}</Text>
        <Switch
          value={valor}
          onValueChange={onCambio}
          trackColor={{ true: colores.texto, false: colores.borde }}
          thumbColor={colores.fondo}
          ios_backgroundColor={colores.borde}
        />
      </View>
    );
  }

  function FilaValor({ etiqueta, valor, onPress, apagada })
  {
    return (
      <Pressable onPress={onPress} disabled={apagada} style={({ pressed }) => [estilos.fila, pressed && estilos.presionado, apagada && { opacity: 0.4 }]}>
        <Text style={[estilos.etiqueta, { color: colores.texto }]}>{etiqueta}</Text>
        <Text style={[estilos.valor, { color: colores.botonFondo }]}>{valor}</Text>
      </Pressable>
    );
  }

  const tarjeta = [estilos.tarjeta, { backgroundColor: colores.surface, borderColor: colores.borde }];

  return (
    <View style={{ flex: 1, backgroundColor: colores.fondo }}>
      <ScrollView contentContainerStyle={estilos.pantalla} showsVerticalScrollIndicator={false}>

      <View style={estilos.perfil}>
        <Pressable onPress={cambiarFoto} style={({ pressed }) => pressed && estilos.presionado}>
          <Avatar nombre={usuario} uri={avatar} tamano={92} />
        </Pressable>
        <Text style={[estilos.usuario, { color: colores.texto }]}>{usuario || "…"}</Text>
        <Text style={[estilos.cambiar, { color: colores.muted }]}>toca la foto para cambiarla</Text>
      </View>

      <Seccion titulo="TU CÓDIGO DE AMIGO" />
      <View style={tarjeta}>
        <Pressable onPress={copiar} style={({ pressed }) => [estilos.codigoCaja, pressed && estilos.presionado]}>
          <Text style={[estilos.codigo, { color: colores.texto }]}>{codigo || "…"}</Text>
          <Text style={[estilos.copiar, { color: colores.muted }]}>{copiado ? "copiado ✓" : "toca para copiar"}</Text>
        </Pressable>
        <Sep />
        <FilaNav etiqueta="Mostrar código QR" onPress={() => setQr(true)} />
      </View>

      <Seccion titulo="APARIENCIA" />
      <View style={tarjeta}>
        <View style={estilos.fila}>
          <Text style={[estilos.etiqueta, { color: colores.texto }]}>Tema</Text>
          <View style={estilos.temas}>
            {[["claro", "Claro"], ["oscuro", "Oscuro"], ["colorido", "Colorido"]].map(([clave, etiqueta]) => (
              <Pressable
                key={clave}
                onPress={() => elegirTema(clave)}
                style={[estilos.temaChip, { borderColor: colores.borde, backgroundColor: nombreTema === clave ? colores.botonFondo : "transparent" }]}
              >
                <Text style={[estilos.temaChipTxt, { color: nombreTema === clave ? colores.botonTexto : colores.texto }]}>{etiqueta}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      <Seccion titulo="PRIVACIDAD" />
      <View style={tarjeta}>
        <FilaSwitch etiqueta="Mostrar mi conexión" valor={prefs.mostrar_conexion} onCambio={(v) => cambiar("mostrar_conexion", v)} />
        <Sep />
        <FilaSwitch etiqueta="Acuses de lectura" valor={prefs.mostrar_acuses} onCambio={(v) => cambiar("mostrar_acuses", v)} />
        <Sep />
        <FilaSwitch etiqueta="Bloqueo con PIN" valor={pinActivo} onCambio={alternarPin} />
        {pinActivo && bioHay ? (
          <>
            <Sep />
            <FilaSwitch etiqueta="Desbloqueo biométrico" valor={bioActivo} onCambio={alternarBio} />
          </>
        ) : null}
        <Sep />
        <FilaSwitch etiqueta="Bloquear capturas de pantalla" valor={capturas} onCambio={alternarCapturas} />
        <Sep />
        <FilaNav etiqueta="Usuarios bloqueados" onPress={() => router.push("/bloqueados")} />
      </View>

      {cercaniaSoportada() ? (
        <>
          <Seccion titulo="SIN INTERNET" />
          <View style={tarjeta}>
            <FilaSwitch etiqueta="Mensajes por cercanía" valor={cercania} onCambio={alternarCercania} />
            <Sep />
            <FilaNav etiqueta="Ver radar de cercanía" onPress={() => router.push("/cercania")} />
          </View>
          <Text style={[estilos.nota, { color: colores.muted }]}>
            Sin internet, tus mensajes viajan cifrados por Bluetooth entre teléfonos con Vixxer cerca hasta llegar a su destino.
          </Text>
        </>
      ) : null}

      <Seccion titulo="COPIA DE SEGURIDAD" />
      <View style={tarjeta}>
        <FilaValor etiqueta="Destino" valor={respaldoCfg.destino === "nube" ? "Nube" : "Local"} onPress={cambiarDestino} />
        <Sep />
        <FilaValor etiqueta="Frecuencia" valor={ETIQUETA_FRECUENCIA[respaldoCfg.frecuencia]} onPress={cambiarFrecuencia} />
        <Sep />
        <FilaValor etiqueta="Hora" valor={`${String(respaldoCfg.hora).padStart(2, "0")}:00`} onPress={cambiarHora} apagada={respaldoCfg.frecuencia === "nunca"} />
        <Sep />
        <FilaNav etiqueta={respaldando ? "Respaldando…" : "Hacer copia ahora"} onPress={hacerCopiaAhora} cargando={respaldando} />
      </View>
      <Text style={[estilos.nota, { color: colores.muted }]}>
        {respaldoCfg.ultimo ? `Última copia: ${new Date(respaldoCfg.ultimo).toLocaleDateString()}. ` : "Aún no has hecho una copia. "}
        Tu llave se respalda cifrada; solo tu código de recuperación la abre.
      </Text>

      <Seccion titulo="CUENTA" />
      <View style={tarjeta}>
        <FilaNav etiqueta="Vincular otro dispositivo" onPress={vincularDispositivo} cargando={vinculando} />
        <Sep />
        <FilaNav etiqueta="Cambiar contraseña" onPress={abrirCambioPass} />
        <Sep />
        <Pressable onPress={() => setConfirmar(true)} style={({ pressed }) => [estilos.fila, pressed && estilos.presionado]}>
          <Text style={[estilos.etiqueta, { color: colores.error }]}>Cerrar sesión</Text>
        </Pressable>
      </View>

      <Text style={[estilos.version, { color: colores.muted }]}>Vixxer {Constants.expoConfig?.version || ""}</Text>
      </ScrollView>

      <CodigoQR visible={qr} codigo={codigo} onCerrar={() => setQr(false)} />

      <VincularDispositivo visible={!!vinculo} codigo={vinculo} onCerrar={() => setVinculo("")} />

      <RespaldoCodigo visible={!!nuevoCodigo} codigo={nuevoCodigo} onCerrar={() => setNuevoCodigo("")} />

      <Modal transparent visible={cambiandoPass} animationType="fade" onRequestClose={() => setCambiandoPass(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
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
        </KeyboardAvoidingView>
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
  perfil: { alignItems: "center", gap: 8, marginBottom: 8 },
  usuario: { fontSize: 18, fontFamily: fuentes.semibold },
  cambiar: { fontSize: 12 },
  seccion: { fontSize: 12, fontWeight: "600", letterSpacing: 1, marginTop: 24, marginBottom: 8 },
  tarjeta: { borderWidth: 1, borderRadius: 14, overflow: "hidden" },
  fila: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, minHeight: 52 },
  temas: { flexDirection: "row", gap: 6 },
  temaChip: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5 },
  temaChipTxt: { fontSize: 12, fontFamily: fuentes.media },
  filaDerecha: { flexDirection: "row", alignItems: "center", gap: 8 },
  etiqueta: { fontSize: 15 },
  valor: { fontSize: 15, fontFamily: fuentes.media },
  sep: { height: 1, marginLeft: 16 },
  codigoCaja: { alignItems: "center", paddingVertical: 16, gap: 4 },
  codigo: { fontSize: 26, fontFamily: fuentes.bold, letterSpacing: 4 },
  copiar: { fontSize: 12 },
  nota: { fontSize: 12, lineHeight: 17, marginTop: 8 },
  version: { fontSize: 12, textAlign: "center", marginTop: 32 },
  presionado: { opacity: 0.6 },
  modalFondo: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center", padding: 28 },
  modalCaja: { width: "100%", maxWidth: 360, borderWidth: 1, borderRadius: 16, padding: 20, gap: 12 },
  modalTitulo: { fontSize: 17, fontFamily: fuentes.semibold },
  modalCampo: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  modalAcciones: { flexDirection: "row", gap: 10, marginTop: 4 },
  modalBoton: { flex: 1, borderWidth: 1, borderRadius: 10, paddingVertical: 12, alignItems: "center" },
});
