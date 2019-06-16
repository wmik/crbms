import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import config from 'config';
import keygen from './keygen';

let privateKey = keygen.privateKey;
let publicKey = keygen.publicKey;

if (process.env.NODE_ENV === 'production') {
  privateKey = fs.readFileSync(path.resolve(process.env.PRIVATE_KEY_FILEPATH));
  publicKey = fs.readFileSync(path.resolve(process.env.PUBLIC_KEY_FILEPATH));
}

const { ISSUER, SUBJECT, AUDIENCE, EXPIRY, ALGORITHM } = config.get('jwt');

const defaultOptions = {
  issuer: ISSUER,
  audience: AUDIENCE,
  subject: SUBJECT
};

export function sign(payload, options) {
  const defaultSignOptions = shallowMerge(defaultOptions, {
    expiresIn: EXPIRY,
    algorithm: ALGORITHM
  });
  return jwt.sign(
    payload,
    privateKey,
    shallowMerge(defaultSignOptions, options)
  );
}

export function verify(token, options) {
  const defaultVerifyOpts = shallowMerge(defaultOptions, {
    algorithms: [ALGORITHM]
  });
  try {
    return jwt.verify(
      token,
      publicKey,
      shallowMerge(defaultVerifyOpts, options)
    );
  } catch (error) {
    return false;
  }
}

export function decode(token) {
  return jwt.decode(token, { complete: true });
}

function shallowMerge(a, b) {
  return Object.assign({}, a, b);
}
