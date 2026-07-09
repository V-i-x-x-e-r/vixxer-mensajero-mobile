import { Tabs } from "expo-router";
import { StyleSheet } from "react-native";
import { useTema } from "../../components/tema";
import { fuentes } from "../../assets/themes/temas";
import { Chat } from "../../components/Chat";
import { Grupos } from "../../components/Grupos";
import { Amigos } from "../../components/Amigos";
import { Vidrio } from "../../components/Vidrio";

export default function TabsLayout()
{
  const { colores } = useTema();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colores.texto,
        tabBarInactiveTintColor: colores.muted,
        tabBarStyle: { position: "absolute", backgroundColor: "transparent", borderTopColor: "transparent", elevation: 0 },
        tabBarBackground: () => <Vidrio tinte="dark" intensidad={55} style={[StyleSheet.absoluteFill, { backgroundColor: `${colores.fondo}DD`, borderTopWidth: 1, borderTopColor: colores.borde }]} />,
        tabBarItemStyle: { borderRadius: 18, marginVertical: 6, marginHorizontal: 2 },
        tabBarLabelStyle: { fontFamily: fuentes.media, fontSize: 12 },
      }}
    >
      <Tabs.Screen
        name="chats"
        options={{ title: "Chats", tabBarIcon: ({ color }) => <Chat color={color} tamano={24} /> }}
      />
      <Tabs.Screen
        name="grupos"
        options={{ title: "Grupos", tabBarIcon: ({ color }) => <Grupos color={color} tamano={24} /> }}
      />
      <Tabs.Screen
        name="amigos"
        options={{ title: "Amigos", tabBarIcon: ({ color }) => <Amigos color={color} tamano={24} /> }}
      />
    </Tabs>
  );
}
