import { View, Text, ActivityIndicator, Pressable, StyleSheet } from "react-native";
import { useTema } from "./tema";

export function EstadoLista({ cargando, error, vacio, onReintentar })
{
  const { colores } = useTema();

  if (cargando)
  {
    return (
      <View style={estilos.centro}>
        <ActivityIndicator color={colores.muted} />
      </View>
    );
  }

  if (error)
  {
    return (
      <View style={estilos.centro}>
        <Text style={[estilos.txt, { color: colores.muted }]}>No se pudo conectar.</Text>
        {onReintentar ? (
          <Pressable onPress={onReintentar} hitSlop={8} style={estilos.reintentar}>
            <Text style={[estilos.txt, { color: colores.texto, fontWeight: "600" }]}>Reintentar</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  return (
    <View style={estilos.centro}>
      <Text style={[estilos.txt, { color: colores.muted }]}>{vacio}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  centro: { alignItems: "center", marginTop: 48, gap: 10 },
  txt: { fontSize: 14, textAlign: "center" },
  reintentar: { paddingVertical: 6, paddingHorizontal: 12 },
});
