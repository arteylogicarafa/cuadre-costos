import type { Metadata } from "next";
import { Bodoni_Moda, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// Numerales y títulos con carácter de grabado de billete; Geist queda para la interfaz y las tablas.
const bodoni = Bodoni_Moda({
  variable: "--font-bodoni",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cuadre · Estructura de costos",
  description: "Sistema de estructura de costos para empresas",
};

// Fija el tema antes de pintar para que no parpadee: lo guardado, o la preferencia del sistema.
const scriptTema = `try{var t=localStorage.getItem("tema");if(t!=="claro"&&t!=="oscuro"){t=matchMedia("(prefers-color-scheme: dark)").matches?"oscuro":"claro"}document.documentElement.dataset.tema=t}catch(e){document.documentElement.dataset.tema="claro"}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${bodoni.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: scriptTema }} />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
