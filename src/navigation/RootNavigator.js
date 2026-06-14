import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext.js';
import { LoginScreen } from '../screens/LoginScreen.js';
import { RegisterScreen } from '../screens/RegisterScreen.js';
import { ChatListScreen } from '../screens/ChatListScreen.js';
import { ChatScreen } from '../screens/ChatScreen.js';

const Stack = createNativeStackNavigator();

const screenStyle = {
  headerStyle: { backgroundColor: '#0f1720' },
  headerTintColor: '#f6f8fb',
  contentStyle: { backgroundColor: '#0f1720' },
};

export function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator color="#35d487" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={screenStyle}>
      {user ? (
        <>
          <Stack.Screen name="Chats" component={ChatListScreen} options={{ title: 'Vixxer' }} />
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={({ route }) => ({ title: `@${route.params.peerUsername}` })}
          />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Crear cuenta' }} />
        </>
      )}
    </Stack.Navigator>
  );
}
