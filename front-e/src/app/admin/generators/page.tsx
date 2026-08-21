'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { generatorService } from '@/lib/services/admin.service';
import { Generator, GeneratorRequest, PageResponse } from '@/types';
import AdminLayout from '@/components/layouts/AdminLayout';
import Pagination from '@/components/ui/Pagination';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { formatDate } from '@/lib/utils/format';
import {
  Zap, Plus, Search, MapPin, Mail, Phone,
  MessageSquare, FileText, Info, X, Pencil, Trash2,
  ChevronRight, Activity
} from 'lucide-react';

export default function AdminGenerators() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [generators, setGenerators] = useState<PageResponse<Generator> | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingGen, setEditingGen] = useState<Generator | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<GeneratorRequest>({
    model: '', name: '', capacity: '', locationName: '', ownerEmail: '', whatsAppNumber: '', landlineNumber: '', note: '',
  });

  useEffect(() => { loadGenerators(0); }, []);

  const loadGenerators = async (page: number, query = '') => {
    try {
      const data = query ? await generatorService.searchByName(query, { page, size: 10 }) : await generatorService.getAll({ page, size: 10 });
      setGenerators(data);
      setCurrentPage(page);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadGenerators(0, searchQuery);
  };

  const handleCreate = () => {
    setEditingGen(null);
    setFormData({ model: '', name: '', capacity: '', locationName: '', ownerEmail: '', whatsAppNumber: '', landlineNumber: '', note: '' });
    setShowModal(true);
  };

  const handleEdit = (gen: Generator) => {
    setEditingGen(gen);
    setFormData({ model: gen.model, name: gen.name, capacity: gen.capacity || '', locationName: gen.locationName, ownerEmail: gen.ownerEmail || '', whatsAppNumber: gen.whatsAppNumber || '', landlineNumber: gen.landlineNumber || '', note: gen.note || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      editingGen ? await generatorService.update(editingGen.id, formData) : await generatorService.create(formData);
      setShowModal(false);
      loadGenerators(currentPage, searchQuery);
    } catch (error: any) { alert(error.response?.data?.message || 'Error saving generator'); }
  };

  const confirmDelete = async () => {
    if (deletingId == null) return;
    try {
      await generatorService.delete(deletingId);
      loadGenerators(currentPage, searchQuery);
    } catch (error: any) { alert(error.response?.data?.message || 'Error deleting generator'); }
    finally { setDeletingId(null); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <AdminLayout>
      <div className="max-w-[1600px] mx-auto space-y-4">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black text-black tracking-tighter uppercase">Asset <span className="text-brand">Inventory</span></h2>
            <p className="text-[10px] font-black text-black/50 uppercase tracking-widest mt-0.5 italic">Generator Fleet Management</p>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center justify-center gap-2 bg-brand hover:shadow-lg text-cream px-5 py-2.5 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-sm active:scale-95"
          >
            <Plus size={18} /> Register Asset
          </button>
        </div>

        {/* Search Bar */}
        <div className="bg-cream p-3 rounded-xl border border-brand/20 shadow-sm flex flex-col md:flex-row gap-3">
          <form onSubmit={handleSearch} className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40" size={18} />
            <input
              type="text"
              placeholder="Filter by machine name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-brand/5 border-none rounded-xl py-3 pl-12 pr-4 text-sm font-bold text-black focus:ring-2 focus:ring-brand/30 transition-all outline-none"
            />
          </form>
          <div className="flex gap-2">
            <button onClick={() => loadGenerators(0, searchQuery)} className="bg-brand text-cream px-6 rounded-xl font-black uppercase tracking-widest text-[10px] active:scale-95 transition-transform">Filter</button>
            <button onClick={() => { setSearchQuery(''); loadGenerators(0); }} className="bg-cream text-black border border-brand/30 px-5 rounded-xl font-black uppercase tracking-widest text-[10px]">Reset</button>
          </div>
        </div>

        {/* Assets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {generators && generators.content.length > 0 ? (
            generators.content.map((gen) => (
              <div key={gen.id} className="bg-cream rounded-xl border border-brand/20 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group flex flex-col">
                <div className="p-3 pb-0 flex justify-between items-start">
                  <div className="bg-brand/10 p-2 rounded-lg text-brand group-hover:bg-brand group-hover:text-cream transition-colors">
                    <Zap size={18} fill="currentColor" />
                  </div>
                  <span className="bg-brand/10 text-brand px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-brand/20">
                    <Activity size={11} /> Registered
                  </span>
                </div>

                <div className="p-3 space-y-2 flex-1">
                  <div>
                    <h3 className="text-base font-black text-black uppercase tracking-tight leading-tight">{gen.name}</h3>
                    <p className="text-[10px] font-bold text-black/50 uppercase tracking-widest">Model: {gen.model}</p>
                  </div>

                  <div className="space-y-1.5 border-t border-brand/10 pt-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-black/70">
                      <MapPin size={13} className="text-black/30" />
                      <span>{gen.locationName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-black/70">
                      <Info size={13} className="text-black/30" />
                      <span>Capacity: {gen.capacity || 'N/A'}</span>
                    </div>
                    {gen.ownerEmail && (
                      <div className="flex items-center gap-2 text-[10px] font-bold text-black/50">
                        <Mail size={12} className="text-black/30" />
                        <span className="truncate">{gen.ownerEmail}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-brand/5 px-3 py-2.5 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <button
                      onClick={() => router.push(`/admin/generators/${gen.id}`)}
                      className="text-[10px] font-black text-brand uppercase tracking-widest flex items-center gap-1 group/btn"
                    >
                      Full Details <ChevronRight size={12} className="group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                    <div className="flex gap-1">
                      <button onClick={() => handleEdit(gen)} className="p-1.5 text-black/50 hover:text-black hover:bg-cream rounded-lg transition-all"><Pencil size={14} /></button>
                      <button onClick={() => setDeletingId(gen.id)} aria-label={`Delete ${gen.name}`} className="p-1.5 text-black/50 hover:text-red-600 hover:bg-cream rounded-lg transition-all"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full bg-cream rounded-2xl p-12 text-center border-2 border-dashed border-brand/20">
              <div className="mx-auto w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center text-brand mb-4">
                <Zap size={32} />
              </div>
              <p className="text-sm font-bold text-black/50 uppercase tracking-widest">No Assets Detected in Registry</p>
            </div>
          )}
        </div>

        {generators && (
          <div className="mt-4">
             <Pagination currentPage={currentPage} totalPages={generators.totalPages} onPageChange={(p) => loadGenerators(p, searchQuery)} />
          </div>
        )}
      </div>

      {/* Asset Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-cream w-full max-w-lg rounded-2xl shadow-xl overflow-hidden border border-brand/20 animate-in fade-in zoom-in duration-200">
            <div className="bg-brand px-6 py-4 flex justify-between items-center text-cream">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cream/10 rounded-xl">
                  <Zap size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-widest">{editingGen ? 'Update Asset' : 'New Asset'}</h3>
                  <p className="text-[10px] font-bold text-cream/70 uppercase tracking-[0.2em] italic">Generator Specifications</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="bg-cream/10 p-2 rounded-xl hover:bg-cream/20 transition-all"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-[10px] font-black text-black/50 uppercase tracking-widest mb-1 block ml-1 text-xs">Machine Name *</label>
                  <input required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-brand/5 rounded-xl py-2.5 px-4 text-sm font-bold text-black border-none outline-none focus:ring-2 focus:ring-brand/30" placeholder="e.g. Cummins-01" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-black/50 uppercase tracking-widest mb-1 block ml-1 text-xs">Model Number *</label>
                  <input required value={formData.model} onChange={(e) => setFormData({...formData, model: e.target.value})} className="w-full bg-brand/5 rounded-xl py-2.5 px-4 text-sm font-bold text-black border-none outline-none focus:ring-2 focus:ring-brand/30" placeholder="C44D5" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-black/50 uppercase tracking-widest mb-1 block ml-1 text-xs">Capacity</label>
                  <input value={formData.capacity} onChange={(e) => setFormData({...formData, capacity: e.target.value})} className="w-full bg-brand/5 rounded-xl py-2.5 px-4 text-sm font-bold text-black border-none outline-none focus:ring-2 focus:ring-brand/30" placeholder="44kVA" />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-black text-black/50 uppercase tracking-widest mb-1 block ml-1 text-xs">Location Name *</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-black/30" size={14} />
                    <input required value={formData.locationName} onChange={(e) => setFormData({...formData, locationName: e.target.value})} className="w-full bg-brand/5 rounded-xl py-2.5 pl-10 pr-4 text-sm font-bold text-black border-none outline-none focus:ring-2 focus:ring-brand/30" placeholder="Main Branch" />
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-black text-black/50 uppercase tracking-widest mb-1 block ml-1 text-xs">Owner Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-black/30" size={14} />
                    <input type="email" value={formData.ownerEmail} onChange={(e) => setFormData({...formData, ownerEmail: e.target.value})} className="w-full bg-brand/5 rounded-xl py-2.5 pl-10 pr-4 text-sm font-bold text-black border-none outline-none focus:ring-2 focus:ring-brand/30" placeholder="client@example.com" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-black/50 uppercase tracking-widest mb-1 block ml-1 text-xs">WhatsApp</label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 text-black/30" size={14} />
                    <input value={formData.whatsAppNumber || ''} onChange={(e) => setFormData({...formData, whatsAppNumber: e.target.value})} className="w-full bg-brand/5 rounded-xl py-2.5 pl-10 pr-4 text-sm font-bold text-black border-none outline-none focus:ring-2 focus:ring-brand/30" placeholder="+94..." />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-black/50 uppercase tracking-widest mb-1 block ml-1 text-xs">Landline</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-black/30" size={14} />
                    <input value={formData.landlineNumber || ''} onChange={(e) => setFormData({...formData, landlineNumber: e.target.value})} className="w-full bg-brand/5 rounded-xl py-2.5 pl-10 pr-4 text-sm font-bold text-black border-none outline-none focus:ring-2 focus:ring-brand/30" />
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-black text-black/50 uppercase tracking-widest mb-1 block ml-1 text-xs">Technical Notes</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 text-black/30" size={14} />
                    <textarea value={formData.note} onChange={(e) => setFormData({...formData, note: e.target.value})} className="w-full bg-brand/5 rounded-xl py-2.5 pl-10 pr-4 text-sm font-bold text-black border-none outline-none focus:ring-2 focus:ring-brand/30 min-h-[90px]" placeholder="Specific service requirements..." />
                  </div>
                </div>
              </div>

              <button type="submit" className="w-full bg-brand text-cream font-black uppercase tracking-[0.2em] py-3.5 rounded-xl shadow-sm hover:shadow-lg transition-all active:scale-95 mt-2">
                Commit to Inventory
              </button>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deletingId !== null}
        title="Delete Asset"
        message="Are you sure? This will fail if there are associated tickets."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeletingId(null)}
      />
    </AdminLayout>
  );
}
