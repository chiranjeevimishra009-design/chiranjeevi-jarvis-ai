import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CHIRANJEEVI JARVIS AI',
  description: 'Personal AI assistant with secure login, chat, notes, memory, and multilingual voice support.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
