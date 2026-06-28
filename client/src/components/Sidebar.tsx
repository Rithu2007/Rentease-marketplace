import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home, LayoutDashboard, ShoppingBag, Receipt, RotateCcw, Heart,
  ShoppingCart, User, Settings, HelpCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(true);

  if (!user) return null; // Only show for logged in users

  // Items List
  const menuItems = [
    { label: 'Home', icon: Home, path: '/', tabKey: null },
    { label: 'Dashboard', icon: LayoutDashboard, path: '/profile?tab=dashboard', tabKey: 'dashboard' },
    { label: 'Browse Products', icon: ShoppingBag, path: '/products', tabKey: null },
    { label: 'My Orders', icon: Receipt, path: '/profile?tab=orders', tabKey: 'orders' },
    { label: 'Rentals Tracker', icon: RotateCcw, path: '/profile?tab=rentals', tabKey: 'rentals' },
    { label: 'Wishlist', icon: Heart, path: '/wishlist', tabKey: null },
    { label: 'Cart', icon: ShoppingCart, path: '/cart', tabKey: null },
    { label: 'Profile Settings', icon: User, path: '/profile?tab=profile', tabKey: 'profile' },
    { label: 'Security & Pw', icon: Settings, path: '/profile?tab=security', tabKey: 'security' },
    { label: 'Help & Support', icon: HelpCircle, path: '/profile?tab=help', tabKey: 'help' }
  ];

  // Check if item is active based on path and tab query parameter
  const isActive = (item: typeof menuItems[0]) => {
    const searchParams = new URLSearchParams(location.search);
    const currentTab = searchParams.get('tab') || 'dashboard';
    
    if (item.path.startsWith('/profile')) {
      return location.pathname === '/profile' && currentTab === item.tabKey;
    }
    return location.pathname === item.path;
  };

  const handleItemClick = (path: string) => {
    navigate(path);
  };

  return (
    <aside
      onMouseEnter={() => setIsCollapsed(false)}
      onMouseLeave={() => setIsCollapsed(true)}
      className={`glass-card border-y-0 border-l-0 border-r border-borderCard h-[calc(100vh-65px)] fixed left-0 top-[65px] flex flex-col justify-between transition-all duration-300 z-30 shadow-2xl group ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Top Menu List */}
      <div className="flex flex-col py-6 gap-1 overflow-y-auto flex-1 scrollbar-none">
        
        {/* Menu Items */}
        {menuItems.map((item, index) => {
          const active = isActive(item);
          const Icon = item.icon;

          return (
            <button
              key={index}
              onClick={() => handleItemClick(item.path)}
              className={`flex items-center gap-4 py-3.5 px-5 transition-all text-left relative focus:outline-none w-full group/item ${
                active
                  ? 'text-goldAccent bg-goldAccent/5 border-l-4 border-goldAccent font-semibold'
                  : 'text-gray-400 hover:text-white hover:bg-white/5 border-l-4 border-transparent'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && (
                <span className="text-xs tracking-wider uppercase font-medium">{item.label}</span>
              )}
              
              {/* Collapsed Tooltip */}
              {isCollapsed && (
                <div className="absolute left-full ml-4 bg-[#111118] border border-borderCard text-goldAccent text-[10px] font-bold py-1 px-3.5 rounded-md opacity-0 group-hover/item:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl z-50">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Profile Details */}
      <div className={`p-4 border-t border-borderCard/30 flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
        <img
          src={user.profile_picture || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.name}`}
          alt={user.name}
          className="w-8 h-8 rounded-full border border-borderGold object-cover flex-shrink-0"
        />
        {!isCollapsed && (
          <div className="min-w-0 flex-1">
            <h4 className="text-xs text-white font-bold truncate leading-tight">{user.name}</h4>
            <p className="text-[10px] text-gray-500 truncate mt-0.5">{user.email}</p>
          </div>
        )}
      </div>
    </aside>
  );
};

