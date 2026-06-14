import { useState } from 'react';
import { View, Text, TextInput, FlatList, Pressable } from 'react-native';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';

// MVP: buscar un usuario por nombre y abrir la conversación.
// Post-MVP: lista de conversaciones recientes persistida.
export function ChatListScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  async function onSearch(q) {
    setQuery(q);
    if (q.trim().length < 2) return setResults([]);
    try {
      const { results: r } = await api.searchUsers(q.trim());
      setResults(r.filter((u) => u.id !== user.id));
    } catch {
      setResults([]);
    }
  }

  return (
    <View className="flex-1 bg-bg px-5 pt-2">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-text text-xl font-extrabold">@{user?.username}</Text>
        <Pressable onPress={logout}>
          <Text className="text-muted">Salir</Text>
        </Pressable>
      </View>

      <TextInput
        className="bg-surface text-text rounded-lg px-4 h-12 mb-4"
        placeholder="Buscar usuario..."
        placeholderTextColor="#aab6c3"
        autoCapitalize="none"
        value={query}
        onChangeText={onSearch}
      />

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text className="text-muted text-center mt-10">
            Busca a alguien por su usuario para empezar a chatear.
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable
            className="bg-surface rounded-lg px-4 py-4 mb-2 active:opacity-80"
            onPress={() =>
              navigation.navigate('Chat', { peerId: item.id, peerUsername: item.username })
            }
          >
            <Text className="text-text font-bold">@{item.username}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}
