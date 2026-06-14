// Punto de entrada de la app.
// El polyfill de aleatoriedad debe cargarse PRIMERO (lo necesita el cifrado).
import 'react-native-get-random-values';
import './global.css';

import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/context/AuthContext.js';
import { RootNavigator } from './src/navigation/RootNavigator.js';

const navTheme = {
  dark: true,
  colors: {
    primary: '#35d487',
    background: '#0f1720',
    card: '#0f1720',
    text: '#f6f8fb',
    border: 'rgba(255,255,255,0.12)',
    notification: '#65a7ff',
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer theme={navTheme}>
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}
