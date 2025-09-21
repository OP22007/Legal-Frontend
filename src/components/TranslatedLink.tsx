"use client";

import Link from "next/link";
import { useTranslate } from "@/hooks/useTranslate";

interface TranslatedLinkProps {
	href: string;
	label: string;
	className?: string;
}

export const TranslatedLink = ({ href, label, className }: TranslatedLinkProps) => {
	const translatedLabel = useTranslate(label);

	return (
		<Link href={href} className={className}>
			{translatedLabel}
		</Link>
	);
};