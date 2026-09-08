import type { Metadata } from "next";
import { AuthSessionProvider } from "@/components/providers/auth-session-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "DMS FLOW — Gestão operacional inteligente",
  description:
    "Plataforma de gestão operacional para empresas funerárias. Organize sua operação, controle sua equipe, tenha tudo em um só lugar.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
