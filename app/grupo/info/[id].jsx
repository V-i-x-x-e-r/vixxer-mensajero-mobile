import { useState, useEffect, useCallback } from "react";
import { View, Text, TextInput, Pressable, FlatList, Modal, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { Stack, useLocalSearchParams, router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as api from "../../../lib/api";
import { leer, MI_ID } from "../../../lib/storage";
import { obtenerSocket } from "../../../lib/socket";
import { useTema } from "../../../components/tema";
import { fuentes } from "../../../assets/themes/temas";
import { Avatar } from "../../../components/Avatar";
import { Check } from "../../../components/Check";
import { Lapiz } from "../../../components/Lapiz";
import { Confirmacion } from "../../../components/Confirmacion";

export default function InfoGrupo()
{
  const { colores } = useTema();
  const { id, nombre } = useLocalSearchParams();
  const [grupo, setGrupo] = useState(null);
  const [miId, setMiId] = useState(null);
  const [confirmar, setConfirmar] = useState(null);
  const [selMiembro, setSelMiembro] = useState(null);
  const [agregando, setAgregando] = useState(false);
  const [candidatos, setCandidatos] = useState([]);
  const [elegidos, setElegidos] = useState([]);
  const [renombrando, setRenombrando] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");

  const cargar = useCallback(() =>
  {
    api.infoGrupo(id).then(setGrupo).catch(() => {});
  }, [id]);

  useEffect(() =>
  {
    leer(MI_ID).then(setMiId);
    cargar();
  }, [cargar]);

  useEffect(() =>
  {
    const socket = obtenerSocket();
    if (!socket)
    {
      return;
    }
    const alCambio = (data) =>
    {
      if (data.id === id)
      {
        cargar();
      }
    };
    socket.on("grupo:actualizado", alCambio);
    return () => socket.off("grupo:actualizado", alCambio);
  }, [id, cargar]);

  const miembros = grupo?.miembros || [];
  const soyAdmin = miembros.some((m) => m.id === miId && m.rol === "admin");
  const creadorId = grupo?.creador_id;

  async function cambiarFoto()
  {
    if (!soyAdmin)
    {
      return;
    }
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
      await api.avatarGrupo(id, r.assets[0].base64, "image/jpeg");
      cargar();
    }
    catch (e)
    {
    }
  }

  function abrirRenombrar()
  {
    setNuevoNombre(grupo?.nombre || "");
    setRenombrando(true);
  }

  async function renombrar()
  {
    const limpio = nuevoNombre.trim();
    setRenombrando(false);
    if (!limpio || limpio === grupo?.nombre)
    {
      return;
    }
    try
    {
      await api.renombrarGrupo(id, limpio);
      cargar();
    }
    catch (e)
    {
    }
  }

  async function abrirAgregar()
  {
    try
    {
      const amigos = await api.amigos();
      const idsMiembros = new Set(miembros.map((m) => m.id));
      setCandidatos(amigos.filter((a) => !idsMiembros.has(a.id)));
      setElegidos([]);
      setAgregando(true);
    }
    catch (e)
    {
    }
  }

  async function confirmarAgregar()
  {
    setAgregando(false);
    if (elegidos.length === 0)
    {
      return;
    }
    try
    {
      await api.agregarMiembros(id, elegidos);
      cargar();
    }
    catch (e)
    {
    }
  }

  async function accionMiembro(accion)
  {
    const m = selMiembro;
    setSelMiembro(null);
    if (!m)
    {
      return;
    }
    try
    {
      if (accion === "admin")
      {
        await api.cambiarRol(id, m.id, m.rol === "admin" ? "miembro" : "admin");
      }
      if (accion === "expulsar")
      {
        await api.expulsarMiembro(id, m.id);
      }
      cargar();
    }
    catch (e)
    {
    }
  }

  async function salir()
  {
    setConfirmar(null);
    try
    {
      await api.salirGrupo(id);
    }
    catch (e)
    {
    }
    router.replace("/grupos");
  }

  return (
    <View style={{ flex: 1, backgroundColor: colores.fondo }}>
      <Stack.Screen options={{ title: "Info del grupo" }} />

      <FlatList
        data={miembros}
        keyExtractor={(m) => m.id}
        ListHeaderComponent={
          <View>
            <View style={estilos.cabecera}>
              <Pressable onPress={cambiarFoto} disabled={!soyAdmin} style={({ pressed }) => pressed && estilos.presionado}>
                <Avatar nombre={grupo?.nombre || nombre || "G"} uri={grupo?.avatar_url || null} tamano={96} />
              </Pressable>
              <Pressable onPress={soyAdmin ? abrirRenombrar : undefined} style={({ pressed }) => [estilos.nombreFila, pressed && soyAdmin && estilos.presionado]}>
                <Text style={[estilos.nombre, { color: colores.texto }]}>{grupo?.nombre || nombre}</Text>
                {soyAdmin ? <Lapiz color={colores.muted} tamano={16} /> : null}
              </Pressable>
              <Text style={[estilos.sub, { color: colores.muted }]}>
                {miembros.length} miembros{soyAdmin ? " · toca la foto o el nombre para cambiarlos" : ""}
              </Text>
            </View>

            <View style={estilos.seccionFila}>
              <Text style={[estilos.seccion, { color: colores.muted }]}>INTEGRANTES</Text>
              {soyAdmin ? (
                <Pressable onPress={abrirAgregar} hitSlop={8} style={({ pressed }) => pressed && estilos.presionado}>
                  <Text style={[estilos.agregar, { color: colores.botonFondo }]}>+ Agregar</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onLongPress={soyAdmin && item.id !== miId && item.id !== creadorId ? () => setSelMiembro(item) : undefined}
            delayLongPress={300}
            style={({ pressed }) => [estilos.fila, pressed && estilos.presionado]}
          >
            <Avatar nombre={item.usuario} uri={item.avatar_url} tamano={42} />
            <Text style={[estilos.usuario, { color: colores.texto }]} numberOfLines={1}>
              {item.usuario}{item.id === miId ? " (tú)" : ""}
            </Text>
            {item.id === creadorId ? (
              <View style={[estilos.badge, { backgroundColor: colores.botonFondo }]}>
                <Text style={[estilos.badgeTxt, { color: colores.botonTexto }]}>creador</Text>
              </View>
            ) : item.rol === "admin" ? (
              <View style={[estilos.badge, { borderWidth: 1, borderColor: colores.borde }]}>
                <Text style={[estilos.badgeTxt, { color: colores.muted }]}>admin</Text>
              </View>
            ) : null}
          </Pressable>
        )}
        ListFooterComponent={
          <View>
            {soyAdmin ? (
              <Text style={[estilos.pista, { color: colores.muted }]}>Mantén presionado a un integrante para administrarlo.</Text>
            ) : null}
            <Pressable onPress={() => setConfirmar("salir")} style={({ pressed }) => [estilos.salir, { borderColor: colores.borde }, pressed && estilos.presionado]}>
              <Text style={[estilos.salirTxt, { color: colores.error }]}>Salir del grupo</Text>
            </Pressable>
          </View>
        }
      />

      <Modal transparent visible={!!selMiembro} animationType="fade" onRequestClose={() => setSelMiembro(null)}>
        <Pressable style={estilos.menuFondo} onPress={() => setSelMiembro(null)}>
          <Pressable style={[estilos.menuHoja, { backgroundColor: colores.surface, borderColor: colores.borde }]}>
            <Text style={[estilos.menuTitulo, { color: colores.muted }]}>{selMiembro?.usuario}</Text>
            <Pressable onPress={() => accionMiembro("admin")} style={({ pressed }) => [estilos.menuItem, pressed && estilos.presionado]}>
              <Text style={[estilos.menuTxt, { color: colores.texto }]}>
                {selMiembro?.rol === "admin" ? "Quitar admin" : "Hacer admin"}
              </Text>
            </Pressable>
            <Pressable onPress={() => accionMiembro("expulsar")} style={({ pressed }) => [estilos.menuItem, pressed && estilos.presionado]}>
              <Text style={[estilos.menuTxt, { color: colores.error }]}>Expulsar del grupo</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal transparent visible={agregando} animationType="slide" onRequestClose={() => setAgregando(false)}>
        <Pressable style={estilos.menuFondo} onPress={() => setAgregando(false)}>
          <Pressable style={[estilos.hojaAlta, { backgroundColor: colores.fondo, borderColor: colores.borde }]}>
            <Text style={[estilos.modalTitulo, { color: colores.texto }]}>Agregar integrantes</Text>
            <FlatList
              data={candidatos}
              keyExtractor={(a) => a.id}
              style={{ maxHeight: 320 }}
              ListEmptyComponent={<Text style={[estilos.pista, { color: colores.muted }]}>Todos tus amigos ya están en el grupo.</Text>}
              renderItem={({ item }) =>
              {
                const marcado = elegidos.includes(item.id);
                return (
                  <Pressable
                    onPress={() => setElegidos((prev) => (marcado ? prev.filter((x) => x !== item.id) : [...prev, item.id]))}
                    style={({ pressed }) => [estilos.fila, pressed && estilos.presionado]}
                  >
                    <Avatar nombre={item.usuario} uri={item.avatar_url} tamano={40} />
                    <Text style={[estilos.usuario, { color: colores.texto }]} numberOfLines={1}>{item.usuario}</Text>
                    <View style={[estilos.caja, { borderColor: marcado ? colores.botonFondo : colores.borde, backgroundColor: marcado ? colores.botonFondo : "transparent" }]}>
                      {marcado ? <Check color={colores.botonTexto} tamano={14} /> : null}
                    </View>
                  </Pressable>
                );
              }}
            />
            <Pressable onPress={confirmarAgregar} disabled={elegidos.length === 0} style={({ pressed }) => [estilos.boton, { backgroundColor: colores.botonFondo, opacity: elegidos.length === 0 ? 0.4 : 1 }, pressed && estilos.presionado]}>
              <Text style={[estilos.botonTxt, { color: colores.botonTexto }]}>Agregar {elegidos.length > 0 ? `(${elegidos.length})` : ""}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal transparent visible={renombrando} animationType="fade" onRequestClose={() => setRenombrando(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <Pressable style={estilos.modalFondo} onPress={() => setRenombrando(false)}>
          <Pressable style={[estilos.modalCaja, { backgroundColor: colores.surface, borderColor: colores.borde }]}>
            <Text style={[estilos.modalTitulo, { color: colores.texto }]}>Nombre del grupo</Text>
            <TextInput
              value={nuevoNombre}
              onChangeText={setNuevoNombre}
              autoFocus
              maxLength={40}
              placeholderTextColor={colores.placeholder}
              style={[estilos.modalCampo, { color: colores.texto, borderColor: colores.borde }]}
            />
            <View style={estilos.modalAcciones}>
              <Pressable onPress={() => setRenombrando(false)} style={({ pressed }) => [estilos.modalBoton, { borderColor: colores.borde }, pressed && estilos.presionado]}>
                <Text style={{ color: colores.texto, fontFamily: fuentes.semibold }}>Cancelar</Text>
              </Pressable>
              <Pressable onPress={renombrar} style={({ pressed }) => [estilos.modalBoton, { backgroundColor: colores.botonFondo, borderColor: colores.botonFondo }, pressed && estilos.presionado]}>
                <Text style={{ color: colores.botonTexto, fontFamily: fuentes.semibold }}>Guardar</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      <Confirmacion
        visible={confirmar === "salir"}
        titulo="Salir del grupo"
        mensaje="Dejarás de recibir sus mensajes. Podrán volver a agregarte más adelante."
        textoConfirmar="Salir"
        destructivo
        onConfirmar={salir}
        onCancelar={() => setConfirmar(null)}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  cabecera: { alignItems: "center", gap: 8, paddingTop: 28, paddingBottom: 20 },
  nombreFila: { flexDirection: "row", alignItems: "center", gap: 8 },
  nombre: { fontSize: 22, fontFamily: fuentes.semibold },
  sub: { fontSize: 12, textAlign: "center", paddingHorizontal: 30 },
  seccionFila: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, marginBottom: 6 },
  seccion: { fontSize: 12, fontWeight: "600", letterSpacing: 1 },
  agregar: { fontSize: 13, fontFamily: fuentes.semibold },
  fila: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, paddingHorizontal: 20 },
  usuario: { fontSize: 15, flex: 1 },
  badge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  badgeTxt: { fontSize: 11, fontFamily: fuentes.semibold },
  pista: { fontSize: 12, textAlign: "center", marginTop: 12, paddingHorizontal: 30 },
  salir: { borderWidth: 1, borderRadius: 12, paddingVertical: 14, alignItems: "center", margin: 20 },
  salirTxt: { fontSize: 15, fontFamily: fuentes.semibold },
  presionado: { opacity: 0.6 },
  menuFondo: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  menuHoja: { borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, paddingVertical: 8, paddingBottom: 28 },
  hojaAlta: { borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, paddingTop: 16, paddingBottom: 28, paddingHorizontal: 6 },
  menuTitulo: { fontSize: 12, fontFamily: fuentes.semibold, letterSpacing: 1, paddingHorizontal: 24, paddingTop: 8, paddingBottom: 4, textTransform: "uppercase" },
  menuItem: { paddingVertical: 14, paddingHorizontal: 24 },
  menuTxt: { fontSize: 16 },
  modalFondo: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center", padding: 28 },
  modalCaja: { width: "100%", maxWidth: 360, borderWidth: 1, borderRadius: 16, padding: 20, gap: 12 },
  modalTitulo: { fontSize: 17, fontFamily: fuentes.semibold, textAlign: "center", marginBottom: 6 },
  modalCampo: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  modalAcciones: { flexDirection: "row", gap: 10, marginTop: 4 },
  modalBoton: { flex: 1, borderWidth: 1, borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  caja: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  boton: { borderRadius: 12, paddingVertical: 14, alignItems: "center", marginHorizontal: 14, marginTop: 10 },
  botonTxt: { fontSize: 15, fontFamily: fuentes.semibold },
});
