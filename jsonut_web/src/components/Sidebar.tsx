
import type { ActiveTab } from '../types/data_type';

interface SidebarProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
}

export default function Sidebar({
  activeTab,
  onChangeTab,
}: SidebarProps) {
  const tabs: ActiveTab[] = [
    'Dashboard',
    'Produk',
    'Stok',
    'Transaksi',
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>JSONut</h2>
        <i>Admin Panel</i>
      </div>

      <div className="sidebar-menu">
        {tabs.map((tab) => (
          <button
            type="button"
            key={tab}
            onClick={() => onChangeTab(tab)}
            className={`nav-button ${
              activeTab === tab ? 'active' : ''
            }`}
            aria-current={activeTab === tab ? 'page' : undefined}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
}
