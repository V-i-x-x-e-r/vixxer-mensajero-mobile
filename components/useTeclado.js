import { useEffect, useState } from "react";
import { Keyboard, Platform } from "react-native";

export function useTeclado()
{
  const [alto, setAlto] = useState(0);

  useEffect(() =>
  {
    const abrir = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const cerrar = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const subir = Keyboard.addListener(abrir, (e) => setAlto(e.endCoordinates.height));
    const bajar = Keyboard.addListener(cerrar, () => setAlto(0));
    return () =>
    {
      subir.remove();
      bajar.remove();
    };
  }, []);

  return alto;
}
