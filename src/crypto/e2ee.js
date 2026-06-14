// Cifrado extremo a extremo con TweetNaCl (Curve25519 + XSalsa20 + Poly1305).
// Regla de oro: la clave privada (secretKey) NUNCA sale del dispositivo.
//
// IMPORTANTE: este import debe ejecutarse antes de usar nacl.randomBytes,
// porque le da a TweetNaCl una fuente de aleatoriedad segura en React Native.
import 'react-native-get-random-values';
import nacl from 'tweetnacl';
import util from 'tweetnacl-util';

// Genera el par de claves del usuario al registrarse.
export function generateKeyPair() {
  const kp = nacl.box.keyPair();
  return {
    publicKey: util.encodeBase64(kp.publicKey),
    secretKey: util.encodeBase64(kp.secretKey),
  };
}

// Cifra un mensaje para `theirPublicKey`. Devuelve el sobre que viaja al servidor.
export function encryptMessage(plaintext, theirPublicKeyB64, mySecretKeyB64) {
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const box = nacl.box(
    util.decodeUTF8(plaintext),
    nonce,
    util.decodeBase64(theirPublicKeyB64),
    util.decodeBase64(mySecretKeyB64),
  );
  return {
    encryptedContent: util.encodeBase64(box),
    nonce: util.encodeBase64(nonce),
  };
}

// Descifra un mensaje recibido. Devuelve null si falla (clave equivocada o manipulado).
export function decryptMessage(encryptedContentB64, nonceB64, theirPublicKeyB64, mySecretKeyB64) {
  const opened = nacl.box.open(
    util.decodeBase64(encryptedContentB64),
    util.decodeBase64(nonceB64),
    util.decodeBase64(theirPublicKeyB64),
    util.decodeBase64(mySecretKeyB64),
  );
  if (!opened) return null;
  return util.encodeUTF8(opened);
}
