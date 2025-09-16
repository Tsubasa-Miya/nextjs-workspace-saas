import { auth } from './auth';
import type { SessionLike } from './types';

export async function getAuth(): Promise<SessionLike> {
  return (await auth()) as SessionLike;
}

