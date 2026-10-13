import "./globals.css";

export const metadata = {
  title: "Persona AI — Your ideas, answered",
  description: "Meet Persona AI: a helpful AI for questions, ideas, learning, coding, and more.",
  applicationName: "Persona AI",
  icons: { icon: "/persona-icon.svg" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
