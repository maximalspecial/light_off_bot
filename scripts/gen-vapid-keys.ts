import { generateKeyPairSync } from 'crypto';
const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
console.log({
  publicKey: publicKey.export({ type:'spki', format:'pem' }).toString(),
  privateKey: privateKey.export({ type:'pkcs8', format:'pem' }).toString()
});
