import { useState, useEffect } from "react";
import { View, Text, TextInput, Pressable, FlatList, StyleSheet } from "react-native";
import { Stack, router } from "expo-router";
import * as api from "../../lib/api";
import { useTema } from "../../components/tema";
import { fuentes } from "../../assets/themes/temas";
import { Avatar } from "../../components/Avatar";
import { Check } from "../../components/Check";

export default function CrearGrupo()
{
  const { colores } = useTema();
  const [nombre, setNombre] = useState("");
  const [amigos, setAmigos] = useState([]);
  const [elegidos, setElegidos] = useState([]);
  const [creando, setCreando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() =>
  {
    api.amigos().then(setAmigos).catch(() => {});
  }, []);

  function alternar(id)
  {
    setElegidos((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function crear()
  {
    const n = nombre.trim();
    if (n.length < 1)
    {
      setError("Ponle un nombre al grupo");
      return;
    }
    if (elegidos.length === 0)
    {
      setError("Elige al menos un integrante");
      return;
    }
    setError("");
    setCreando(true);
    try
    {
      const grupo = await api.crearGrupo(n, elegidos);
      router.replace({ pathname: "/grupo/[id]", params: { id: grupo.id, nombre: grupo.nombre } });
    }
    catch (e)
    {
      setError("No se pudo crear el grupo");
      setCreando(false);
    }
  }

  return (
    <View style={[estilos.pantalla, { backgroundColor: colores.fondo }]}>
      <Stack.Screen options={{ title: "Nuevo grupo" }} />
      <TextInput
        value={nombre}
        onChangeText={setNombre}
        placeholder="Nombre del grupo"
        placeholderTextColor={colores.placeholder}
        maxLength={40}
        style={[estilos.campo, { color: colores.texto, borderColor: colores.borde, backgroundColor: colores.surface }]}
      />
      <Text style={[estilos.seccion, { color: colores.muted }]}>INTEGRANTES {elegidos.length > 0 ? `(${elegidos.length})` : ""}</Text>
      {error ? <Text style={{ color: colores.error, fontSize: 13 }}>{error}</Text> : null}
      <FlatList
        data={amigos}
        keyExtractor={(a) => a.id}
        style={estilos.lista}
        ListEmptyComponent={<Text style={[estilos.vacio, { color: colores.muted }]}>Agrega amigos primero para poder armar un grupo.</Text>}
        renderItem={({ item }) =>
        {
          const marcado = elegidos.includes(item.id);
          return (
            <Pressable onPress={() => alternar(item.id)} style={({ pressed }) => [estilos.fila, pressed && estilos.presionado]}>
              <Avatar nombre={item.usuario} uri={item.avatar_url} tamano={40} />
              <Text style={[estilos.nombre, { color: colores.texto }]} numberOfLines={1}>{item.usuario}</Text>
              <View style={[estilos.caja, { borderColor: marcado ? colores.botonFondo : colores.borde, backgroundColor: marcado ? colores.botonFondo : "transparent" }]}>
                {marcado ? <Check color={colores.botonTexto} tamano={14} /> : null}
              </View>
            </Pressable>
          );
        }}
      />
      <Pressable onPress={crear} disabled={creando} style={({ pressed }) => [estilos.boton, { backgroundColor: colores.botonFondo }, pressed && estilos.presionado]}>
        <Text style={[estilos.botonTxt, { color: colores.botonTexto }]}>{creando ? "Creando…" : "Crear grupo"}</Text>
      </Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, padding: 20, gap: 12 },
  campo: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  seccion: { fontSize: 12, fontWeight: "600", letterSpacing: 1 },
  lista: { flex: 1 },
  fila: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  nombre: { flex: 1, fontSize: 15 },
  caja: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  vacio: { fontSize: 13, textAlign: "center", marginTop: 40, paddingHorizontal: 30 },
  boton: { borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  botonTxt: { fontSize: 15, fontFamily: fuentes.semibold },
  presionado: { opacity: 0.7 },
});
