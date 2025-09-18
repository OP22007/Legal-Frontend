
import { ShieldCheck, LucideProps } from 'lucide-react';

export const Icons = {
  secure: ShieldCheck,
  gavel: (props: LucideProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m14 13-7.5 7.5" />
      <path d="m18.5 8.5-7.5 7.5" />
      <path d="m5 18-3 3" />
      <path d="m12 11 9-9" />
      <path d="m11 12-1.5 1.5a6 6 0 0 0 0 8.5l.5.5" />
      <path d="m16 7 3-3 1 1-3 3a3 3 0 0 1-4 0l-1-1a3 3 0 0 1 0-4l3-3 1 1-3 3a3 3 0 0 1 0 4z" />
    </svg>
  ),
};
