import './globals.css';
import { AuthProvider } from '@/lib/authContext';
import Navbar from '@/components/Navbar';

export const metadata = {
  title: 'AI Meeting Notes & Action Tracker',
  description: 'Summarize meeting transcripts, extract key decisions, and manage action items with AI.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased selection:bg-brand-500 selection:text-white bg-slate-950 text-slate-100 min-h-screen flex flex-col">
        <AuthProvider>
          <Navbar />
          <div className="flex-1">{children}</div>
        </AuthProvider>
      </body>
    </html>
  );
}
