"use client";

import { useTranslate } from "@/hooks/useTranslate";

interface TranslatedTextProps {
	text: string;
	className?: string;
}

export const TranslatedText = ({ text, className }: TranslatedTextProps) => {
	const translatedText = useTranslate(text);

	return <span className={className}>{translatedText}</span>;
};