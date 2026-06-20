// app/_layout.jsx — raíz de navegación (expo-router).
// El cableado de rutas es lógica (Paola); el ASPECTO del header y los temas
// son visuales (Raúl): cambia colores/títulos a gusto aquí.

import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#0f1115" },
        headerTintColor: "#ffffff",
        contentStyle: { backgroundColor: "#0f1115" },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Vixxer" }} />
      <Stack.Screen name="registro" options={{ title: "Crear cuenta" }} />
      <Stack.Screen name="chats" options={{ title: "Chats" }} />
      <Stack.Screen name="chat/[id]" options={{ title: "Conversación" }} />
    </Stack>
  );
}
