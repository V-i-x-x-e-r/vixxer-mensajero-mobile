import { useState } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";

function Play({ tamano = 52 })
{
  return (
    <View style={[estilos.boton, { width: tamano, height: tamano, borderRadius: tamano / 2 }]}>
      <View style={estilos.triangulo} />
    </View>
  );
}

export function VistaPreviaVideo({ uri, estilo })
{
  const [reproduciendo, setReproduciendo] = useState(false);
  const player = useVideoPlayer(uri, (p) =>
  {
    p.loop = true;
  });

  function alternar()
  {
    if (reproduciendo)
    {
      player.pause();
      setReproduciendo(false);
    }
    else
    {
      player.play();
      setReproduciendo(true);
    }
  }

  return (
    <Pressable onPress={alternar} style={[estilos.contenedor, estilo]}>
      <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="contain" nativeControls={false} />
      {!reproduciendo ? (
        <View style={estilos.capa} pointerEvents="none">
          <Play tamano={52} />
        </View>
      ) : null}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  contenedor: { backgroundColor: "#000", overflow: "hidden", alignItems: "center", justifyContent: "center" },
  capa: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  boton: { backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center" },
  triangulo:
  {
    width: 0,
    height: 0,
    borderTopWidth: 11,
    borderBottomWidth: 11,
    borderLeftWidth: 18,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderLeftColor: "#fff",
    marginLeft: 5,
  },
});
