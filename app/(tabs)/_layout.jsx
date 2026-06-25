import { useCallback } from "react";
import { View } from "react-native";
import { Tabs, useFocusEffect } from "expo-router";
import { useTema } from "../../components/tema";
import { fuentes } from "../../assets/themes/temas";
import { Chat } from "../../components/Chat";
import { Amigos } from "../../components/Amigos";
import { Badge } from "../../components/Badge";
import { useSolicitudes } from "../../components/Solicitudes";

export default function TabsLayout()
{
  const { colores } = useTema();
  const { pendientes, refrescar } = useSolicitudes();

  useFocusEffect(
    useCallback(() =>
    {
      refrescar();
    }, [refrescar]),
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colores.texto,
        tabBarInactiveTintColor: colores.muted,
        tabBarStyle: { backgroundColor: colores.fondo, borderTopColor: colores.borde },
        tabBarLabelStyle: { fontFamily: fuentes.media, fontSize: 12 },
      }}
    >
      <Tabs.Screen
        name="chats"
        options={{ title: "Chats", tabBarIcon: ({ color }) => <Chat color={color} tamano={24} /> }}
      />
      <Tabs.Screen
        name="amigos"
        options={{
          title: "Amigos",
          tabBarIcon: ({ color }) => (
            <View>
              <Amigos color={color} tamano={24} />
              <Badge cantidad={pendientes} estilo={{ position: "absolute", top: -6, right: -10 }} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
