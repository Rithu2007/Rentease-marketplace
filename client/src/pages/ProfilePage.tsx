import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User as UserIcon, MapPin, Receipt, RotateCcw, ShieldAlert, HelpCircle, Eye, Check, Edit, Trash2, X, Plus, Calendar, Bell } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Address, Order, ActiveRental } from '../types';

// Animated Counter for Dashboard Metrics
const AnimatedCounter: React.FC<{ value: number }> = ({ value }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (value === 0) {
      setCount(0);
      return;
    }
    let start = 0;
    const duration = 1200; // 1.2 seconds
    const end = value;
    const stepTime = Math.max(Math.floor(duration / end), 15);
    
    const timer = setInterval(() => {
      start += Math.ceil(end / (duration / stepTime));
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value]);

  return <>{count}</>;
};

// Monthly Color-Coded Rental Calendar Widget
const RentalCalendar: React.FC<{ rentals: ActiveRental[] }> = ({ rentals }) => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

  const monthName = today.toLocaleString('en-IN', { month: 'long' });

  // Generate calendar grid array
  const calendarDays: (Date | null)[] = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(new Date(currentYear, currentMonth, i));
  }

  // Filter rentals covering a specific day
  const getRentalsForDay = (date: Date | null) => {
    if (!date) return [];
    return rentals.filter(r => {
      const start = new Date(r.rental_start_date);
      const end = new Date(r.rental_end_date);
      
      const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const compareStart = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const compareEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate());
      return compareDate >= compareStart && compareDate <= compareEnd;
    });
  };

  return (
    <div className="glass-card rounded-2xl border border-borderCard p-5 flex flex-col gap-4 shadow-xl">
      <div className="flex justify-between items-center border-b border-borderCard/30 pb-3">
        <h4 className="text-xs font-bold text-goldAccent uppercase tracking-widest flex items-center gap-2">
          <Calendar className="w-4 h-4 text-tealAccent" /> Rental Schedule ({monthName} {currentYear})
        </h4>
        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Active</span>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-gray-500 font-bold uppercase tracking-wider border-b border-borderCard/10 pb-2">
        <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {calendarDays.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} className="aspect-square" />;
          
          const activeForDay = getRentalsForDay(day);
          const isToday = day.getDate() === today.getDate() && day.getMonth() === today.getMonth();

          let dayClass = "aspect-square rounded-lg flex items-center justify-center text-xs font-semibold font-mono transition-all ";
          if (activeForDay.length > 0) {
            dayClass += "bg-tealAccent/20 text-tealAccent border border-tealAccent/30 hover:bg-tealAccent/35 cursor-help shadow-[0_0_8px_rgba(0,212,170,0.15)]";
          } else if (isToday) {
            dayClass += "bg-goldAccent text-black font-bold border border-goldAccent shadow-[0_0_8px_rgba(212,168,83,0.3)]";
          } else {
            dayClass += "bg-white/2 text-gray-400 hover:bg-white/5 border border-transparent";
          }

          return (
            <div
              key={idx}
              className={dayClass}
              title={activeForDay.length > 0 ? `Active Rentals: ${activeForDay.map(r => r.name).join(', ')}` : undefined}
            >
              {day.getDate()}
            </div>
          );
        })}
      </div>

      <div className="text-[10px] text-gray-500 flex flex-col gap-1.5 mt-2 border-t border-borderCard/20 pt-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-tealAccent/20 border border-tealAccent/30" />
          <span>Active rental days in teal</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-goldAccent" />
          <span>Current day in gold</span>
        </div>
      </div>
    </div>
  );
};

