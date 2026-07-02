import { View, Pressable, Text, StyleSheet } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";

export function VisorVideo({ uri, onCerrar })
{
  const player = useVideoPlayer(uri, (p) =>
  {
    p.loop = false;
    p.play();
  });

  return (
    <View style={estilos.fondo}>
      <VideoView
        player={player}
        style={estilos.video}
        contentFit="contain"
        nativeControls
        buttonOptions={{ showNext: false, showPrevious: false }}
      />
      <Pressable onPress={onCerrar} hitSlop={12} style={({ pressed }) => [estilos.cerrar, pressed && { opacity: 0.6 }]}>
        <Text style={estilos.cerrarTxt}>✕</Text>
      </Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: "#000" },
  video: { flex: 1 },
  cerrar: { position: "absolute", top: 44, right: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" },
  cerrarTxt: { color: "#FFF", fontSize: 20, fontWeight: "600" },
});
