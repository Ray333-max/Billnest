
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, Trash2, X, Printer, Lock, Download, AlertCircle, CheckCircle2, Building, Mail, StickyNote, HelpCircle } from 'lucide-react';
import { Invoice, InvoiceStatus, Client, InvoiceItem } from '../types';
import { BusinessAIService } from '../geminiService';

interface InvoiceViewProps {
  invoices: Invoice[];
  clients: Client[];
  isPro: boolean;
  onAddInvoice: (inv: Invoice) => void;
  onDeleteInvoice: (id: string) => void;
  onUpdateStatus: (id: string, status: InvoiceStatus) => void;
  onUpgradePrompt: () => void;
}

const aiService = new BusinessAIService();

const InvoiceView: React.FC<InvoiceViewProps> = ({ 
  invoices, clients, isPro, onAddInvoice, onDeleteInvoice, onUpdateStatus, onUpgradePrompt 
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmingUpdate, setConfirmingUpdate] = useState<{ id: string, newStatus: InvoiceStatus } | null>(null);
  
  const FREE_LIMIT = 3;
  const reachedLimit = !isPro && invoices.length >= FREE_LIMIT;

  const [newInv, setNewInv] = useState<Partial<Invoice>>({
    invoiceNumber: `INV-${Math.floor(Math.random() * 9000 + 1000)}`,
    status: InvoiceStatus.PENDING,
    items: [{ id: '1', description: '', quantity: 1, rate: 0 }],
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    tax: 0,
    clientId: clients[0]?.id || ''
  });

  const [aiLoading, setAiLoading] = useState(false);

  const calculateSubtotal = (items: InvoiceItem[]) => items.reduce((s, i) => s + (i.quantity * i.rate), 0);

  const handleAddItem = () => {
    setNewInv({
      ...newInv,
      items: [...(newInv.items || []), { id: Math.random().toString(), description: '', quantity: 1, rate: 0 }]
    });
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setNewInv({
      ...newInv,
      items: newInv.items?.map(item => item.id === id ? { ...item, [field]: value } : item)
    });
  };

  const handleGenerateNotes = async () => {
    if (!newInv.items?.[0]?.description) return;
    setAiLoading(true);
    try {
      const notes = await aiService.generateInvoiceNotes(newInv.items[0].description);
      setNewInv(prev => ({ ...prev, notes }));
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reachedLimit) {
      onUpgradePrompt();
      return;
    }
    if (!newInv.clientId) return;
    onAddInvoice({
      ...newInv,
      id: Math.random().toString(),
      createdAt: Date.now(),
    } as Invoice);
    setIsAdding(false);
  };

  const handleConfirmUpdate = () => {
    if (confirmingUpdate) {
      onUpdateStatus(confirmingUpdate.id, confirmingUpdate.newStatus);
      setConfirmingUpdate(null);
    }
  };

  const filteredInvoices = invoices.filter(inv => 
    inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedClient = clients.find(c => c.id === newInv.clientId);

  return (
    <div className="space-y-10 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Ledger</h1>
          <p className="text-slate-500 text-sm mt-2 font-medium">
            {!isPro && <span className="text-emerald-600 font-bold">{invoices.length}/{FREE_LIMIT}</span>} documents created this cycle.
          </p>
        </motion.div>
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => reachedLimit ? onUpgradePrompt() : setIsAdding(true)}
          className={`flex items-center gap-2.5 px-6 py-4 font-black uppercase tracking-widest text-[10px] rounded-[1.5rem] transition-all shadow-2xl ${
            reachedLimit 
            ? 'bg-slate-200 text-slate-400' 
            : 'bg-emerald-600 text-white shadow-emerald-500/20 hover:bg-emerald-700 active:scale-95'
          }`}
        >
          {reachedLimit ? <Lock size={16}/> : <Plus size={18} />}
          {reachedLimit ? 'Upgrade for more' : 'New Document'}
        </motion.button>
      </header>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="flex items-center gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search documents by ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-6 py-4 bg-white/70 backdrop-blur-sm border border-white rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all text-sm font-medium"
          />
        </div>
        <button className="p-4 bg-white/70 border border-white rounded-2xl text-slate-400 hover:text-emerald-600 transition-colors">
          <Filter size={18} />
        </button>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, type: "spring" as const, stiffness: 300, damping: 30 }}
        className="bg-white/80 backdrop-blur-md border border-white rounded-[2.5rem] overflow-hidden shadow-sm"
      >
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <th className="px-8 py-6">Reference</th>
              <th className="px-8 py-6">Client</th>
              <th className="px-8 py-6">Valuation</th>
              <th className="px-8 py-6">Status</th>
              <th className="px-8 py-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            <AnimatePresence mode="popLayout">
              {filteredInvoices.map((inv, idx) => (
                <motion.tr 
                  key={inv.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.05, type: "spring" as const, stiffness: 300, damping: 30 }}
                  className="hover:bg-slate-50/50 group transition-colors"
                >
                  <td className="px-8 py-6">
                    <div className="font-bold text-slate-900 text-sm">{inv.invoiceNumber}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">{inv.dueDate}</div>
                  </td>
                  <td className="px-8 py-6 text-sm font-medium text-slate-600">
                    {clients.find(c => c.id === inv.clientId)?.name || 'Unknown Client'}
                  </td>
                  <td className="px-8 py-6 text-sm font-bold text-slate-900">
                    ${calculateSubtotal(inv.items).toLocaleString()}
                  </td>
                  <td className="px-8 py-6">
                    <button 
                      onClick={() => {
                        const newStatus = inv.status === InvoiceStatus.PAID ? InvoiceStatus.PENDING : InvoiceStatus.PAID;
                        setConfirmingUpdate({ id: inv.id, newStatus });
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                        inv.status === InvoiceStatus.PAID 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                        : 'bg-rose-50 text-rose-600 border-rose-100'
                      }`}
                    >
                      {inv.status === InvoiceStatus.PAID ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                      )}
                      {inv.status}
                    </button>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2.5 bg-slate-50 rounded-xl text-slate-400 hover:text-emerald-600 transition-all hover:scale-110">
                        <Printer size={16} />
                      </button>
                      <button onClick={() => onDeleteInvoice(inv.id)} className="p-2.5 bg-rose-50 rounded-xl text-slate-400 hover:text-rose-600 transition-all hover:scale-110">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </motion.div>

      {/* Confirmation Modal for Status Updates */}
      <AnimatePresence>
        {confirmingUpdate && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setConfirmingUpdate(null)}
              className="absolute inset-0 bg-slate-900/10 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              className="relative w-full max-w-sm bg-white rounded-[2.5rem] p-10 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] border border-slate-100"
            >
              <div className="flex flex-col items-center text-center">
                <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-6 ${
                  confirmingUpdate.newStatus === InvoiceStatus.PAID ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                }`}>
                  <HelpCircle size={32} />
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">Change Status?</h3>
                <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">
                  Are you sure you want to mark this document as <span className="font-bold text-slate-900 uppercase tracking-widest">{confirmingUpdate.newStatus}</span>?
                </p>
                <div className="grid grid-cols-2 gap-4 w-full">
                  <button 
                    onClick={() => setConfirmingUpdate(null)}
                    className="py-4 bg-slate-50 text-slate-400 font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleConfirmUpdate}
                    className={`py-4 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] ${
                      confirmingUpdate.newStatus === InvoiceStatus.PAID 
                      ? 'bg-emerald-600 shadow-emerald-500/20 hover:bg-emerald-700' 
                      : 'bg-slate-900 shadow-slate-900/10 hover:bg-slate-800'
                    }`}
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[200]">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAdding(false)} className="absolute inset-0 bg-slate-900/10 backdrop-blur-md" />
            <motion.div 
              initial={{ x: '100%' }} 
              animate={{ x: 0 }} 
              exit={{ x: '100%' }} 
              transition={{ type: 'spring' as const, damping: 28, stiffness: 220 }} 
              className="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl p-12 flex flex-col"
            >
              <div className="flex items-center justify-between mb-12">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">New Document</h2>
                <button onClick={() => setIsAdding(false)} className="p-3 hover:bg-slate-50 rounded-2xl transition-colors"><X size={24} /></button>
              </div>
              <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto custom-scrollbar space-y-12 pr-4">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Serial Reference</label>
                    <input type="text" value={newInv.invoiceNumber} onChange={e => setNewInv({ ...newInv, invoiceNumber: e.target.value })} className="w-full px-6 py-5 bg-slate-50 border-0 rounded-2xl focus:ring-4 focus:ring-emerald-500/5 text-sm font-bold tracking-tight" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entity Target</label>
                    <select value={newInv.clientId} onChange={e => setNewInv({ ...newInv, clientId: e.target.value })} className="w-full px-6 py-5 bg-slate-50 border-0 rounded-2xl focus:ring-4 focus:ring-emerald-500/5 text-sm font-bold">
                      <option value="" disabled>Select Client</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                <AnimatePresence>
                  {selectedClient?.notes && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-6 bg-orange-50 rounded-3xl border border-orange-100/50">
                        <div className="flex items-center gap-2 mb-3">
                          <StickyNote size={14} className="text-orange-500" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-orange-700">Client Insight</span>
                        </div>
                        <p className="text-xs text-slate-600 font-medium leading-relaxed italic">
                          "{selectedClient.notes}"
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900">Line Items</h3>
                    <button type="button" onClick={handleAddItem} className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">+ Add Record</button>
                  </div>
                  {newInv.items?.map((item) => (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      key={item.id} 
                      className="p-6 bg-slate-50/50 rounded-[2rem] grid grid-cols-12 gap-4 border border-slate-100"
                    >
                      <input type="text" placeholder="Service description..." className="col-span-12 px-5 py-4 bg-white border border-transparent focus:border-emerald-100 rounded-xl text-sm font-medium outline-none" value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)} />
                      <input type="number" placeholder="Qty" className="col-span-4 px-5 py-4 bg-white border border-transparent focus:border-emerald-100 rounded-xl text-sm font-bold outline-none" value={item.quantity} onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)} />
                      <input type="number" placeholder="Rate ($)" className="col-span-8 px-5 py-4 bg-white border border-transparent focus:border-emerald-100 rounded-xl text-sm font-bold outline-none" value={item.rate} onChange={e => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)} />
                    </motion.div>
                  ))}
                </div>
                <div className="p-10 bg-emerald-50/50 rounded-[2.5rem] border border-emerald-100/50">
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">AI Context Agent</span>
                    <button type="button" onClick={handleGenerateNotes} className="text-[9px] font-black text-white bg-emerald-600 px-4 py-2 rounded-xl hover:bg-emerald-700 transition-colors uppercase tracking-widest">{aiLoading ? 'Thinking...' : 'Compose'}</button>
                  </div>
                  <textarea value={newInv.notes} onChange={e => setNewInv({ ...newInv, notes: e.target.value })} className="w-full h-24 bg-white/70 border-0 rounded-2xl text-sm font-medium text-slate-700 p-5 outline-none focus:ring-4 focus:ring-emerald-500/5" placeholder="Summary of terms or project scope..." />
                </div>
                <div className="flex flex-col gap-6 pt-10 border-t border-slate-50 pb-12">
                  <div className="flex justify-between items-center px-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valuation</span>
                    <span className="text-4xl font-black text-slate-900">${calculateSubtotal(newInv.items || []).toLocaleString()}</span>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit" 
                    className="w-full py-6 bg-slate-900 text-white font-black uppercase tracking-[0.2em] rounded-[2rem] hover:bg-emerald-600 transition-all shadow-2xl"
                  >
                    Publish & Save
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InvoiceView;
