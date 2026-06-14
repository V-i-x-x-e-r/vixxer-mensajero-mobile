import { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext.js';
import { Button } from '../components/Button.js';

export function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setLoading(true);
    try {
      await login(username.trim(), password);
    } catch (e) {
      Alert.alert('No se pudo entrar', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-bg px-6 justify-center">
      <Text className="text-green font-mono text-xs uppercase mb-2">vixxer mensajero</Text>
      <Text className="text-text text-3xl font-extrabold mb-8">Entrar</Text>

      <TextInput
        className="bg-surface text-text rounded-lg px-4 h-12 mb-3"
        placeholder="Usuario"
        placeholderTextColor="#aab6c3"
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        className="bg-surface text-text rounded-lg px-4 h-12 mb-6"
        placeholder="Contraseña"
        placeholderTextColor="#aab6c3"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Button label="Entrar" onPress={onSubmit} loading={loading} />

      <Pressable className="mt-6" onPress={() => navigation.navigate('Register')}>
        <Text className="text-muted text-center">
          ¿No tienes cuenta? <Text className="text-blue">Crea una</Text>
        </Text>
      </Pressable>
    </View>
  );
}
