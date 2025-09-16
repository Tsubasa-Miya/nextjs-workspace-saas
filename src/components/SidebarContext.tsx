"use client";
import { createContext, useContext } from 'react';

export type SidebarAPI = { isOpen: boolean; close: () => void } | null;

export const SidebarContext = createContext<SidebarAPI>(null);

export function useSidebar() {
  return useContext(SidebarContext);
}

