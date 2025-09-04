/* istanbul ignore file */
"use client";
import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button onClick={() => signOut()} style={{ padding: "6px 10px" }}>Sign out</button>
  );
}
