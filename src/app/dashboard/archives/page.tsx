'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Archive {
  id: string;
  code: string;
  title: string;
  category: string;
  description: string;
  fileUrl: string;
  uploadDate: string;
  retentionDate?: string; // Tambahan field retensi
}

export default function ArchivesListPage() {
  const [archives, setArchives] = useState<Archive[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('STAFF');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState<Partial<Archive>>({});
  const [isUpdating, setIsUpdating] = useState(false);

  // Fungsi Fetch Data
  const fetchArchives = async () => {
    try {
      const res = await fetch('http://localhost:3001/archives');
      if (res.ok) {
        const data = await res.json();
        const sortedData = data.sort((a: any, b: any) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
        setArchives(sortedData);
      }
    } catch (error) {
      console.error('Gagal mengambil daftar arsip:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };
    const roleFromCookie = getCookie('userRole');
    if (roleFromCookie) setUserRole(roleFromCookie.toUpperCase());

    fetchArchives();
    
    // Auto-refresh layar setiap 5 detik agar jika sistem menghapus otomatis, tabel langsung update
    const interval = setInterval(fetchArchives, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (id: string, title: string) => {
    if (userRole === 'STAFF') return;
    if (confirm(`Peringatan: Anda yakin ingin memusnahkan arsip "${title}" secara permanen?`)) {
      try {
        const res = await fetch(`http://localhost:3001/archives/${id}`, { method: 'DELETE' });
        if (res.ok) setArchives((prev) => prev.filter((archive) => archive.id !== id));
      } catch (error) {
        console.error(error);
      }
    }
  };

  const openEditModal = (archive: Archive) => {
    if (userRole === 'STAFF') return;
    setEditData(archive);
    setIsEditModalOpen(true);
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editData.id) return;

    setIsUpdating(true);
    try {
      const res = await fetch(`http://localhost:3001/archives/${editData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editData.title,
          code: editData.code,
          category: editData.category,
          description: editData.description,
          retentionDate: editData.retentionDate || null, // Kirim tanggal retensi
        }),
      });

      if (res.ok) {
        fetchArchives(); // Refresh tabel setelah update
        setIsEditModalOpen(false);
        setEditData({});
      } else {
        alert('Gagal memperbarui metadata arsip.');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  const visibleArchives = archives.filter(archive => {
    if (userRole === 'STAFF' && archive.category?.toUpperCase() === 'VITAL') return false;
    return true;
  });

  const getCategoryBadge = (category: string) => {
    if (!category) return 'bg-[#2358d8]/20 text-[#2358d8] border-[#2358d8]/50';
    const cat = category.toUpperCase();
    if (cat === 'AKTIF') return 'bg-[#0a8270]/20 text-[#0a8270] border-[#0a8270]/50';
    if (cat === 'INAKTIF') return 'bg-[#ffe227]/20 text-[#ffe227] border-[#ffe227]/50';
    if (cat === 'VITAL') return 'bg-[#eb3434]/20 text-[#eb3434] border-[#eb3434]/50 shadow-[0_0_10px_rgba(235,52,52,0.3)]';
    return 'bg-slate-800 text-slate-300 border-slate-600';
  };

  return (
    <div className="space-y-8 animate-[fadeIn_0.5s_ease-out] relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-serif text-white tracking-tight mb-2">Daftar <span className="italic text-[#2358d8]">Koleksi Arsip.</span></h1>
          <p className="text-slate-500 text-[10px] font-black tracking-[0.2em] uppercase">Sistem Temu Kembali Rekod Institusi</p>
        </div>
        {userRole !== 'STAFF' && (
          <Link href="/dashboard/capture" className="px-6 py-4 bg-[#2358d8] hover:bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-blue-900/50 hover:-translate-y-1">
            + Registrasi Arsip Baru
          </Link>
        )}
      </div>

      <div className="bg-[#1a1a1a] rounded-[2rem] border border-white/5 overflow-hidden shadow-2xl relative">
        <div className="h-1 w-full bg-gradient-to-r from-[#2358d8] via-[#111111] to-[#2358d8] opacity-50"></div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#111111] border-b border-white/5">
                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Kode Klasifikasi</th>
                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Judul & Deskripsi Rekod</th>
                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Kategori</th>
                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Batas JRA</th>
                {userRole !== 'STAFF' && <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Tindakan</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={userRole !== 'STAFF' ? 5 : 4} className="p-10 text-center text-slate-500 font-mono text-xs uppercase tracking-widest">Membuka brankas data...</td></tr>
              ) : visibleArchives.length === 0 ? (
                <tr><td colSpan={userRole !== 'STAFF' ? 5 : 4} className="p-10 text-center text-slate-500 font-mono text-xs uppercase tracking-widest">Belum ada arsip yang terdaftar.</td></tr>
              ) : (
                visibleArchives.map((archive) => (
                  <tr key={archive.id} className="hover:bg-white/5 transition-colors group">
                    <td className="p-6 font-mono text-xs text-white/80 font-bold">{archive.code || '-'}</td>
                    <td className="p-6">
                      <p className="text-white font-semibold text-sm mb-1">{archive.title}</p>
                      <p className="text-slate-500 text-[10px] font-mono uppercase tracking-widest">
                        {archive.description ? archive.description.substring(0, 50) + '...' : 'TIDAK ADA DESKRIPSI'}
                      </p>
                    </td>
                    <td className="p-6">
                      <span className={`px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-widest ${getCategoryBadge(archive.category)}`}>
                        {archive.category || 'AKTIF'}
                      </span>
                    </td>
                    <td className="p-6 font-mono text-xs text-slate-400">
                      
                      {archive.retentionDate ? new Date(archive.retentionDate).toLocaleDateString('id-ID') : <span className="text-[#FFE227]">Belum Diset</span>}
                    </td>
                    {userRole !== 'STAFF' && (
                      <td className="p-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => openEditModal(archive)} className="w-8 h-8 rounded-lg bg-[#111111] hover:bg-[#ffe227]/20 flex items-center justify-center text-slate-400 hover:text-[#ffe227] border border-white/5 hover:border-[#ffe227]/50 transition-colors" title="Edit Metadata">✏️</button>
                          <button onClick={() => handleDelete(archive.id, archive.title)} className="w-8 h-8 rounded-lg bg-[#111111] hover:bg-[#eb3434]/20 flex items-center justify-center text-slate-400 hover:text-[#eb3434] border border-white/5 hover:border-[#eb3434]/50 transition-colors" title="Musnahkan">🗑️</button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-[#1a1a1a] rounded-[2rem] border border-white/10 p-8 w-full max-w-2xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#ffe227] to-transparent opacity-50"></div>
            <h2 className="text-2xl font-serif text-white mb-2">Edit <span className="italic text-[#ffe227]">Metadata & JRA.</span></h2>
            <p className="text-slate-500 text-[10px] font-black tracking-[0.2em] uppercase mb-8">Pembaruan tercatat di Audit Log Sistem</p>
            
            <form onSubmit={handleUpdateSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Judul Dokumen</label>
                  <input type="text" required value={editData.title || ''} onChange={(e) => setEditData({...editData, title: e.target.value})} className="w-full bg-[#111111] border border-slate-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-[#ffe227] font-mono text-sm" />
                </div>
                <div>
                  <label className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Kode Klasifikasi</label>
                  <input type="text" required value={editData.code || ''} onChange={(e) => setEditData({...editData, code: e.target.value})} className="w-full bg-[#111111] border border-slate-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-[#ffe227] font-mono text-sm uppercase" />
                </div>
                <div>
                  <label className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Status / Kategori</label>
                  <select value={editData.category || 'Aktif'} onChange={(e) => setEditData({...editData, category: e.target.value})} className="w-full bg-[#111111] border border-slate-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-[#ffe227] font-mono text-sm appearance-none cursor-pointer">
                    <option value="Aktif">Arsip Aktif</option>
                    <option value="Inaktif">Arsip Inaktif</option>
                    <option value="Vital">Arsip Vital</option>
                  </select>
                </div>
                
                
                <div className="col-span-1 md:col-span-2 border border-dashed border-[#eb3434]/50 p-4 rounded-xl bg-[#eb3434]/5">
                  <label className="block text-[#eb3434] text-[10px] font-black uppercase tracking-widest mb-2">Jadwal Retensi (Tanggal Pemusnahan Otomatis)</label>
                  <input 
                    type="date" 
                    value={editData.retentionDate ? editData.retentionDate.split('T')[0] : ''}
                    onChange={(e) => setEditData({...editData, retentionDate: e.target.value})}
                    className="w-full bg-[#111111] border border-[#eb3434]/30 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-[#eb3434] font-mono text-sm"
                  />
                  <p className="text-[9px] text-slate-500 mt-2 font-mono uppercase">Kosongkan jika arsip ini bersifat permanen.</p>
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Deskripsi Ringkas</label>
                  <textarea rows={3} value={editData.description || ''} onChange={(e) => setEditData({...editData, description: e.target.value})} className="w-full bg-[#111111] border border-slate-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-[#ffe227] font-mono text-sm resize-none"></textarea>
                </div>
              </div>

              <div className="flex items-center justify-end gap-4 pt-6 mt-6 border-t border-white/5">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-6 py-3 text-slate-400 hover:text-white font-black text-[10px] uppercase tracking-widest transition-colors">Batal</button>
                <button type="submit" disabled={isUpdating} className="px-8 py-3 bg-[#ffe227] hover:bg-yellow-400 text-black rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-yellow-500/10 hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0">{isUpdating ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}