import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Play. Create. Learn. Repeat.",
  description: "Jogos, criação musical e aprendizagem num só lugar.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-PT"><body>{children}</body></html>;
}
