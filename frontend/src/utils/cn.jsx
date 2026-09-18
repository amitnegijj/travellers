import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Conditional classes, with later Tailwind utilities correctly beating earlier ones. */
export const cn = (...inputs) => twMerge(clsx(inputs));
