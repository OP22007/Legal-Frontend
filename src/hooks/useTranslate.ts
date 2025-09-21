"use client";

import { useEffect, useState } from "react";
import { useTranslationStore } from "@/lib/translation";

export const useTranslate = (text: string) => {
	const { language } = useTranslationStore();
	const [translatedText, setTranslatedText] = useState(text);

	useEffect(() => {
		if (language === "en") {
			setTranslatedText(text);
			return;
		}

		const translate = async () => {
			try {
				const response = await fetch("/api/translate", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ text, target: language }),
				});

				if (!response.ok) {
					throw new Error("Failed to translate");
				}

				const data = await response.json();
				setTranslatedText(data.translatedText);
			} catch (error) {
				console.error(error);
				setTranslatedText(text);
			}
		};

		translate();
	}, [language, text]);

	return translatedText;
};