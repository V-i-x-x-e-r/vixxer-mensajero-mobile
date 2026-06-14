import { Pressable, Text, ActivityIndicator } from 'react-native';

// Botón de marca. variant: 'primary' (verde) | 'ghost'.
export function Button({ label, onPress, loading, variant = 'primary', disabled }) {
  const base = 'min-h-12 rounded-lg items-center justify-center px-4 active:opacity-80';
  const styles =
    variant === 'primary' ? `${base} bg-green` : `${base} border border-white/15`;
  const textColor = variant === 'primary' ? 'text-bg' : 'text-text';

  return (
    <Pressable className={`${styles} ${disabled ? 'opacity-50' : ''}`} onPress={onPress} disabled={disabled || loading}>
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#07110d' : '#f6f8fb'} />
      ) : (
        <Text className={`font-bold ${textColor}`}>{label}</Text>
      )}
    </Pressable>
  );
}
