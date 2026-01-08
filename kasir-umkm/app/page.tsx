"use client";

import React, { useState, useEffect } from 'react';
import {
  ShoppingCart, Plus, Minus, Trash2, Printer, Search, X,
  ChevronUp, Banknote, User, ChefHat, LogOut, TrendingUp, Calendar, Lock, BarChart3, Store, Undo2, AlertCircle, Image as ImageIcon, Upload, ArrowRight, History
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// --- TIPE DATA ---
type Product = {
  id: number;
  name: string;
  price: number;
  category: string;
  image: string;
};

type CartItem = Product & {
  qty: number;
};

type OrderStatus = 'pending' | 'cooking' | 'ready' | 'completed';

type Transaction = {
  id: string;
  date: string;
  time: string;
  timestamp: number;
  customerName: string;
  items: CartItem[];
  total: number;
  method: 'cash' | 'qris';
  status: OrderStatus;
};

type PaymentMethod = 'cash' | 'qris';
type ViewMode = 'pos' | 'kitchen' | 'dashboard';
type KitchenTab = 'active' | 'completed';

// --- DATA DUMMY ---
const products: Product[] = [
  {
    id: 1,
    name: "Tahu Sumedang (10 pcs)",
    price: 10000,
    category: "Makanan",
    image: "/Tahu-Sumedang.jpg"
  },
  {
    id: 2,
    name: "Tahu Sumedang (Satuan)",
    price: 1000,
    category: "Makanan",
    image: "/Tahu-Sumedang.jpg"
  },
  {
    id: 3,
    name: "Kopi Geulis Manual Brew",
    price: 15000,
    category: "Minuman",
    image: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=500"
  },
  {
    id: 4,
    name: "Seblak Komplit Ceker",
    price: 12000,
    category: "Makanan",
    image: "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?auto=format&fit=crop&q=80&w=500"
  },
  {
    id: 5,
    name: "Ubi Cilembu Oven (1kg)",
    price: 25000,
    category: "Cemilan",
    image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=500"
  },
  {
    id: 6,
    name: "Es Teh Manis Jumbo",
    price: 5000,
    category: "Minuman",
    image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&q=80&w=500"
  },
  {
    id: 7,
    name: "Opak Ketan",
    price: 18000,
    category: "Cemilan",
    image: "/opak.jpg"
  },
  {
    id: 8,
    name: "Nasi Timbel Komplit",
    price: 35000,
    category: "Makanan",
    image: "/nasi-timbel-komplit.jpg"
  },
  {
    id: 9,
    name: "Paket Hemat Kenyang",
    price: 40000,
    category: "Paket",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=500"
  },
  {
    id: 10,
    name: "Rokok Surya 16",
    price: 35000,
    category: "Lainnya",
    image: "/surya-16.jpg"
  },
];

const categories = ["Semua", "Makanan", "Minuman", "Cemilan", "Paket", "Lainnya"];

export default function POSApp() {
  // --- STATE ---
  const [isClient, setIsClient] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [view, setView] = useState<ViewMode>('pos');
  const [shopLogo, setShopLogo] = useState<string>("/logo.png");

  // State Auth
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState("");
  const [secretClicks, setSecretClicks] = useState(0);

  // State UI
  const [customerName, setCustomerName] = useState("");
  const [isTableLocked, setIsTableLocked] = useState(false); // NEW: Lock nama meja biar ga diubah user
  const [payAmount, setPayAmount] = useState<number | "">("");
  const [search, setSearch] = useState("");
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [qrisPaid, setQrisPaid] = useState(false);

  // Tab Dapur
  const [kitchenTab, setKitchenTab] = useState<KitchenTab>('active');

  // --- INITIAL LOAD & SYNC ---
  useEffect(() => {
    setIsClient(true);

    // FITUR DETEKSI MEJA (Gacoan Style)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tableNumber = params.get('meja');
      if (tableNumber) {
        setCustomerName(`Meja ${tableNumber}`);
        setIsTableLocked(true); // Kunci kolom nama biar ga diubah iseng
      }
    }

    const savedCart = localStorage.getItem('pos_cart');
    const savedTrans = localStorage.getItem('pos_transactions');
    const savedView = localStorage.getItem('pos_view');
    const savedLogo = localStorage.getItem('pos_shop_logo');

    if (savedCart) setCart(JSON.parse(savedCart));
    if (savedTrans) setTransactions(JSON.parse(savedTrans));
    if (savedView) setView(savedView as ViewMode);

    if (savedLogo) {
      setShopLogo(savedLogo);
    } else {
      setShopLogo("/logo.png");
    }

    setIsInitialized(true);

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'pos_transactions') {
        const newTrans = e.newValue;
        if (newTrans) setTransactions(JSON.parse(newTrans));
      }
      if (e.key === 'pos_shop_logo') {
        const newLogo = e.newValue;
        if (newLogo) setShopLogo(newLogo);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // --- SAVE DATA & PERSIST VIEW ---
  useEffect(() => {
    if (isClient && isInitialized) {
      localStorage.setItem('pos_cart', JSON.stringify(cart));
      localStorage.setItem('pos_transactions', JSON.stringify(transactions));
      localStorage.setItem('pos_view', view);
    }
  }, [cart, transactions, view, isClient, isInitialized]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2000000) {
        alert("Ukuran gambar terlalu besar! Maksimal 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setShopLogo(base64String);
        localStorage.setItem('pos_shop_logo', base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteLogo = () => {
    if (confirm("Hapus logo custom dan kembali ke logo default?")) {
      setShopLogo("/logo.png");
      localStorage.removeItem('pos_shop_logo');
    }
  };

  const handleSecretClick = () => {
    setSecretClicks(prev => {
      const newCount = prev + 1;
      if (newCount === 5) {
        setShowPinModal(true);
        setPin("");
        return 0;
      }
      return newCount;
    });
    setTimeout(() => setSecretClicks(0), 2000);
  };

  const handlePinSubmit = () => {
    if (pin === "8888") {
      setView('kitchen');
      setShowPinModal(false);
    } else if (pin === "9999") {
      setView('dashboard');
      setShowPinModal(false);
    } else {
      alert("PIN Salah! Akses ditolak.");
      setPin("");
    }
  };

  const handleLogout = () => {
    if (confirm("Yakin mau logout ke halaman Kasir?")) {
      setView('pos');
    }
  }

  const activeOrders = transactions.filter(t => t.status !== 'completed');
  const completedOrders = transactions.filter(t => t.status === 'completed');

  const updateOrderStatus = (trxId: string, newStatus: OrderStatus) => {
    const updatedTrans = transactions.map(t => t.id === trxId ? { ...t, status: newStatus } : t);
    setTransactions(updatedTrans);
    if (isClient) localStorage.setItem('pos_transactions', JSON.stringify(updatedTrans));
  };

  const deleteTransaction = (trxId: string) => {
    if (confirm("Yakin mau hapus pesanan ini permanen?")) {
      const updatedTrans = transactions.filter(t => t.id !== trxId);
      setTransactions(updatedTrans);
      if (isClient) localStorage.setItem('pos_transactions', JSON.stringify(updatedTrans));
    }
  };

  const handleCheckout = () => {
    if (!customerName.trim()) return alert("Mohon isi Nama Pelanggan!");

    const now = new Date();
    const newTransaction: Transaction = {
      id: `#${Math.floor(1000 + Math.random() * 9000)}`,
      date: now.toLocaleDateString('en-GB'),
      time: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      timestamp: now.getTime(),
      customerName: customerName,
      items: [...cart],
      total: totalAmount,
      method: paymentMethod,
      status: 'pending'
    };

    const updatedTrans = [newTransaction, ...transactions];
    setTransactions(updatedTrans);
    if (isClient) localStorage.setItem('pos_transactions', JSON.stringify(updatedTrans));

    setCart([]);
    if (!isTableLocked) setCustomerName(""); // Reset nama cuma kalo bukan mode meja scan
    setPayAmount("");
    setQrisPaid(false);
    setShowMobileCart(false);
    alert("Pesanan masuk ke Dapur!");
  };

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) return prev.map((item) => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      return [...prev, { ...product, qty: 1 }];
    });
    setQrisPaid(false);
  };

  const updateQty = (id: number, delta: number) => {
    setCart((prev) => prev.map((item) => {
      if (item.id === id) return { ...item, qty: Math.max(0, item.qty + delta) };
      return item;
    }).filter((item) => item.qty > 0)
    );
  };

  const getDayName = (dateStr: string) => {
    try {
      const [day, month, year] = dateStr.split('/');
      const date = new Date(Number(year), Number(month) - 1, Number(day));
      return date.toLocaleDateString('id-ID', { weekday: 'long' });
    } catch (e) {
      return '';
    }
  };

  const getAnalyticsData = () => {
    if (!transactions || transactions.length === 0) {
      return { todayRevenue: 0, todayCount: 0, chartData: [], historyData: [] };
    }

    const today = new Date().toLocaleDateString('en-GB');

    const todayTrx = transactions.filter(t => t.date === today && t.status !== 'pending');
    const todayRevenue = todayTrx.reduce((acc, t) => acc + t.total, 0);
    const todayCount = todayTrx.length;

    const groupedData = transactions.reduce((acc, t) => {
      if (t.status === 'completed') {
        const dateKey = t.date;
        if (!acc[dateKey]) {
          acc[dateKey] = { total: 0, count: 0, date: dateKey };
        }
        acc[dateKey].total += t.total;
        acc[dateKey].count += 1;
      }
      return acc;
    }, {} as Record<string, { total: number, count: number, date: string }>);

    const historyData = Object.values(groupedData).sort((a, b) => {
      const [da, ma, ya] = a.date.split('/');
      const [db, mb, yb] = b.date.split('/');
      return new Date(Number(yb), Number(mb) - 1, Number(db)).getTime() - new Date(Number(ya), Number(ma) - 1, Number(da)).getTime();
    }).reverse();

    const chartData = historyData.slice(-7).map(item => ({
      name: item.date.substring(0, 5),
      fullDate: item.date,
      total: item.total,
      count: item.count,
      day: getDayName(item.date)
    }));

    const tableHistory = [...historyData].reverse();

    return { todayRevenue, todayCount, chartData, historyData: tableHistory };
  };

  const { todayRevenue, todayCount, chartData, historyData } = getAnalyticsData();

  const totalAmount = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const totalQty = cart.reduce((acc, item) => acc + item.qty, 0);
  const change = paymentMethod === 'cash' ? (typeof payAmount === 'number' ? payAmount : 0) - totalAmount : 0;
  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) && (selectedCategory === "Semua" || p.category === selectedCategory));

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-600 border-gray-200';
      case 'cooking': return 'bg-orange-50 text-orange-600 border-orange-200';
      case 'ready': return 'bg-green-50 text-green-600 border-green-200';
      case 'completed': return 'bg-slate-50 text-slate-500 border-slate-200';
    }
  };

  if (!isClient) return null;

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-slate-800 overflow-hidden relative">

      {showPinModal && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm text-center transform scale-100 transition-all">
            <div className="bg-slate-900 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold mb-1">Admin Access</h2>
            <p className="text-sm text-gray-500 mb-6">Masukkan kode rahasia untuk akses Dapur/Owner</p>
            <input
              type="password"
              maxLength={4}
              placeholder="PIN"
              className="text-center text-3xl tracking-widest font-bold w-full py-4 border-b-2 border-slate-200 focus:border-slate-900 outline-none mb-8 bg-transparent"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              autoFocus
            />
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setShowPinModal(false)} className="py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition">Batal</button>
              <button onClick={handlePinSubmit} className="py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition">Buka Akses</button>
            </div>
          </div>
        </div>
      )}

      <div className="hidden md:flex flex-col w-20 bg-white border-r border-gray-200 items-center py-6 gap-6 z-20 shadow-sm relative">
        <div className="bg-blue-600 p-2 rounded-lg mb-4 shadow-lg shadow-blue-200"><Store className="w-6 h-6 text-white" /></div>

        <button onClick={() => setView('pos')} className={`p-3 rounded-xl transition-all flex flex-col items-center gap-1 ${view === 'pos' ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-gray-400 hover:bg-gray-50'}`}>
          <Banknote className="w-6 h-6" /><span className="text-[10px] font-bold">Kasir</span>
        </button>

        {view === 'kitchen' && <button className="p-3 rounded-xl bg-orange-50 text-orange-600 flex flex-col items-center gap-1"><ChefHat className="w-6 h-6" /><span className="text-[10px] font-bold">Dapur</span></button>}
        {view === 'dashboard' && <button className="p-3 rounded-xl bg-green-50 text-green-600 flex flex-col items-center gap-1"><BarChart3 className="w-6 h-6" /><span className="text-[10px] font-bold">Owner</span></button>}
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden">

        {view === 'dashboard' && (
          <div className="flex-1 flex flex-col h-full bg-slate-50">
            <div className="bg-white p-4 border-b flex justify-between items-center">
              <h1 className="text-xl font-bold flex items-center gap-2"><BarChart3 className="w-6 h-6 text-blue-600" /> Dashboard</h1>
              <button onClick={handleLogout} className="text-red-600 font-bold text-sm bg-red-50 px-3 py-2 rounded-lg hover:bg-red-100 transition flex items-center gap-2">
                <LogOut className="w-4 h-4" /> <span className="hidden md:inline">Logout</span>
              </button>
            </div>
            <div className="p-4 md:p-6 overflow-y-auto flex-1 space-y-6">

              <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><ImageIcon className="w-5 h-5 text-blue-600" /> Logo Toko</h3>
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
                  <div className="w-full md:w-1/2 h-32 md:h-40 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden relative group">
                    <img src={shopLogo} alt="Logo" className="w-full h-full object-cover" />
                    <label className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all cursor-pointer flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <span className="bg-white/90 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-sm"><Upload className="w-4 h-4" /> Ganti</span>
                      <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                    </label>
                  </div>
                  <div className="flex-1 w-full space-y-3">
                    <p className="text-sm text-gray-500">Banner ini akan muncul di halaman kasir publik.</p>
                    <button onClick={handleDeleteLogo} className="w-full md:w-auto bg-red-50 text-red-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-red-100 transition flex items-center justify-center gap-2">
                      <Trash2 className="w-4 h-4" /> Reset Default
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div className="bg-blue-600 text-white p-5 rounded-2xl shadow-lg">
                  <div className="flex items-center gap-2 opacity-80 mb-1 text-sm"><TrendingUp className="w-4 h-4" /> Omset Hari Ini</div>
                  <div className="text-2xl md:text-3xl font-bold">{formatRupiah(todayRevenue)}</div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border">
                  <div className="flex items-center gap-2 text-slate-500 mb-1 text-sm"><ShoppingCart className="w-4 h-4" /> Transaksi Hari Ini</div>
                  <div className="text-2xl md:text-3xl font-bold text-slate-800">{todayCount}</div>
                </div>
              </div>

              {/* Chart Responsive Height */}
              <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border h-64 md:h-80">
                <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2 text-sm md:text-base"><Calendar className="w-4 h-4 md:w-5 md:h-5" /> Grafik Penjualan (7 Hari)</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 10 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 10 }}
                      tickFormatter={(val) => `${val / 1000}k`}
                      width={30}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      formatter={(val: any, name: any, props: any) => [formatRupiah(val), `Order: ${props.payload.count}`]}
                    />
                    <Area type="monotone" dataKey="total" stroke="#2563eb" fill="#3b82f6" fillOpacity={0.1} strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Tabel Riwayat Responsive */}
              <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                <div className="p-4 border-b bg-gray-50">
                  <h3 className="font-bold text-slate-700 flex items-center gap-2"><History className="w-5 h-5" /> Riwayat Harian</h3>
                </div>

                {/* Tampilan Desktop (Tabel) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3">Tanggal</th>
                        <th className="px-6 py-3">Hari</th>
                        <th className="px-6 py-3 text-center">Jml Order</th>
                        <th className="px-6 py-3 text-right">Omset</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyData.length === 0 ? (
                        <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400">Belum ada data.</td></tr>
                      ) : (
                        historyData.map((item, index) => (
                          <tr key={index} className="bg-white border-b hover:bg-gray-50">
                            <td className="px-6 py-4 font-medium">{item.date}</td>
                            <td className="px-6 py-4 text-gray-500">{getDayName(item.date)}</td>
                            <td className="px-6 py-4 text-center">
                              <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded-full">{item.count}</span>
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-green-600">{formatRupiah(item.total)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Tampilan Mobile (List Card) */}
                <div className="md:hidden p-4 space-y-3 bg-slate-50">
                  {historyData.length === 0 ? (
                    <div className="text-center text-gray-400 py-8 text-sm">Belum ada riwayat transaksi.</div>
                  ) : (
                    historyData.map((item, index) => (
                      <div key={index} className="bg-white p-4 rounded-xl border shadow-sm flex justify-between items-center">
                        <div className="flex flex-col gap-1">
                          <span className="font-bold text-slate-800 text-sm">{item.date}</span>
                          <span className="text-xs text-slate-400 font-medium uppercase">{getDayName(item.date)}</span>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="font-bold text-green-600 text-sm">{formatRupiah(item.total)}</span>
                          <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">{item.count} Order</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

              </div>

            </div>
          </div>
        )}

        {view === 'kitchen' && (
          <div className="flex-1 overflow-y-auto p-4 bg-slate-100">
            <div className="max-w-7xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-800"><ChefHat className="w-8 h-8 text-orange-500" /> Dapur</h2>
                  <div className="flex bg-white rounded-lg p-1 shadow-sm border border-gray-200">
                    <button onClick={() => setKitchenTab('active')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${kitchenTab === 'active' ? 'bg-orange-100 text-orange-700' : 'text-gray-500 hover:bg-gray-50'}`}>Dalam Proses ({activeOrders.length})</button>
                    <button onClick={() => setKitchenTab('completed')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${kitchenTab === 'completed' ? 'bg-green-100 text-green-700' : 'text-gray-500 hover:bg-gray-50'}`}>Selesai ({completedOrders.length})</button>
                  </div>
                </div>
                <button onClick={handleLogout} className="bg-red-50 text-red-600 px-4 py-2 rounded-lg shadow-sm font-bold text-sm hover:bg-red-100 flex items-center gap-2">
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {kitchenTab === 'active' && (
                  activeOrders.length === 0 ? (
                    <div className="col-span-full text-center py-20 text-gray-400">Dapur Bersih! Belum ada pesanan.</div>
                  ) : (
                    activeOrders.map(trx => (
                      <div key={trx.id} className={`p-4 rounded-xl border-2 shadow-sm flex flex-col bg-white ${getStatusColor(trx.status)}`}>
                        <div className="flex justify-between mb-3 pb-3 border-b border-dashed border-gray-300">
                          <div><h3 className="font-black text-xl">{trx.id}</h3><div className="flex items-center gap-1 font-bold text-slate-700 text-sm"><User className="w-3 h-3" /> {trx.customerName}</div></div>
                          <div className="text-right">
                            <span className="text-xs font-mono">{trx.time}</span>
                            <button onClick={() => deleteTransaction(trx.id)} className="block mt-2 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4 ml-auto" /></button>
                          </div>
                        </div>
                        <div className="flex-1 space-y-1 mb-4">{trx.items.map((item, idx) => (<div key={idx} className="flex justify-between text-sm"><span className="font-semibold text-slate-700">{item.qty}x {item.name}</span></div>))}</div>
                        <div className="mt-auto pt-3 border-t border-gray-100">
                          {trx.status === 'pending' && <button onClick={() => updateOrderStatus(trx.id, 'cooking')} className="w-full py-2 bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-600">Mulai Masak</button>}
                          {trx.status === 'cooking' && <button onClick={() => updateOrderStatus(trx.id, 'ready')} className="w-full py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700">Siap Saji</button>}
                          {trx.status === 'ready' && <button onClick={() => updateOrderStatus(trx.id, 'completed')} className="w-full py-2 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-900">Selesai</button>}
                        </div>
                      </div>
                    ))
                  )
                )}

                {kitchenTab === 'completed' && (
                  completedOrders.length === 0 ? (
                    <div className="col-span-full text-center py-20 text-gray-400">Belum ada orderan selesai hari ini.</div>
                  ) : (
                    completedOrders.map(trx => (
                      <div key={trx.id} className="p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col bg-gray-50 opacity-80 hover:opacity-100 transition-opacity">
                        <div className="flex justify-between mb-3 pb-3 border-b border-gray-200">
                          <div><h3 className="font-bold text-lg text-gray-500 line-through">{trx.id}</h3><div className="text-xs text-gray-500">{trx.customerName}</div></div>
                          <div className="text-right">
                            <span className="text-xs font-mono bg-green-100 text-green-700 px-2 py-1 rounded">SELESAI</span>
                            <button onClick={() => deleteTransaction(trx.id)} className="block mt-2 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4 ml-auto" /></button>
                          </div>
                        </div>
                        <div className="flex-1 space-y-1 mb-4 text-gray-400">{trx.items.map((item, idx) => (<div key={idx} className="flex justify-between text-xs"><span>{item.qty}x {item.name}</span></div>))}</div>
                        <button onClick={() => updateOrderStatus(trx.id, 'ready')} className="w-full py-2 border border-gray-300 text-gray-600 rounded-lg font-bold text-xs hover:bg-white hover:text-red-500 flex items-center justify-center gap-1"><Undo2 className="w-3 h-3" /> Kembalikan ke Dapur</button>
                      </div>
                    ))
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {view === 'pos' && (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              <div className="bg-white border-b shadow-sm z-10">

                <div onClick={handleSecretClick} className="cursor-pointer select-none relative group">
                  <div className="w-full h-32 sm:h-40 bg-gray-100 overflow-hidden relative">
                    <img src={shopLogo} alt="Logo Toko" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 transition-all group-active:bg-black/10"></div>
                  </div>
                </div>

                <div className="p-4 pb-2">
                  <h1 className="text-xl font-black text-gray-800 tracking-tight">WARUNG UMKM</h1>
                  <p className="text-xs text-gray-500 font-medium">Public Access Menu</p>
                </div>

                <div className="px-4 pb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {categories.map((cat) => (<button key={cat} onClick={() => setSelectedCategory(cat)} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium ${selectedCategory === cat ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>{cat}</button>))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 pb-24 md:pb-4 bg-slate-50">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className="group bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden cursor-pointer hover:border-blue-400 active:scale-95 transition-all"
                    >
                      <div className="w-full h-40 bg-gray-100 flex items-center justify-center overflow-hidden relative">
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-3 flex-1 flex flex-col justify-between">
                        <h3 className="font-bold text-gray-800 text-sm line-clamp-2 leading-tight mb-2">{product.name}</h3>
                        <div className="flex justify-between items-center mt-auto">
                          <span className="text-blue-600 font-bold text-sm">{formatRupiah(product.price)}</span>
                          <div className="bg-blue-50 p-2 rounded-full text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <Plus className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {totalQty > 0 && <div className="md:hidden fixed bottom-4 left-4 right-4 z-40"><button onClick={() => setShowMobileCart(true)} className="w-full bg-blue-600 text-white p-4 rounded-xl shadow-xl flex justify-between items-center animate-bounce-slow"><div className="flex flex-col items-start"><span className="text-xs opacity-90">{totalQty} Item</span><span className="font-bold">{formatRupiah(totalAmount)}</span></div><div className="flex items-center gap-2 font-semibold">Lihat Keranjang <ChevronUp className="w-4 h-4" /></div></button></div>}
            <div className={`fixed inset-0 z-50 bg-white transform transition-transform duration-300 md:translate-y-0 md:static md:w-[380px] md:border-l md:border-gray-200 flex flex-col ${showMobileCart ? 'translate-y-0' : 'translate-y-full'}`}>
              <div className="p-4 border-b flex justify-between items-center bg-gray-50"><h2 className="font-bold text-lg flex items-center gap-2"><ShoppingCart className="w-5 h-5" /> Keranjang</h2><button onClick={() => setShowMobileCart(false)} className="md:hidden p-2 bg-white rounded-full"><X className="w-5 h-5" /></button></div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-4 md:pb-4">{cart.length === 0 ? <div className="text-center text-gray-400 mt-20 flex flex-col items-center gap-2"><ShoppingCart className="w-12 h-12 opacity-20" /><p>Keranjang Kosong</p></div> : cart.map(item => (<div key={item.id} className="flex justify-between items-center p-3 bg-white border rounded-lg shadow-sm"><div className="flex-1"><h4 className="font-medium text-sm">{item.name}</h4><p className="text-blue-600 text-xs font-bold">{formatRupiah(item.price)}</p></div><div className="flex items-center gap-2"><button onClick={() => updateQty(item.id, -1)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Minus className="w-4 h-4" /></button><span className="text-sm font-bold w-4 text-center">{item.qty}</span><button onClick={() => updateQty(item.id, 1)} className="p-1 text-blue-500 hover:bg-blue-50 rounded"><Plus className="w-4 h-4" /></button></div></div>))}</div>
              <div className="p-5 border-t bg-white shadow-up z-20 space-y-4">
                <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><User className="w-3 h-3" /> Nama Pelanggan <span className="text-red-500">*</span></label><input type="text" placeholder="Contoh: Meja 5 / Budi" className={`w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none ${isTableLocked ? 'cursor-not-allowed opacity-70' : ''}`} value={customerName} onChange={(e) => setCustomerName(e.target.value)} disabled={isTableLocked} /></div>
                <div className="flex p-1 bg-gray-100 rounded-lg"><button onClick={() => setPaymentMethod('cash')} className={`flex-1 py-2 text-xs font-bold rounded ${paymentMethod === 'cash' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>Tunai</button><button onClick={() => setPaymentMethod('qris')} className={`flex-1 py-2 text-xs font-bold rounded ${paymentMethod === 'qris' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>QRIS</button></div>
                <div className="flex justify-between text-xl font-bold text-gray-800 border-t pt-2"><span>Total</span><span>{formatRupiah(totalAmount)}</span></div>
                {paymentMethod === 'cash' && (<div className="relative"><span className="absolute left-3 top-2.5 text-gray-400 font-bold text-sm">Rp</span><input type="number" placeholder="0" value={payAmount} onChange={(e) => setPayAmount(Number(e.target.value))} className="w-full pl-9 pr-3 py-2 bg-gray-50 border rounded-lg font-bold focus:ring-2 focus:ring-blue-500 outline-none" /><div className="flex justify-between text-xs mt-1 text-gray-500"><span>Kembalian:</span><span className={`font-bold ${change >= 0 ? 'text-green-600' : 'text-red-500'}`}>{formatRupiah(change >= 0 ? change : 0)}</span></div></div>)}
                <button onClick={handleCheckout} disabled={cart.length === 0 || !customerName || (paymentMethod === 'cash' && change < 0)} className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all"><Printer className="w-5 h-5" /> {paymentMethod === 'qris' ? 'Bayar & Kirim ke Dapur' : 'Bayar & Cetak'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}