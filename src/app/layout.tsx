import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'EDRMS Vokasi UI',
  description: 'Sistem Manajemen dan Temu Kembali Rekod Institusi',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Tambahkan suppressHydrationWarning di sini agar Next.js tidak marah 
    // dengan ulah ekstensi browser (seperti QuillBot/Grammarly)
    <html lang="id" className="scroll-smooth" suppressHydrationWarning>
      <body className={`${inter.className} bg-[#111111] text-slate-200 antialiased`}>
        {children}
      </body>
    </html>
  );
}