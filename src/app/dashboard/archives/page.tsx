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
  retentionDate?: string;
}

interface AccessRequest {
  id: string;
  archiveId: string;
  status: string;
  staffName: string;
}

export default function ArchivesListPage() {
  const [archives, setArchives] = useState<Archive[]>([]);
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('STAFF');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState<Partial<Archive>>({});
  const [isUpdating, setIsUpdating] = useState(false);

  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [selectedAccessArchive, setSelectedAccessArchive] = useState<Archive | null>(null);
  const [accessReason, setAccessReason] = useState('');
  const [isSubmittingAccess, setIsSubmittingAccess] = useState(false);

  // Fungsi Fetch Data
  const fetchData = async () => {
    try {
      const resArchives = await fetch('http://localhost:3001/archives');
      if (resArchives.ok) {
        const data = await resArchives.json();
        const sortedData = data.sort((a: any, b: any) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
        setArchives(sortedData);
      }

      const resRequests = await fetch('http://localhost:3001/access-requests');
      if (resRequests.ok) {
        const reqData = await resRequests.json();
        setAccessRequests(reqData);
      }
    } catch (error) {
      console.error('Gagal mengambil data:', error);
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

    fetchData();
    
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  // --- FUNGSI BARU: BUKA DOKUMEN & AKSES SEKALI PAKAI ---
  const handleOpenDocument = async (archive: Archive, accessRequestId?: string) => {
    if (!archive.fileUrl) {
      alert('Maaf, file PDF tidak ditemukan pada arsip ini.');
      return;
    }

    // 1. Eksekusi Pembukaan PDF di Tab Baru
    const fileLink = archive.fileUrl.startsWith('http') 
      ? archive.fileUrl 
      : `http://localhost:3001${archive.fileUrl.startsWith('/') ? '' : '/'}${archive.fileUrl}`;
    
    window.open(fileLink, '_blank');

    // 2. Jika ada accessRequestId, artinya ini Staf. Kita hanguskan aksesnya sekarang!
    if (accessRequestId) {
      try {
        await fetch(`http://localhost:3001/access-requests/${accessRequestId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'USED' }), // Ubah status menjadi USED (Sudah Dipakai)
        });
        // Tarik data ulang agar tombol langsung tergembok kembali
        fetchData(); 
      } catch (error) {
        console.error('Gagal menghanguskan hak akses:', error);
      }
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (userRole === 'STAFF') return;
    if (confirm(`Peringatan: Anda yakin ingin memusnahkan arsip "${title}" secara permanen?`)) {
      try {
        const res = await fetch(`http://localhost:3001/archives/${id}`, { method: 'DELETE' });
        if (res.ok) fetchData();
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
          retentionDate: editData.retentionDate || null, 
        }),
      });

      if (res.ok) {
        fetchData(); 
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

  const openAccessModal = (archive: Archive) => {
    setSelectedAccessArchive(archive);
    setIsAccessModalOpen(true);
  };

  const handleAccessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccessArchive) return;
    
    setIsSubmittingAccess(true);
    try {
      const res = await fetch('http://localhost:3001/access-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          archiveId: selectedAccessArchive.id,
          archiveTitle: selectedAccessArchive.title,
          staffName: 'Akun Staf (Berdasarkan Sesi)',
          reason: accessReason,
        }),
      });

      if (res.ok) {
        alert('Pengajuan akses berhasil dikirim ke Admin/Arsiparis! Silakan tunggu persetujuan.');
        setIsAccessModalOpen(false);
        setAccessReason('');
        fetchData();
      } else {
        alert('Gagal mengirim pengajuan.');
      }
    } catch (error) {
      alert('Terjadi kesalahan jaringan.');
    } finally {
      setIsSubmittingAccess(false);
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

  // Helper yang dimodifikasi untuk mengembalikan ID request agar bisa dihanguskan
  const getStaffAccessStatus = (archiveId: string) => {
    const requestsForThisArchive = accessRequests.filter(req => req.archiveId === archiveId);
    
    const approvedReq = requestsForThisArchive.find(req => req.status === 'APPROVED');
    if (approvedReq) return { status: 'APPROVED', requestId: approvedReq.id };
    
    const pendingReq = requestsForThisArchive.find(req => req.status === 'PENDING');
    if (pendingReq) return { status: 'PENDING' };
    
    // Status 'USED', 'REJECTED', atau belum ada
    return { status: 'NONE' };
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
                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={5} className="p-10 text-center text-slate-500 font-mono text-xs uppercase tracking-widest">Membuka brankas data...</td></tr>
              ) : visibleArchives.length === 0 ? (
                <tr><td colSpan={5} className="p-10 text-center text-slate-500 font-mono text-xs uppercase tracking-widest">Belum ada arsip yang terdaftar.</td></tr>
              ) : (
                visibleArchives.map((archive) => {
                  const accessInfo = getStaffAccessStatus(archive.id);
                  
                  return (
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
                      
                      <td className="p-6 text-right">
                        <div className="flex justify-end gap-2">
                          {userRole === 'STAFF' ? (
                            <>
                              {accessInfo.status === 'APPROVED' && (
                                <button 
                                  onClick={() => handleOpenDocument(archive, accessInfo.requestId)}
                                  className="px-5 py-2 bg-[#0a8270] hover:bg-teal-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shadow-[0_0_10px_rgba(10,130,112,0.4)]"
                                >
                                  📄 Buka Dokumen
                                </button>
                              )}
                              {accessInfo.status === 'PENDING' && (
                                <button disabled className="px-5 py-2 bg-slate-800 text-slate-400 border border-slate-600 rounded-lg text-[9px] font-black uppercase tracking-widest opacity-70 cursor-not-allowed">
                                  ⏳ Menunggu Izin
                                </button>
                              )}
                              {accessInfo.status === 'NONE' && (
                                <button 
                                  onClick={() => openAccessModal(archive)} 
                                  className="px-5 py-2 bg-[#f59e0b]/20 hover:bg-[#f59e0b] text-[#f59e0b] hover:text-black border border-[#f59e0b]/50 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shadow-[0_0_10px_rgba(245,158,11,0)] hover:shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                                >
                                  🔒 Ajukan Akses
                                </button>
                              )}
                            </>
                          ) : (
                            <>
                              {/* ADMIN & ARSIPARIS bisa buka kapan saja tanpa batasan */}
                              <button onClick={() => handleOpenDocument(archive)} className="w-8 h-8 rounded-lg bg-[#111111] hover:bg-[#2358d8]/20 flex items-center justify-center text-slate-400 hover:text-[#2358d8] border border-white/5 hover:border-[#2358d8]/50 transition-colors" title="Buka Dokumen PDF">📄</button>
                              <button onClick={() => openEditModal(archive)} className="w-8 h-8 rounded-lg bg-[#111111] hover:bg-[#ffe227]/20 flex items-center justify-center text-slate-400 hover:text-[#ffe227] border border-white/5 hover:border-[#ffe227]/50 transition-colors" title="Edit Metadata">✏️</button>
                              <button onClick={() => handleDelete(archive.id, archive.title)} className="w-8 h-8 rounded-lg bg-[#111111] hover:bg-[#eb3434]/20 flex items-center justify-center text-slate-400 hover:text-[#eb3434] border border-white/5 hover:border-[#eb3434]/50 transition-colors" title="Musnahkan">🗑️</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL EDIT (Tetap Sama) --- */}
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

      {/* --- MODAL PENGAJUAN AKSES (Tetap Sama) --- */}
      {isAccessModalOpen && selectedAccessArchive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl transform transition-all">
            <div className="h-1 w-full bg-gradient-to-r from-[#f59e0b] to-[#eb3434]"></div>
            
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-serif text-white mb-1">Pengajuan <span className="italic text-[#f59e0b]">Akses.</span></h2>
                  <p className="text-slate-500 text-[10px] font-black tracking-widest uppercase">Dokumen Terbatas</p>
                </div>
                <button onClick={() => setIsAccessModalOpen(false)} className="text-slate-500 hover:text-white text-xl">✕</button>
              </div>

              <div className="mb-6 p-4 bg-[#111111] rounded-xl border border-white/5">
                <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mb-1">Target Dokumen:</p>
                <p className="text-white font-mono text-sm">{selectedAccessArchive.code} - {selectedAccessArchive.title}</p>
              </div>

              <form onSubmit={handleAccessSubmit} className="space-y-6">
                <div>
                  <label className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">
                    Alasan / Urgensi Kebutuhan Akses
                  </label>
                  <textarea 
                    required
                    rows={4}
                    value={accessReason}
                    onChange={(e) => setAccessReason(e.target.value)}
                    placeholder="Jelaskan secara singkat mengapa Anda membutuhkan dokumen ini untuk pekerjaan Anda..."
                    className="w-full bg-[#111111] border border-white/5 text-white px-4 py-3.5 rounded-xl focus:outline-none focus:border-[#f59e0b] focus:ring-1 focus:ring-[#f59e0b] transition-colors font-mono text-sm resize-none"
                  ></textarea>
                </div>

                <div className="flex gap-4 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setIsAccessModalOpen(false)}
                    className="flex-1 py-3.5 bg-transparent border border-slate-700 text-slate-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmittingAccess}
                    className="flex-1 py-3.5 bg-[#f59e0b] hover:bg-yellow-500 text-black rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-yellow-900/20 disabled:opacity-50"
                  >
                    {isSubmittingAccess ? 'Mengirim...' : 'Kirim Permintaan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}