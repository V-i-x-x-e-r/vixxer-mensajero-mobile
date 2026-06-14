import { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, FlatList, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { getSocket } from '../services/socket.js';
import { encryptMessage, decryptMessage } from '../crypto/e2ee.js';
import { getSecretKey } from '../storage/secure.js';
import { cachePublicKey, getCachedPublicKey } from '../storage/messages.js';

// Conversación 1-a-1 con cifrado E2EE.
export function ChatScreen({ route }) {
  const { peerId, peerUsername } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const secretRef = useRef(null);
  const peerKeyRef = useRef(null);

  // Obtiene (y cachea) la clave pública del otro usuario.
  async function ensurePeerKey() {
    if (peerKeyRef.current) return peerKeyRef.current;
    let pk = await getCachedPublicKey(peerId);
    if (!pk) {
      const res = await api.getPublicKey(peerId);
      pk = res.publicKey;
      await cachePublicKey(peerId, pk);
    }
    peerKeyRef.current = pk;
    return pk;
  }

  useEffect(() => {
    (async () => {
      secretRef.current = await getSecretKey();
      const peerKey = await ensurePeerKey();

      // Cargar historial y descifrar lo que sea para mí.
      const { messages: hist } = await api.history(peerId);
      const decrypted = hist.map((m) => ({
        id: m.id,
        mine: m.sender_id === user.id,
        text:
          decryptMessage(m.encrypted_content, m.nonce, peerKey, secretRef.current) ??
          '🔒 (no se pudo descifrar)',
        createdAt: m.created_at,
      }));
      setMessages(decrypted);
    })();

    // Escuchar mensajes nuevos en tiempo real.
    const socket = getSocket();
    const onReceived = (m) => {
      if (m.senderId !== peerId) return;
      const plain =
        decryptMessage(m.encryptedContent, m.nonce, peerKeyRef.current, secretRef.current) ??
        '🔒 (no se pudo descifrar)';
      setMessages((prev) => [...prev, { id: m.messageId, mine: false, text: plain, createdAt: m.timestamp }]);
      socket?.emit('message:read', { messageId: m.messageId, senderId: m.senderId });
    };
    socket?.on('message:received', onReceived);
    return () => socket?.off('message:received', onReceived);
  }, [peerId]);

  async function onSend() {
    const body = text.trim();
    if (!body) return;
    setText('');
    const peerKey = await ensurePeerKey();
    const { encryptedContent, nonce } = encryptMessage(body, peerKey, secretRef.current);

    const socket = getSocket();
    socket?.emit('message:send', { recipientId: peerId, encryptedContent, nonce }, (resp) => {
      const id = resp?.messageId || String(Date.now());
      setMessages((prev) => [...prev, { id, mine: true, text: body, createdAt: new Date().toISOString() }]);
    });
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-bg"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View className="px-5 py-3 border-b border-white/10">
        <Text className="text-text font-extrabold">@{peerUsername}</Text>
        <Text className="text-green font-mono text-xs">cifrado de extremo a extremo</Text>
      </View>

      <FlatList
        className="flex-1 px-4"
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ paddingVertical: 12 }}
        renderItem={({ item }) => (
          <View
            className={`max-w-[80%] rounded-2xl px-4 py-2 mb-2 ${
              item.mine ? 'self-end bg-green' : 'self-start bg-surface-strong'
            }`}
          >
            <Text className={item.mine ? 'text-bg' : 'text-text'}>{item.text}</Text>
          </View>
        )}
      />

      <View className="flex-row items-center px-3 py-2 border-t border-white/10">
        <TextInput
          className="flex-1 bg-surface text-text rounded-full px-4 h-11 mr-2"
          placeholder="Mensaje..."
          placeholderTextColor="#aab6c3"
          value={text}
          onChangeText={setText}
          onSubmitEditing={onSend}
        />
        <Pressable className="h-11 px-5 rounded-full bg-green items-center justify-center" onPress={onSend}>
          <Text className="text-bg font-bold">Enviar</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
