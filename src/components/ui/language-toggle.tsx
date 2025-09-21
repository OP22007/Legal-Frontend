"use client";
import * as React from "react";
import { Check, Languages } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { useTranslationStore } from "@/lib/translation";

const languages = [
	{ label: "English", value: "en" },
	{ label: "French", value: "fr" },
	{ label: "German", value: "de" },
	{ label: "Spanish", value: "es" },
	{ label: "Hindi", value: "hi" },
	{ label: "Arabic", value: "ar" },
	{ label: "Chinese", value: "zh" },
	{ label: "Russian", value: "ru" },
];

export function LanguageToggle() {
	const [open, setOpen] = React.useState(false);
	const { language, setLanguage } = useTranslationStore();

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button variant="outline" role="combobox" aria-expanded={open} className="w-fit justify-start">
					<Languages className="mr-2 h-4 w-4" />
					{language
						? languages.find((lang) => lang.value === language)?.label
						: "Select language"}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[200px] p-0">
				<Command>
					<CommandInput placeholder="Search language..." />
					<CommandList>
						<CommandEmpty>No language found.</CommandEmpty>
						<CommandGroup>
							{languages.map((lang) => (
								<CommandItem
									key={lang.value}
									value={lang.value}
									onSelect={(currentValue) => {
										setLanguage(currentValue);
										setOpen(false);
									}}
								>
									<Check
										className={cn(
											"mr-2 h-4 w-4",
											language === lang.value ? "opacity-100" : "opacity-0",
										)}
									/>
									{lang.label}
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}