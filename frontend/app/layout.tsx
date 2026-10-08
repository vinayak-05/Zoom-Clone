import type { Metadata } from "next";
import "../styles/globals.css";
import { ToastProvider } from "../components/ui/Toast";

export const metadata: Metadata = {
  title: "Zoom Web App Clone",
  description: "Pixel-close Zoom web app clone with real-time video conferencing",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zoom-bg text-zoom-text antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
