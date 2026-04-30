'use client';

import { useState, useEffect } from 'react';

// STRUKTUR DATA DIPERBAIKI: Menyesuaikan dengan Entity Backend NestJS
interface Archive {
  id: string;
  code: string;        // Disesuaikan dari kodeKlasifikasi
  title: string;       // Disesuaikan dari judul
  category: string;    // Disesuaikan dari kategori
  uploadDate: string;  // Disesuaikan dari tanggalDibuat
  statusJRA?: string; 
}

export default function DisposalPage() {
  const [items, setItems] = useState<Archive[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDisposal = async () => {
    try {
      const res = await fetch('http://localhost:3001/archives');
      const data = await res.json();

      if (Array.isArray(data)) {
        
        const processedData = data.map((item: Archive) => {
          let calculatedJRA = 'Masih Aktif';
          
          // MENGGUNAKAN item.category SESUAI BACKEND
          const kategoriAman = item.category || ''; 
          
          if (kategoriAman.toUpperCase() === 'INAKTIF') {
            calculatedJRA = 'Musnah'; 
          } else if (kategoriAman.toUpperCase() === 'VITAL') {
            calculatedJRA = 'Permanen'; 
          }

          return { ...item, statusJRA: calculatedJRA };
        });

        const disposalCandidates = processedData.filter(i => i.statusJRA !== 'Masih Aktif');
        setItems(disposalCandidates);
      } else {
        console.error('Data dari backend bukan array:', data);
        setItems([]);
      }
    } catch (e) {
      console.error('Gagal mengambil data penyusutan:', e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisposal();
  }, []);

  const getStatusStyle = (status?: string) => {
    if (status === 'Musnah') return 'bg-[#eb3434]/20 text-[#eb3434] border-[#eb3434]/50 shadow-[0_0_15px_rgba(235,52,52,0.3)]';
    if (status === 'Permanen') return 'bg-[#ffe227]/20 text-[#ffe227] border-[#ffe227]/50';
    return 'bg-slate-800 text-slate-300 border-slate-600';
  };

  return (
    <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-serif text-white tracking-tight mb-2">Penyusutan <span className="italic text-[#eb3434]">Arsip.</span></h1>
          <p className="text-slate-500 text-[10px] font-black tracking-[0.2em] uppercase">
            Manajemen Jadwal Retensi dan Eksekusi Rekod
          </p>
        </div>
      </div>

      {/* Tabel Data Premium */}
      <div className="bg-[#1a1a1a] rounded-[2rem] border border-white/5 overflow-hidden shadow-2xl relative">
        
        {/* Garis Aksen Merah Tanda Bahaya (Destruction Zone) */}
        <div className="h-1 w-full bg-gradient-to-r from-[#eb3434] via-[#111111] to-[#eb3434] opacity-50"></div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#111111] border-b border-white/5">
                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Kode Klasifikasi</th>
                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Judul & Deskripsi Rekod</th>
                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Tanggal Dibuat</th>
                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Rekomendasi JRA</th>
                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Tindakan Eksekusi</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-slate-500 font-mono text-xs uppercase tracking-widest">
                    Menganalisis jadwal retensi institusi...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-slate-500 font-mono text-xs uppercase tracking-widest">
                    Brankas bersih. Tidak ada arsip yang memasuki masa penyusutan.
                  </td>
                </tr>
              ) : (
                items.map((arsip) => (
                  <tr key={arsip.id} className="hover:bg-white/5 transition-colors group">
                    {/* Menggunakan arsip.code */}
                    <td className="p-6 font-mono text-xs text-white/80 font-bold">{arsip.code || 'N/A'}</td>
                    
                    <td className="p-6">
                      {/* Menggunakan arsip.title dan arsip.category */}
                      <p className="text-white font-semibold text-sm mb-1">{arsip.title}</p>
                      <p className="text-slate-500 text-[10px] font-mono uppercase tracking-widest">Kategori Awal: {arsip.category || 'Tanpa Kategori'}</p>
                    </td>
                    
                    <td className="p-6 font-mono text-xs text-slate-400">
                      {/* Menggunakan arsip.uploadDate */}
                      {arsip.uploadDate ? new Date(arsip.uploadDate).toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: 'numeric'}) : '-'}
                    </td>
                    
                    <td className="p-6">
                      <span className={`px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-widest ${getStatusStyle(arsip.statusJRA)}`}>
                        {arsip.statusJRA}
                      </span>
                    </td>
                    
                    <td className="p-6 text-right">
                      {arsip.statusJRA === 'Musnah' ? (
                        <button className="px-5 py-2 bg-[#111111] hover:bg-[#eb3434] text-[#eb3434] hover:text-white border border-[#eb3434]/30 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shadow-[0_0_10px_rgba(235,52,52,0)] hover:shadow-[0_0_15px_rgba(235,52,52,0.4)]">
                          Eksekusi Musnah
                        </button>
                      ) : (
                        <button className="px-5 py-2 bg-[#111111] hover:bg-[#ffe227] text-[#ffe227] hover:text-black border border-[#ffe227]/30 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shadow-[0_0_10px_rgba(255,226,39,0)] hover:shadow-[0_0_15px_rgba(255,226,39,0.4)]">
                          Serahkan ke ANRI
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}