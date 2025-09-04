export type NoteDTO = {
  id: string;
  title: string;
  body: string;
  tags: string[] | null;
  createdAt?: string;
  updatedAt?: string;
  creatorLabel?: string;
};

export type SessionLike = {
  user?: {
    id: string;
    email?: string | null;
    name?: string | null;
  } | null;
} | null;

