import argon2 from 'argon2';

export async function hashPassword(password: string) {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16,
    timeCost: 3,
    parallelism: 1,
  });
}

export async function verifyPassword(hash: string, password: string) {
  return argon2.verify(hash, password);
}

