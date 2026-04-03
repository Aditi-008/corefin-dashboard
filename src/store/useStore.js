
import { create } from "zustand";

export const useStore = create((set) => ({
  transactions: [],
  role: "viewer",
  setTransactions: (data) => set({ transactions: data }),
  setRole: (role) => set({ role })
}));
