
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, FileText, Users, Settings, Bell, Sparkles, LogOut, User as UserIcon, X, PlusSquare } from 'lucide-react';
import { ViewType, Invoice, Client, InvoiceStatus, BusinessProfile, UserState } from './types';
import Dashboard from './components/Dashboard';
import InvoiceView from './components/InvoiceView';
import ClientView from './components/ClientView';
import ProfileView from './components/ProfileView';
import DataEntryView from './components/DataEntryView';
import LandingPage from './components/LandingPage';
import AuthView from './components/AuthView';
import { BusinessAIService } from './geminiService';

const aiService = new BusinessAIService();

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>('landing');
  const [user, setUser] = useState<UserState>({
    isLoggedIn: false,
    isPro: true, 
    profile: {
      name: 'Studio Minimal',
      email: 'hello@studiominimal.io',
      address: '42 Zen Path, Kyoto Garden\nSan Francisco, CA 94107',
      currency: 'USD',
    }
  });

  const [invoices, setInvoices] = useState<Invoice[]>([
    {
      id: '1', invoiceNumber: 'INV-1024', clientId: 'c1', status: InvoiceStatus.PAID,
      dueDate: '2024-05-15', createdAt: Date.now(), tax: 0,
      items: [{ id: 'i1', description: 'Brand Strategy & Identity', quantity: 1, rate: 3200 }]
    },
    {
      id: '2', invoiceNumber: 'INV-1025', clientId: 'c2', status: InvoiceStatus.PENDING,
      dueDate: '2024-06-01', createdAt: Date.now(), tax: 0,
      items: [{ id: 'i2', description: 'Product Design (Retainer)', quantity: 20, rate: 120 }]
    }
  ]);

  const [clients, setClients] = useState<Client[]>([
    { id: 'c1', name: 'Alice Smith', email: 'alice@creative.co', company: 'Creative Co', createdAt: Date.now(), notes: 'Prefers Net-15 payments. Always cc their legal team.' },
    { id: 'c2', name: 'Bob Johnson', email: 'bob@techflow.io', company: 'TechFlow Systems', createdAt: Date.now() },
  ]);

  const [aiInsight, setAiInsight] = useState<string>('');
  const [showAiInsight, setShowAiInsight] = useState(false);
  const [aiStatus, setAiStatus] = useState<'idle' | 'analyzing' | 'drafting'>('idle');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeView]);

  const handleStart = () => {
    setActiveView('auth');
  };

  const handleAuthSuccess = (name?: string, email?: string) => {
    setUser(prev => ({ 
      ...prev, 
      isLoggedIn: true,
      profile: {
        ...prev.profile,
        name: name || prev.profile.name,
        email: email || prev.profile.email,
      }
    }));
    setActiveView('dashboard');
  };

  const generateInsights = async () => {
    setShowAiInsight(true);
    setAiStatus('analyzing');
    const processingPromise = aiService.getBusinessInsights(invoices, clients);
    setTimeout(() => {
      if (aiStatus === 'analyzing') setAiStatus('drafting');
    }, 600);
    const result = await processingPromise;
    setAiInsight(result);
    setAiStatus('idle');
  };

  const handleUpdateInvoiceStatus = (id: string, status: InvoiceStatus) => {
    setInvoices(invoices.map(inv => inv.id === id ? { ...inv, status } : inv));
  };

  const renderView = () => {
    if (!user.isLoggedIn) {
      if (activeView === 'landing') return <LandingPage onGetStarted={handleStart} />;
      if (activeView === 'auth') return <AuthView onAuthSuccess={handleAuthSuccess} />;
      return <LandingPage onGetStarted={handleStart} />;
    }

    switch (activeView) {
      case 'dashboard':
        return <Dashboard invoices={invoices} clients={clients} />;
      case 'invoices':
        return (
          <InvoiceView 
            invoices={invoices} 
            clients={clients} 
            isPro={user.isPro}
            onAddInvoice={(inv) => setInvoices([inv, ...invoices])}
            onDeleteInvoice={(id) => setInvoices(invoices.filter(i => i.id !== id))}
            onUpdateStatus={handleUpdateInvoiceStatus}
            onUpgradePrompt={() => {}} 
          />
        );
      case 'clients':
        return (
          <ClientView 
            clients={clients} 
            invoices={invoices}
            onAddClient={(c) => setClients([c, ...clients])}
            onDeleteClient={(id) => setClients(clients.filter(c => c.id !== id))}
          />
        );
      case 'data-entry':
        return (
          <DataEntryView 
            clients={clients}
            onAddClient={(c) => setClients([c, ...clients])}
            onAddInvoice={(inv) => setInvoices([inv, ...invoices])}
            isPro={user.isPro}
            invoiceCount={invoices.length}
            onUpgradePrompt={() => {}} 
          />
        );
      case 'profile':
        return <ProfileView profile={user.profile} onUpdate={(profile) => setUser({...user, profile})} />;
      default:
        return <Dashboard invoices={invoices} clients={clients} />;
    }
  };

  const showSidebar = user.isLoggedIn && activeView !== 'landing' && activeView !== 'auth';

  return (
    <div className="min-h-screen selection:bg-emerald-100 selection:text-emerald-900">
      {/* Sidebar Navigation */}
      {showSidebar && (
        <nav className="fixed left-0 top-0 bottom-0 w-24 bg-white/80 border-r border-emerald-50 hidden lg:flex flex-col items-center py-6 z-[100] no-print">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            onClick={() => setActiveView('dashboard')}
            className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center mb-10 shadow-xl shadow-emerald-500/20 cursor-pointer hover:scale-105 active:scale-95 transition-all flex-shrink-0"
          >
            <span className="text-white font-extrabold text-2xl tracking-tighter italic">B</span>
          </motion.div>
          
          <div className="flex-grow flex flex-col gap-6 w-full items-center px-2 py-4">
            {[
              { id: 'dashboard', icon: Home, label: 'Home' },
              { id: 'data-entry', icon: PlusSquare, label: 'Quick Entry' },
              { id: 'invoices', icon: FileText, label: 'Invoices' },
              { id: 'clients', icon: Users, label: 'Clients' },
              { id: 'profile', icon: UserIcon, label: 'Settings' },
            ].map((item, idx) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05, type: "spring", stiffness: 300, damping: 30 }}
                onClick={() => setActiveView(item.id as ViewType)}
                className={`p-4 rounded-2xl transition-all group relative flex items-center justify-center flex-shrink-0 ${
                  activeView === item.id 
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' 
                  : 'text-slate-400 hover:text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                <item.icon size={22} strokeWidth={activeView === item.id ? 2.5 : 2} />
                <div className="absolute left-full ml-4 px-3 py-1.5 bg-white text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300 pointer-events-none whitespace-nowrap z-[110] shadow-xl shadow-emerald-900/5 flex items-center border border-emerald-100">
                   <div className="absolute right-full w-0 h-0 border-y-[6px] border-y-transparent border-r-[6px] border-r-white"></div>
                  {item.label}
                </div>
              </motion.button>
            ))}
          </div>

          <button 
            onClick={() => { setUser(p => ({...p, isLoggedIn: false})); setActiveView('landing'); }} 
            className="mt-auto p-4 text-slate-300 hover:text-red-500 transition-colors flex-shrink-0 group relative flex items-center justify-center"
          >
            <LogOut size={22} />
            <div className="absolute left-full ml-4 px-3 py-1.5 bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300 pointer-events-none whitespace-nowrap z-[110] shadow-xl shadow-rose-900/10 flex items-center border border-rose-500/20">
               <div className="absolute right-full w-0 h-0 border-y-[6px] border-y-transparent border-r-[6px] border-r-rose-600"></div>
               Sign Out
            </div>
          </button>
        </nav>
      )}

      {/* Main Content */}
      <main className={showSidebar ? "lg:pl-24" : ""}>
        <div className={showSidebar ? "max-w-5xl mx-auto px-8 py-16" : ""}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* AI Intelligence Bubble */}
      {showSidebar && (
        <div className="fixed bottom-12 right-12 z-[90] no-print flex flex-col items-end">
          <AnimatePresence>
            {showAiInsight && (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.8, y: 40, x: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 20, x: 10 }}
                transition={{ type: "spring", damping: 30, stiffness: 400, layout: { duration: 0.2 } }}
                style={{ originX: 1, originY: 1 }}
                className="mb-5 p-6 bg-white border border-emerald-100 rounded-[2.25rem] shadow-[0_32px_64px_-16px_rgba(16,185,129,0.15)] max-w-[300px] relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="flex items-center gap-2 font-black text-emerald-600 text-[9px] tracking-[0.2em] uppercase">
                    <Sparkles size={12} className={aiStatus !== 'idle' ? 'animate-spin' : ''} /> 
                    {aiStatus === 'analyzing' ? 'Analyzing' : aiStatus === 'drafting' ? 'Strategizing' : 'Insight'}
                  </h4>
                  <button onClick={() => setShowAiInsight(false)} className="text-slate-300 hover:text-slate-500 transition-all">
                    <X size={14} />
                  </button>
                </div>
                <motion.div layout className="relative z-10">
                  {aiStatus !== 'idle' ? (
                    <div className="flex flex-col gap-2">
                      <div className="h-3 w-3/4 bg-emerald-50 rounded-full animate-pulse" />
                      <div className="h-3 w-1/2 bg-emerald-50 rounded-full animate-pulse" />
                    </div>
                  ) : (
                    <motion.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] text-slate-700 leading-snug font-medium">
                      {aiInsight}
                    </motion.p>
                  )}
                </motion.div>
                <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-emerald-50 rounded-full blur-3xl opacity-30" />
              </motion.div>
            )}
          </AnimatePresence>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={generateInsights}
            className="w-14 h-14 rounded-[1.5rem] bg-emerald-600 text-white shadow-2xl shadow-emerald-500/40 flex items-center justify-center transition-all duration-300 group relative z-10"
          >
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-[1.5rem]" />
            <Sparkles size={24} className="group-hover:rotate-12 transition-transform" />
          </motion.button>
        </div>
      )}
    </div>
  );
};

export default App;
