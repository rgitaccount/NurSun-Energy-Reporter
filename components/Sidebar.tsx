import React from 'react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'performance', label: 'PV Performance', icon: 'solar_power' },
    { id: 'projections', label: 'Financial Projections', icon: 'trending_up' },
    { id: 'documents', label: 'Project Database', icon: 'folder' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ];

  return (
    <aside className="hidden md:flex w-64 flex-col bg-white dark:bg-slate-950 border-r border-slate-100 dark:border-slate-800 transition-all duration-300">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="material-icons-outlined text-white text-2xl">wb_sunny</span>
          </div>
          <div>
            <span className="block font-display font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">NurSun</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Energy</span>
          </div>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === item.id
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span className={`material-icons-outlined text-xl ${activeTab === item.id ? 'text-white' : 'text-slate-400'}`}>
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-6">
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Help Center</p>
          <p className="text-[11px] text-slate-500 leading-relaxed mb-3">Questions about the technical modeling assumptions?</p>
          <button className="w-full py-2 bg-white dark:bg-slate-800 text-[10px] font-bold uppercase tracking-widest text-primary border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
            Contact Support
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;