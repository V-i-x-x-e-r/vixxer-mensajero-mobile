import { useState } from "react";
import { View, TextInput, Pressable, StyleSheet } from "react-native";
import { useTema } from "./tema";
import { Ojo } from "./Ojo";

export function Campo({ valor, setValor, placeholder, secureTextEntry = false, ...resto })
{
  const { colores } = useTema();
  const [enfocado, setEnfocado] = useState(false);
  const [ver, setVer] = useState(false);

  const oculto = secureTextEntry && !ver;

  return (
    <View>
      <TextInput
        style={{
          backgroundColor: colores.surface,
          borderWidth: 1,
          borderColor: enfocado ? colores.bordeFoco : colores.borde,
          borderRadius: 8,
          paddingHorizontal: 16,
          paddingVertical: 12,
          paddingRight: secureTextEntry ? 44 : 16,
          fontSize: 14,
          color: colores.texto,
        }}
        placeholder={placeholder}
        placeholderTextColor={colores.placeholder}
        value={valor}
        onChangeText={setValor}
        secureTextEntry={oculto}
        onFocus={() => setEnfocado(true)}
        onBlur={() => setEnfocado(false)}
        {...resto}
      />
      {secureTextEntry ? (
        <Pressable onPress={() => setVer((v) => !v)} hitSlop={10} style={estilos.ojo}>
          <Ojo mostrando={ver} color={colores.placeholder} />
        </Pressable>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  ojo: { position: "absolute", right: 14, top: 0, bottom: 0, justifyContent: "center" },
});
