'use client';

import { useState, useEffect } from 'react';

// Struktur Data JRA (Jadwal Retensi Arsip)
interface RetentionRule {
  id: string;
  code: string;
  category: string;
  activeYears: number;
  inactiveYears: number;
  finalAction: string;
  description: string;
}

export default function JRAPage() {
  const [rules, setRules] = useState<RetentionRule[]>([]);
  const [loading, setLoading] = useState(true);

  // --- DATA SIMULASI JRA UNTUK DEMO SKRIPSI ---
  const dummyData: RetentionRule[] = [
    {
      id: '1',
      code: 'KP.01.00',
      category: 'SK Pengangkatan Pegawai',
      activeYears: 2,
      inactiveYears: 3,
      finalAction: 'PERMANEN',
      description: 'Arsip Vital Kepegawaian (Sesuai Perka ANRI)'
    },
    {
      id: '2',
      code: 'KU.02.01',
      category: 'Laporan Keuangan Tahunan',
      activeYears: 1,
      inactiveYears: 4,
      finalAction: 'MUSNAH',
      description: 'Arsip Fasilitatif Keuangan'
    },
    {
      id: '3',
      code: 'HK.05.00',
      category: 'Sertifikat Aset Gedung',
      activeYears: 5,
      inactiveYears: 10,
      finalAction: 'PERMANEN',
      description: 'Arsip Bukti Kepemilikan Aset Negara'
    }
  ];

  useEffect(() => {
    const fetchRetentionRules = async () => {
      try {
        const res = await fetch('http://localhost:3001/retentions');
        
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setRules(data);
          } else {
            // Jika array kosong, tampilkan data dummy agar UI terlihat bagus
            setRules(dummyData);
          }
        } else {
          // Jika backend tidak punya rute ini, gunakan data dummy
          setRules(dummyData);
        }
      } catch (error) {
        console.error('Gagal mengambil data JRA:', error);
        // Jika koneksi backend terputus, gunakan data dummy
        setRules(dummyData); 
      } finally {
        setLoading(false);
      }
    };

    fetchRetentionRules();
  }, []);

  return (
    <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-serif text-white tracking-tight mb-2">
            Jadwal Retensi <span className="italic text-[#8b5cf6]">Arsip.</span>
          </h1>
          <p className="text-slate-500 text-[10px] font-black tracking-[0.2em] uppercase">
            Manajemen Aturan Siklus Hidup Rekod (JRA)
          </p>
        </div>
        <button className="px-6 py-4 bg-[#8b5cf6] hover:bg-purple-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-purple-900/50 hover:-translate-y-1">
          + Tambah Aturan JRA
        </button>
      </div>

      {/* Kontainer Aturan JRA */}
      <div className="bg-[#1a1a1a] rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden">
        {/* Garis Aksen Ungu */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#8b5cf6] via-[#111111] to-[#8b5cf6] opacity-50"></div>

        <div className="p-8 space-y-6">
          
          {/* Header Kolom (Desktop) */}
          <div className="hidden md:grid grid-cols-12 gap-6 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 pb-4">
            <div className="col-span-2">Kode</div>
            <div className="col-span-3">Kategori Rekod</div>
            <div className="col-span-2 text-center">Masa Aktif</div>
            <div className="col-span-2 text-center">Masa Inaktif</div>
            <div className="col-span-2 text-center">Nasib Akhir</div>
            <div className="col-span-1 text-right">Aksi</div>
          </div>

          {/* Daftar Aturan */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12 text-slate-500 font-mono text-xs uppercase tracking-widest animate-pulse">
                Memuat regulasi JRA...
              </div>
            ) : rules.length === 0 ? (
              <div className="text-center py-16 bg-[#111111] rounded-[1.5rem] border border-dashed border-slate-800">
                <span className="text-4xl block mb-4">⚖️</span>
                <p className="text-slate-500 font-mono text-xs uppercase tracking-[0.2em]">Belum ada aturan JRA yang dikonfigurasi.</p>
                <p className="text-slate-600 text-[10px] mt-2">Tambahkan aturan baru agar penyusutan otomatis dapat berjalan.</p>
              </div>
            ) : (
              rules.map((rule) => (
                <div key={rule.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 items-center p-6 bg-[#111111] border border-white/5 rounded-2xl hover:border-white/20 transition-all shadow-inner group">
                  
                  {/* Kode Klasifikasi */}
                  <div className="md:col-span-2">
                    <span className="font-mono font-bold text-[#8b5cf6] text-lg tracking-widest bg-[#8b5cf6]/10 px-3 py-1 rounded-lg border border-[#8b5cf6]/20">
                      {rule.code}
                    </span>
                  </div>

                  {/* Kategori Rekod */}
                  <div className="md:col-span-3">
                    <p className="text-white font-semibold text-sm">{rule.category}</p>
                    <p className="text-slate-500 text-[10px] font-mono mt-1">{rule.description}</p>
                  </div>

                  {/* Masa Aktif */}
                  <div className="md:col-span-2 flex items-center justify-start md:justify-center gap-2">
                    <span className="md:hidden text-slate-500 text-[10px] uppercase font-black">Aktif:</span>
                    <div className="flex items-center gap-1.5 bg-teal-500/10 text-teal-400 px-3 py-1.5 rounded-lg border border-teal-500/20">
                      <span className="font-black">{rule.activeYears}</span>
                      <span className="text-[9px] uppercase tracking-widest font-bold">Tahun</span>
                    </div>
                  </div>

                  {/* Masa Inaktif */}
                  <div className="md:col-span-2 flex items-center justify-start md:justify-center gap-2">
                    <span className="md:hidden text-slate-500 text-[10px] uppercase font-black">Inaktif:</span>
                    <div className="flex items-center gap-1.5 bg-yellow-500/10 text-yellow-400 px-3 py-1.5 rounded-lg border border-yellow-500/20">
                      <span className="font-black">{rule.inactiveYears}</span>
                      <span className="text-[9px] uppercase tracking-widest font-bold">Tahun</span>
                    </div>
                  </div>

                  {/* Nasib Akhir */}
                  <div className="md:col-span-2 flex items-center justify-start md:justify-center gap-2">
                    <span className="md:hidden text-slate-500 text-[10px] uppercase font-black">Nasib Akhir:</span>
                    <span className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border
                      ${rule.finalAction?.toUpperCase() === 'MUSNAH' ? 'bg-[#eb3434]/10 text-[#eb3434] border-[#eb3434]/30' : 
                        rule.finalAction?.toUpperCase() === 'PERMANEN' ? 'bg-[#ffe227]/10 text-[#ffe227] border-[#ffe227]/30' : 
                        'bg-slate-800 text-slate-300 border-slate-600'}
                    `}>
                      {rule.finalAction}
                    </span>
                  </div>

                  {/* Aksi */}
                  <div className="md:col-span-1 flex justify-end gap-2">
                    <button className="w-8 h-8 rounded-lg bg-black hover:bg-slate-800 flex items-center justify-center text-slate-400 border border-white/5 transition-colors" title="Edit JRA">
                      ✏️
                    </button>
                  </div>

                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}