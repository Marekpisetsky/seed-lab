import { EnglishWords } from "@/components/i18n-en";

/** The English pages (/, /stocks…): only the English words are in their code. */
export default function EnglishLayout({ children }: { children: React.ReactNode }) {
  return <EnglishWords>{children}</EnglishWords>;
}
