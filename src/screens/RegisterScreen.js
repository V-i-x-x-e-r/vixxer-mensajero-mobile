import { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext.js';
import { Button } from '../components/Button.js';

export function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    if (username.trim().length < 3) return Alert.alert('Usuario muy corto', 'Mínimo 3 caracteres');
    if (password.length < 8) return Alert.alert('Contraseña débil', 'Mínimo 8 caracteres');
    setLoading(true);
    try {
      await register(username.trim(), password);
    } catch (e) {
      Alert.alert('No se pudo registrar', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-bg px-6 justify-center">
      <Text className="text-green font-mono text-xs uppercase mb-2">sin teléfono · sin curp</Text>
      <Text className="text-text text-3xl font-extrabold mb-2">Crear cuenta</Text>
      <Text className="text-muted mb-8">
        Tus claves de cifrado se generan en este dispositivo. Solo tu clave pública viaja al
        servidor.
      </Text>

      <TextInput
        className="bg-surface text-text rounded-lg px-4 h-12 mb-3"
        placeholder="Elige un usuario"
        placeholderTextColor="#aab6c3"
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        className="bg-surface text-text rounded-lg px-4 h-12 mb-6"
        placeholder="Contraseña (mín. 8)"
        placeholderTextColor="#aab6c3"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Button label="Crear cuenta" onPress={onSubmit} loading={loading} />

      <Pressable className="mt-6" onPress={() => navigation.goBack()}>
        <Text className="text-muted text-center">
          ¿Ya tienes cuenta? <Text className="text-blue">Entra</Text>
        </Text>
      </Pressable>
    </View>
  );
}
