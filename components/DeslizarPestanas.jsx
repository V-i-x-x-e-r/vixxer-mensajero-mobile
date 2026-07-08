import { Gesture, GestureDetector, Directions } from "react-native-gesture-handler";
import { router } from "expo-router";

const ORDEN = ["chats", "grupos", "amigos"];

export function DeslizarPestanas({ actual, children })
{
  const idx = ORDEN.indexOf(actual);

  const izquierda = Gesture.Fling()
    .direction(Directions.LEFT)
    .runOnJS(true)
    .onEnd(() =>
    {
      if (idx >= 0 && idx < ORDEN.length - 1)
      {
        router.navigate(`/${ORDEN[idx + 1]}`);
      }
    });

  const derecha = Gesture.Fling()
    .direction(Directions.RIGHT)
    .runOnJS(true)
    .onEnd(() =>
    {
      if (idx > 0)
      {
        router.navigate(`/${ORDEN[idx - 1]}`);
      }
    });

  return (
    <GestureDetector gesture={Gesture.Race(izquierda, derecha)}>
      {children}
    </GestureDetector>
  );
}
