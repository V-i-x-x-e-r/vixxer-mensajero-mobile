import { useRef } from "react";
import { Animated, PanResponder, StyleSheet } from "react-native";

const ZOOM = 2.5;

export function VisorImagen({ uri, onCerrar })
{
  const escala = useRef(new Animated.Value(1)).current;
  const trasladar = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const estado = useRef({ zoom: false, baseX: 0, baseY: 0, ultimoTap: 0 }).current;

  function alternarZoom()
  {
    estado.zoom = !estado.zoom;
    if (!estado.zoom)
    {
      estado.baseX = 0;
      estado.baseY = 0;
    }
    Animated.parallel([
      Animated.spring(escala, { toValue: estado.zoom ? ZOOM : 1, useNativeDriver: true, bounciness: 0 }),
      Animated.spring(trasladar, { toValue: { x: 0, y: 0 }, useNativeDriver: true, bounciness: 0 }),
    ]).start();
  }

  const responder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (e, g) => estado.zoom && (Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4),
    onPanResponderGrant: () =>
    {
      const ahora = Date.now();
      if (ahora - estado.ultimoTap < 280)
      {
        alternarZoom();
        estado.ultimoTap = 0;
      }
      else
      {
        estado.ultimoTap = ahora;
      }
    },
    onPanResponderMove: (e, g) =>
    {
      if (estado.zoom)
      {
        trasladar.setValue({ x: estado.baseX + g.dx, y: estado.baseY + g.dy });
      }
    },
    onPanResponderRelease: (e, g) =>
    {
      if (estado.zoom)
      {
        estado.baseX += g.dx;
        estado.baseY += g.dy;
      }
      else if (Math.abs(g.dx) < 6 && Math.abs(g.dy) < 6)
      {
        setTimeout(() =>
        {
          if (estado.ultimoTap !== 0 && !estado.zoom)
          {
            onCerrar();
          }
        }, 300);
      }
    },
  })).current;

  return (
    <Animated.View style={estilos.fondo}>
      <Animated.View style={estilos.zona} {...responder.panHandlers}>
        <Animated.Image
          source={{ uri }}
          resizeMode="contain"
          style={[
            estilos.img,
            { transform: [{ translateX: trasladar.x }, { translateY: trasladar.y }, { scale: escala }] },
          ]}
        />
      </Animated.View>
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: "rgba(0,0,0,0.95)" },
  zona: { flex: 1, alignItems: "center", justifyContent: "center" },
  img: { width: "100%", height: "100%" },
});