export default function ProfilePage() {
  const { user, updateProfile, changePassword } = useAuth();
  const { themeMode, setThemeMode } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const currentTab = searchParams.get('tab') || 'dashboard';

  // State managers
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [profilePic, setProfilePic] = useState(user?.profile_picture || '');
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  // Address edit state
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressFormOpen, setAddressFormOpen] = useState(false);
  const [addrLabel, setAddrLabel] = useState('Home');
  const [addrName, setAddrName] = useState('');
  const [addrPhone, setAddrPhone] = useState('');
  const [addrFlat, setAddrFlat] = useState('');
  const [addrStreet, setAddrStreet] = useState('');
  const [addrArea, setAddrArea] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrState, setAddrState] = useState('');
  const [addrPincode, setAddrPincode] = useState('');
  const [addrLandmark, setAddrLandmark] = useState('');
  const [addrIsDefault, setAddrIsDefault] = useState(false);

  // Password change state
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmNewPw, setConfirmNewPw] = useState('');
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);

  // Modal detail display
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<any | null>(null);

  // Notification switches state
  const [notifOrder, setNotifOrder] = useState(true);
  const [notifPromo, setNotifPromo] = useState(false);
  const [notifSms, setNotifSms] = useState(true);

  // Sync profile details if auth user loads later
  useEffect(() => {
    if (user) {
      setProfileName(user.name);
      setProfilePhone(user.phone || '');
      setProfilePic(user.profile_picture || '');
    }
  }, [user]);

  // Fetch past orders
  const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ['orders', user?.id],
    queryFn: async () => {
      const response = await api.get('/orders');
      return response.data;
    },
    enabled: !!user && (currentTab === 'dashboard' || currentTab === 'orders')
  });

  // Fetch active rentals
  const { data: rentals = [], isLoading: rentalsLoading } = useQuery<ActiveRental[]>({
    queryKey: ['rentals', user?.id],
    queryFn: async () => {
      const response = await api.get('/orders/rentals');
      return response.data;
    },
    enabled: !!user && (currentTab === 'dashboard' || currentTab === 'rentals')
  });

  // Fetch Addresses
  const { data: addresses = [], isLoading: addressesLoading } = useQuery<Address[]>({
    queryKey: ['addresses', user?.id],
    queryFn: async () => {
      const response = await api.get('/users/addresses');
      return response.data;
    },
    enabled: !!user && currentTab === 'profile'
  });

  // Address Save/Edit Mutation
  const addressSaveMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (editingAddress) {
        return (await api.put(`/users/addresses/${editingAddress.id}`, payload)).data;
      } else {
        return (await api.post('/users/addresses', payload)).data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses', user?.id] });
      setAddressFormOpen(false);
      setEditingAddress(null);
      // reset
      setAddrName('');
      setAddrPhone('');
      setAddrFlat('');
      setAddrStreet('');
      setAddrArea('');
      setAddrCity('');
      setAddrState('');
      setAddrPincode('');
      setAddrLandmark('');
    }
  });

  // Address Delete Mutation
  const addressDeleteMutation = useMutation({
    mutationFn: async (addrId: number) => {
      await api.delete(`/users/addresses/${addrId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses', user?.id] });
    }
  });

  // Profile Edit Action
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);
    try {
      await updateProfile(profileName, profilePhone, profilePic || null);
      setProfileSuccess('Profile updated successfully!');
    } catch (err: any) {
      setProfileError(err.response?.data?.message || 'Failed to update profile.');
    }
  };

  // Password Update Action
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(null);

    if (newPw !== confirmNewPw) {
      setPwError('New passwords do not match.');
      return;
    }

    try {
      await changePassword(oldPw, newPw);
      setPwSuccess('Password updated successfully!');
      setOldPw('');
      setNewPw('');
      setConfirmNewPw('');
    } catch (err: any) {
      setPwError(err.response?.data?.message || 'Failed to change password.');
    }
  };

  // Address trigger edit prefill
  const handleTriggerEditAddress = (addr: Address) => {
    setEditingAddress(addr);
    setAddrLabel(addr.label);
    setAddrName(addr.full_name);
    setAddrPhone(addr.phone);
    setAddrFlat(addr.flat);
    setAddrStreet(addr.street);
    setAddrArea(addr.area);
    setAddrCity(addr.city);
    setAddrState(addr.state);
    setAddrPincode(addr.pincode);
    setAddrLandmark(addr.landmark || '');
    setAddrIsDefault(addr.is_default);
    setAddressFormOpen(true);
  };

  const handleTriggerAddAddress = () => {
    setEditingAddress(null);
    setAddrLabel('Home');
    setAddrName('');
    setAddrPhone('');
    setAddrFlat('');
    setAddrStreet('');
    setAddrArea('');
    setAddrCity('');
    setAddrState('');
    setAddrPincode('');
    setAddrLandmark('');
    setAddrIsDefault(false);
    setAddressFormOpen(true);
  };

  const handleSaveAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addressSaveMutation.mutate({
      label: addrLabel,
      fullName: addrName,
      phone: addrPhone,
      flat: addrFlat,
      street: addrStreet,
      area: addrArea,
      city: addrCity,
      state: addrState,
      pincode: addrPincode,
      landmark: addrLandmark,
      isDefault: addrIsDefault
    });
  };

  // Fetch full details of order for details modal
  const handleViewOrderDetail = async (orderId: number) => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      setSelectedOrderDetail(response.data);
    } catch (e) {
      console.error(e);
    }
  };

  // Load recently viewed from localStorage (Last 10 viewed items)
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);
  useEffect(() => {
    const saved = localStorage.getItem('rentease_recent_viewed');
    if (saved) {
      try {
        setRecentlyViewed(JSON.parse(saved));
      } catch (e) {
        setRecentlyViewed([]);
      }
    }
  }, []);

  const formatCurrency = (val: string | number) => `₹${parseFloat(val as string).toLocaleString('en-IN')}`;

  return (
    <div className="flex flex-col gap-6">
      
      {/* TABS CONTAINER */}
      {currentTab === 'dashboard' && (
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-serif text-white font-semibold uppercase tracking-wide">User Dashboard</h1>
            <p className="text-xs text-gray-400">
              {(() => {
                const hour = new Date().getHours();
                if (hour < 12) return 'Good morning';
                if (hour < 17) return 'Good afternoon';
                return 'Good evening';
              })()}, {user?.name}. Check your active rentals and order histories below.
            </p>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="glass-card rounded-2xl p-5 border border-borderCard flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block">Active Rentals</span>
                <span className="text-3xl font-serif font-extrabold text-white mt-1 block">
                  <AnimatedCounter value={rentals.length} />
                </span>
              </div>
              <RotateCcw className="w-8 h-8 text-tealAccent/30" />
            </div>

            <div className="glass-card rounded-2xl p-5 border border-borderCard flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block">Orders Placed</span>
                <span className="text-3xl font-serif font-extrabold text-white mt-1 block">
                  <AnimatedCounter value={orders.length} />
                </span>
              </div>
              <Receipt className="w-8 h-8 text-goldAccent/30" />
            </div>

            <div className="glass-card rounded-2xl p-5 border border-borderCard flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block">Account Status</span>
                <span className="text-xs font-bold text-tealAccent uppercase mt-3 tracking-widest bg-tealAccent/10 border border-tealAccent/20 px-3 py-1 rounded-full block w-fit">Verified</span>
              </div>
              <UserIcon className="w-8 h-8 text-gray-700" />
            </div>
          </div>

          {/* Main Dashboard Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 flex flex-col gap-6">
              {/* Last Order Summary Preview */}
              <div className="glass-card rounded-2xl border border-borderCard p-6">
                <h3 className="text-xs font-bold text-goldAccent uppercase tracking-widest border-b border-borderCard/30 pb-3 mb-4 flex justify-between items-center">
                  <span>Recent Order History</span>
                  <button onClick={() => setSearchParams({ tab: 'orders' })} className="text-[9px] hover:underline uppercase tracking-wider">See All</button>
                </h3>
                {ordersLoading ? (
                  <div className="text-xs text-goldAccent text-center py-4">Loading orders...</div>
                ) : orders.length === 0 ? (
                  <div className="text-xs text-gray-500 text-center py-4">No recent orders.</div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {orders.slice(0, 3).map(order => (
                      <div key={order.id} className="flex justify-between items-center text-xs p-3 bg-black/20 rounded-xl border border-borderCard/50">
                        <div>
                          <p className="text-white font-bold">RE-{order.id}</p>
                          <span className="text-[10px] text-gray-500">{new Date(order.created_at).toLocaleDateString('en-IN')} &nbsp;|&nbsp; {order.items_count} items</span>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-bold">{formatCurrency(order.total)}</p>
                          <span className="text-[9px] uppercase font-bold text-tealAccent">{order.order_status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-5">
              {/* Rental Calendar Widget */}
              <RentalCalendar rentals={rentals} />
            </div>
          </div>

          {/* Recently Viewed Products */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Recently Viewed</h3>
            {recentlyViewed.length === 0 ? (
              <div className="glass-card border border-borderCard rounded-2xl p-6 text-center text-xs text-gray-500">
                You have not viewed any products recently.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {recentlyViewed.map((prod) => (
                  <div
                    key={prod.id}
                    onClick={() => navigate(`/products/${prod.id}`)}
                    className="glass-card rounded-xl p-3 border border-borderCard hover:border-goldAccent/15 cursor-pointer transition-all flex flex-col gap-2"
                  >
                    <img src={prod.thumbnail} alt={prod.name} className="w-full aspect-square object-cover rounded-lg border border-borderCard" />
                    <h4 className="text-[11px] font-bold text-white truncate leading-tight">{prod.name}</h4>
                    <span className="text-[10px] text-goldAccent font-mono leading-none">{formatCurrency(prod.price)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* TABS: Orders List */}
      {currentTab === 'orders' && (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-serif text-white font-semibold uppercase tracking-wide">My Orders</h2>
            <p className="text-xs text-gray-400">View and track all past purchases and rental placements.</p>
          </div>

          {ordersLoading ? (
            <div className="text-center py-20 text-sm text-goldAccent animate-pulse uppercase tracking-wider">Loading order details...</div>
          ) : orders.length === 0 ? (
            <div className="glass-card border border-borderCard rounded-2xl p-12 text-center text-xs text-gray-500">
              No orders found. Explore our catalog to buy or rent premium furniture.
            </div>
          ) : (
            <div className="glass-card border border-borderCard rounded-2xl overflow-hidden shadow-xl">
              <table className="min-w-full text-xs text-left text-gray-300">
                <thead className="bg-[#181824] text-goldAccent uppercase font-bold tracking-wider border-b border-borderCard/30 text-[10px]">
                  <tr>
                    <th className="p-4">Order ID</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Items</th>
                    <th className="p-4">Total</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-borderCard/10 hover:bg-white/2 transition-all">
                      <td className="p-4 font-mono font-bold text-white">RE-{order.id}</td>
                      <td className="p-4">{new Date(order.created_at).toLocaleDateString('en-IN')}</td>
                      <td className="p-4">{order.items_count} items</td>
                      <td className="p-4 font-bold text-white">{formatCurrency(order.total)}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          order.order_status === 'delivered' ? 'bg-tealAccent/15 text-tealAccent' : 'bg-goldAccent/10 text-goldAccent'
                        }`}>
                          {order.order_status}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleViewOrderDetail(order.id)}
                          className="px-3 py-1 bg-white/5 border border-borderCard hover:border-goldAccent text-[10px] uppercase font-bold tracking-widest text-goldAccent hover:text-white rounded-lg transition-all"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TABS: Rentals tracker */}
      {currentTab === 'rentals' && (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-serif text-white font-semibold uppercase tracking-wide">Active Rentals</h2>
            <p className="text-xs text-gray-400">Track countdown timers, delivery schedules, and returning dates.</p>
          </div>

          {rentalsLoading ? (
            <div className="text-center py-20 text-sm text-goldAccent animate-pulse uppercase tracking-wider">Loading rentals data...</div>
          ) : rentals.length === 0 ? (
            <div className="glass-card border border-borderCard rounded-2xl p-12 text-center text-xs text-gray-500">
              No active subscription rentals. Start renting items to track them here!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {rentals.map((rental) => {
                const percentLeft = Math.max(0, Math.min(100, (rental.days_remaining / (3 * 30)) * 100)); // assumes 3 months average base
                
                return (
                  <div key={rental.id} className="glass-card rounded-2xl border border-borderCard p-5 flex gap-4">
                    <img src={rental.thumbnail} alt={rental.name} className="w-20 h-20 object-cover rounded-xl border border-borderCard flex-shrink-0" />
                    <div className="flex-1 min-w-0 flex flex-col gap-2">
                      <div>
                        <span className="text-[9px] text-gray-500 font-bold uppercase block tracking-wider">{rental.brand}</span>
                        <h3 className="text-xs font-bold text-white truncate leading-tight mt-0.5">{rental.name}</h3>
                      </div>
                      
                      {/* Dates */}
                      <div className="text-[10px] text-gray-400 flex flex-col gap-0.5">
                        <p>Start: {new Date(rental.rental_start_date).toLocaleDateString('en-IN')}</p>
                        <p>Return: {new Date(rental.rental_end_date).toLocaleDateString('en-IN')}</p>
                      </div>

                      {/* Progress countdown */}
                      <div className="flex flex-col gap-1 mt-1">
                        <div className="flex justify-between items-center text-[9px] font-bold text-tealAccent uppercase">
                          <span>Tenure: {rental.rental_duration.replace('_', ' ')}</span>
                          <span>{rental.days_remaining} Days Left</span>
                        </div>
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden border border-borderCard/30">
                          <div className="h-full bg-tealAccent rounded-full" style={{ width: `${percentLeft}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TABS: Profile settings & Address Managers */}
      {currentTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Profile form */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            <h3 className="text-lg font-serif font-bold text-white uppercase tracking-wide">Edit Profile</h3>
            
            <form onSubmit={handleProfileUpdate} className="glass-card rounded-2xl p-6 border border-borderCard flex flex-col gap-4">
              {profileError && <div className="bg-[#ff5b5b]/10 border border-[#ff5b5b]/30 text-[#ff5b5b] p-3 rounded-xl text-xs text-center">{profileError}</div>}
              {profileSuccess && <div className="bg-tealAccent/10 border border-tealAccent/30 text-tealAccent p-3 rounded-xl text-xs text-center">{profileSuccess}</div>}

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Email Address (Read-only)</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="bg-black/25 border border-borderCard rounded-xl px-4 py-2.5 text-xs text-gray-500 outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="bg-black/40 border border-borderCard rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-goldAccent"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Phone Number</label>
                <input
                  type="tel"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  className="bg-black/40 border border-borderCard rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-goldAccent"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Avatar Image Link</label>
                <input
                  type="text"
                  value={profilePic}
                  onChange={(e) => setProfilePic(e.target.value)}
                  className="bg-black/40 border border-borderCard rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-goldAccent"
                />
              </div>

              <div className="flex flex-col gap-1.5 pt-2 border-t border-borderCard/30 mt-2">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Preferences</span>
                <div className="flex justify-between items-center bg-black/20 border border-borderCard rounded-xl px-4 py-2.5 text-xs text-white">
                  <span className="text-gray-300 font-medium">Light / Dark Theme Mode</span>
                  <button
                    type="button"
                    onClick={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark')}
                    className="flex items-center gap-1.5 bg-white/5 border border-borderCard hover:border-goldAccent text-[9px] uppercase font-bold text-goldAccent px-3 py-1.5 rounded-lg transition-all"
                  >
                    {themeMode === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-goldAccent hover:bg-goldAccent/95 text-black font-extrabold text-xs uppercase tracking-widest transition-all rounded-xl mt-2 shadow-md"
              >
                Save Profile Updates
              </button>
            </form>
          </div>

          {/* Address manager list */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-serif font-bold text-white uppercase tracking-wide">Address Book</h3>
              <button
                onClick={handleTriggerAddAddress}
                className="flex items-center gap-1 bg-white/5 border border-borderCard hover:border-goldAccent text-[9px] uppercase font-bold text-goldAccent hover:text-white px-3 py-1.5 rounded-lg"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>

            {/* Address CRUD list */}
            {addressesLoading ? (
              <div className="text-xs text-goldAccent text-center py-4 animate-pulse">Loading addresses...</div>
            ) : addresses.length === 0 ? (
              <div className="glass-card border border-borderCard rounded-2xl p-6 text-center text-xs text-gray-500">
                No addresses saved.
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {addresses.map(addr => (
                  <div key={addr.id} className="glass-card p-4 rounded-2xl border border-borderCard/60 flex justify-between items-center gap-4">
                    <div>
                      <span className="text-[9px] font-bold text-goldAccent uppercase tracking-widest bg-goldAccent/10 px-2 py-0.5 rounded border border-borderGold">
                        {addr.label}
                      </span>
                      <h4 className="text-xs font-bold text-white mt-2">{addr.full_name} &nbsp;|&nbsp; <span className="font-mono text-gray-400">{addr.phone}</span></h4>
                      <p className="text-[10px] text-gray-400 mt-1 leading-normal">
                        {addr.flat}, {addr.street}, {addr.area}, {addr.city}, {addr.state} - {addr.pincode}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleTriggerEditAddress(addr)} className="p-1.5 hover:bg-white/5 rounded-lg border border-borderCard text-gray-400 hover:text-white">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => addressDeleteMutation.mutate(addr.id)} className="p-1.5 hover:bg-[#ff5b5b]/5 rounded-lg border border-borderCard text-gray-400 hover:text-[#ff5b5b]">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* TABS: Security Settings (Change Password) */}
      {currentTab === 'security' && (
        <div className="max-w-md mx-auto w-full flex flex-col gap-6">
          <h2 className="text-2xl font-serif text-white font-semibold uppercase tracking-wide text-center">Password & Security</h2>
          
          <form onSubmit={handlePasswordChange} className="glass-card rounded-2xl p-6 border border-borderCard flex flex-col gap-4 shadow-xl">
            {pwError && <div className="bg-[#ff5b5b]/10 border border-[#ff5b5b]/30 text-[#ff5b5b] p-3 rounded-xl text-xs text-center">{pwError}</div>}
            {pwSuccess && <div className="bg-tealAccent/10 border border-tealAccent/30 text-tealAccent p-3 rounded-xl text-xs text-center">{pwSuccess}</div>}

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Old Password</label>
              <input
                type="password"
                required
                value={oldPw}
                onChange={(e) => setOldPw(e.target.value)}
                placeholder="••••••••"
                className="bg-black/40 border border-borderCard rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-goldAccent"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">New Password</label>
              <input
                type="password"
                required
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="••••••••"
                className="bg-black/40 border border-borderCard rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-goldAccent"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmNewPw}
                onChange={(e) => setConfirmNewPw(e.target.value)}
                placeholder="••••••••"
                className="bg-black/40 border border-borderCard rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-goldAccent"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-goldAccent hover:bg-goldAccent/95 text-black font-extrabold text-xs uppercase tracking-widest transition-all rounded-xl mt-2 shadow-md"
            >
              Update Password
            </button>
          </form>
        </div>
      )}

      {/* TABS: Help & support FAQs */}
      {currentTab === 'help' && (
        <div className="max-w-2xl mx-auto w-full flex flex-col gap-6">
          <div className="text-center">
            <HelpCircle className="w-12 h-12 text-goldAccent/30 mx-auto mb-3" />
            <h2 className="text-2xl font-serif text-white font-semibold uppercase tracking-wide">Help & FAQs</h2>
            <p className="text-xs text-gray-500 mt-2">Have queries regarding rental policies or deliveries? Browse details below.</p>
          </div>

          <div className="flex flex-col gap-4 mt-4">
            {[
              { q: 'How long does delivery take?', a: 'All RentEase furniture and appliances are delivered and assembled for free within 72 hours (3 business days) across our major serviceable regions.' },
              { q: 'Is there a security deposit?', a: 'Yes. For rentals, we collect a refundable security deposit equivalent to 1 month of subscription rent. This is refunded immediately upon tenure completion.' },
              { q: 'What happens if I damage a rental item?', a: 'Minor scratches and normal wear under 2cm are covered for free. For deep burns, structural cracks, or liquid spills, repair costs will be evaluated and deducted from the deposit.' },
              { q: 'Can I cancel my rental contract early?', a: 'Yes, you can schedule an early pick-up. Your subscription charges will be calculated retrospectively based on actual months kept, and the deposit will be adjusted.' }
            ].map((faq, idx) => (
              <div key={idx} className="glass-card rounded-2xl p-5 border border-borderCard flex flex-col gap-2">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">{faq.q}</h4>
                <p className="text-xs text-gray-400 leading-relaxed font-light mt-1">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- ORDER DETAIL MODAL OVERLAY --- */}
      {selectedOrderDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="glass-card rounded-3xl p-6 border border-borderCard max-w-xl w-full mx-4 shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setSelectedOrderDetail(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-serif text-lg text-white mb-1 font-bold uppercase tracking-wide">Order details</h3>
            <p className="text-[10px] text-gray-500">Order ID: <span className="font-mono text-white font-bold">RE-{selectedOrderDetail.order.id}</span></p>

            <div className="flex flex-col gap-5 mt-6 border-t border-borderCard/30 pt-4">
              
              {/* Shipping Address */}
              <div>
                <h4 className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1.5">Shipping Address</h4>
                <p className="text-xs text-gray-300 leading-relaxed">
                  <strong>{selectedOrderDetail.order.shipping_name}</strong> &nbsp;|&nbsp; {selectedOrderDetail.order.shipping_phone}<br/>
                  {selectedOrderDetail.order.flat}, {selectedOrderDetail.order.street}, {selectedOrderDetail.order.area}, {selectedOrderDetail.order.city}, {selectedOrderDetail.order.state} - {selectedOrderDetail.order.pincode}
                </p>
              </div>

              {/* Items List */}
              <div>
                <h4 className="text-[10px] text-gray-500 font-bold uppercase tracking-widest border-b border-borderCard/20 pb-2 mb-3">Line Items</h4>
                <div className="flex flex-col gap-3">
                  {selectedOrderDetail.items.map((line: any) => (
                    <div key={line.id} className="flex justify-between items-center gap-3 text-xs text-gray-300">
                      <div className="min-w-0 flex-grow">
                        <strong className="text-white">{line.name}</strong>
                        <span className="text-[10px] text-gray-500 block mt-0.5">
                          Colour: {line.colour_name} &nbsp;|&nbsp; Qty: {line.quantity} &nbsp;|&nbsp; {line.rental_duration ? `Rental (${line.rental_duration.replace('_', ' ')})` : 'Purchase'}
                        </span>
                      </div>
                      <span className="font-bold text-white font-mono">{formatCurrency(parseFloat(line.unit_price) * line.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Billing Summary */}
              <div className="border-t border-borderCard/30 pt-4 flex flex-col gap-2 text-xs text-gray-400">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="text-white font-bold">{formatCurrency(selectedOrderDetail.order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (18%):</span>
                  <span className="text-white font-bold">{formatCurrency(selectedOrderDetail.order.gst)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Charges:</span>
                  <span className="text-white font-bold">{formatCurrency(selectedOrderDetail.order.delivery_charge)}</span>
                </div>
                {/* Calculate deposit */}
                {parseFloat(selectedOrderDetail.order.total) > parseFloat(selectedOrderDetail.order.subtotal) + parseFloat(selectedOrderDetail.order.gst) + parseFloat(selectedOrderDetail.order.delivery_charge) && (
                  <div className="flex justify-between">
                    <span>Security Deposit:</span>
                    <span className="text-white font-bold">{formatCurrency(parseFloat(selectedOrderDetail.order.total) - (parseFloat(selectedOrderDetail.order.subtotal) + parseFloat(selectedOrderDetail.order.gst) + parseFloat(selectedOrderDetail.order.delivery_charge)))}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm font-bold text-goldAccent pt-2 border-t border-borderCard/20">
                  <span>Grand Total:</span>
                  <span>{formatCurrency(selectedOrderDetail.order.total)}</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* --- ADDRESS SAVE / EDIT DIALOG OVERLAY --- */}
      {addressFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="glass-card rounded-3xl p-8 border border-borderCard max-w-md w-full mx-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setAddressFormOpen(false);
                setEditingAddress(null);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-serif text-lg text-white mb-6 font-bold uppercase tracking-wide border-b border-borderCard/20 pb-3">
              {editingAddress ? 'Edit Address' : 'New Shipping Address'}
            </h3>

            <form onSubmit={handleSaveAddressSubmit} className="flex flex-col gap-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Address Label (e.g. Home, Office)</label>
                <input
                  type="text"
                  required
                  value={addrLabel}
                  onChange={(e) => setAddrLabel(e.target.value)}
                  placeholder="Home"
                  className="bg-black/40 border border-borderCard rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-goldAccent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Receiver Name</label>
                  <input
                    type="text"
                    required
                    value={addrName}
                    onChange={(e) => setAddrName(e.target.value)}
                    placeholder="John Doe"
                    className="bg-black/40 border border-borderCard rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-goldAccent"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Contact Phone</label>
                  <input
                    type="tel"
                    required
                    value={addrPhone}
                    onChange={(e) => setAddrPhone(e.target.value)}
                    placeholder="9876543210"
                    className="bg-black/40 border border-borderCard rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-goldAccent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Flat / Block No</label>
                  <input
                    type="text"
                    required
                    value={addrFlat}
                    onChange={(e) => setAddrFlat(e.target.value)}
                    placeholder="Flat 302, Block B"
                    className="bg-black/40 border border-borderCard rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-goldAccent"
                  />
                </div>
                <div className="flex flex-col gap-1.5 col-span-2">
                  <label className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Street / Road Name</label>
                  <input
                    type="text"
                    required
                    value={addrStreet}
                    onChange={(e) => setAddrStreet(e.target.value)}
                    placeholder="12th Main Road"
                    className="bg-black/40 border border-borderCard rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-goldAccent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Locality / Area</label>
                  <input
                    type="text"
                    required
                    value={addrArea}
                    onChange={(e) => setAddrArea(e.target.value)}
                    placeholder="Indiranagar"
                    className="bg-black/40 border border-borderCard rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-goldAccent"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">City</label>
                  <input
                    type="text"
                    required
                    value={addrCity}
                    onChange={(e) => setAddrCity(e.target.value)}
                    placeholder="Bangalore"
                    className="bg-black/40 border border-borderCard rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-goldAccent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">State</label>
                  <input
                    type="text"
                    required
                    value={addrState}
                    onChange={(e) => setAddrState(e.target.value)}
                    placeholder="Karnataka"
                    className="bg-black/40 border border-borderCard rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-goldAccent"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Pincode</label>
                  <input
                    type="text"
                    required
                    value={addrPincode}
                    onChange={(e) => setAddrPincode(e.target.value)}
                    placeholder="560038"
                    className="bg-black/40 border border-borderCard rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-goldAccent"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Landmark (Optional)</label>
                <input
                  type="text"
                  value={addrLandmark}
                  onChange={(e) => setAddrLandmark(e.target.value)}
                  placeholder="Opposite Metro Station"
                  className="bg-black/40 border border-borderCard rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-goldAccent"
                />
              </div>

              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  checked={addrIsDefault}
                  onChange={() => setAddrIsDefault(!addrIsDefault)}
                  className="rounded border-borderCard text-goldAccent focus:ring-0 bg-black/40 w-4 h-4"
                />
                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Set as Default Address</span>
              </div>

              <button
                type="submit"
                disabled={addressSaveMutation.isPending}
                className="w-full py-3 bg-goldAccent hover:bg-goldAccent/95 text-black font-extrabold text-xs uppercase tracking-widest transition-all rounded-xl mt-4 shadow-lg disabled:opacity-50"
              >
                {addressSaveMutation.isPending ? 'Saving...' : 'Save Address Details'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
