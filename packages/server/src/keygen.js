import NodeRSA from 'node-rsa';

const key = new NodeRSA({ b: 512, e: 5 });

key.setOptions({
  encryptionScheme: {
    scheme: 'pkcs1',
    label: ''
  },
  signingScheme: {
    saltLength: 25
  }
});

export default {
  privateKey: key.exportKey('pkcs1-private-pem'),
  publicKey: key.exportKey('pkcs8-public-pem')
};
