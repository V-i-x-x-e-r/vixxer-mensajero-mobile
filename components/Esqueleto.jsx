import { useEffect, useRef } from "react";
import { Animated, View, StyleSheet } from "react-native";
import { useTema } from "./tema";

export function Esqueleto({ ancho, alto, radio = 8, estilo })
{
  const { colores } = useTema();
  const pulso = useRef(new Animated.Value(0.5)).current;

  useEffect(() =>
  {
    const animacion = Animated.loop(
      Animated.sequence([
        Animated.timing(pulso, { toValue: 1, duration: 750, useNativeDriver: true }),
        Animated.timing(pulso, { toValue: 0.5, duration: 750, useNativeDriver: true }),
      ]),
    );
    animacion.start();
    return () => animacion.stop();
  }, [pulso]);

  return (
    <Animated.View
      style={[
        { width: ancho, height: alto, borderRadius: radio, backgroundColor: colores.borde, opacity: pulso },
        estilo,
      ]}
    />
  );
}

export function ListaChatsEsqueleto()
{
  return (
    <View style={estilos.lista}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={estilos.fila}>
          <Esqueleto ancho={48} alto={48} radio={24} />
          <View style={estilos.lineas}>
            <Esqueleto ancho="50%" alto={13} />
            <Esqueleto ancho="78%" alto={11} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function ChatEsqueleto()
{
  const burbujas = [
    { ancho: "55%", alto: 40, mio: false },
    { ancho: "40%", alto: 32, mio: true },
    { ancho: "65%", alto: 52, mio: false },
    { ancho: "50%", alto: 32, mio: true },
    { ancho: "45%", alto: 40, mio: false },
  ];
  return (
    <View style={estilos.chat}>
      {burbujas.map((b, i) => (
        <Esqueleto
          key={i}
          ancho={b.ancho}
          alto={b.alto}
          radio={18}
          estilo={{ alignSelf: b.mio ? "flex-end" : "flex-start" }}
        />
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  lista: { paddingTop: 8 },
  fila: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 4 },
  lineas: { flex: 1, gap: 8 },
  chat: { flex: 1, padding: 16, gap: 14, justifyContent: "flex-end" },
});
