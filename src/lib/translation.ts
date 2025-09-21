"use client";

import { create } from "zustand";

interface TranslationState {
	language: string;
	setLanguage: (language: string) => void;
}

export const useTranslationStore = create<TranslationState>((set) => ({
	language: "en",
	setLanguage: (language) => set({ language }),
}));