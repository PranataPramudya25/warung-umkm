"use client";

import React, { useState, useEffect } from 'react';
import {
  ShoppingCart, Plus, Minus, Trash2, Printer, Search, X,
  ChevronUp, Banknote, User, ChefHat, LogOut, TrendingUp, Calendar, Lock, BarChart3, Store, Undo2, ImageIcon, Upload, History
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

type CartItem = Product & { qty: number; };
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

const categories = ["Semua", "Makanan", "Minuman", "Cemilan", "Paket", "Lainnya"];

export default function POSApp() {
  const [isClient, setIsClient] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // --- STATE DATA DARI DATABASE ---
  const [products, setProducts] = useState<Product[]>([]); 
  const [cart, setCart] = useState<CartItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [view, setView] = useState<'pos' | 'kitchen' | 'dashboard'>('pos');
  const [shopLogo, setShopLogo] = useState<string>("/logo.png");

  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [isTableLocked, setIsTableLocked] = useState(false);
  const [payAmount, setPayAmount] = useState<number | "">("");
  const [search, setSearch] = useState("");
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qris'>('cash');
  const [kitchenTab, setKitchenTab] = useState<'active' | 'completed'>('active');

  // --- MANTRA AMBIL DATA DARI NEON ---
  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products', { cache: 'no-store' }); // Paksa ambil data baru
      const data = await res.json();
      console.log("Data dari Neon:", data); // Cek di console apakah list barang lu muncul
      setProducts(data);
    } catch (err) {
      console.error("Gagal tarik data:", err);
    }
  };
  
  useEffect(() => {
    setIsClient(true);
    fetchProducts(); // Ambil data pas web dibuka

    const savedCart = localStorage.getItem('pos_cart');
    const savedTrans = localStorage.getItem('pos_transactions');
    if (savedCart) setCart(JSON.parse(savedCart));
    if (savedTrans) setTransactions(JSON.parse(savedTrans));
    
    setIsInitialized(true);
  }, []);

  // --- LOGIC LAINNYA ---
  useEffect(() => {
    if (isClient && isInitialized) {
      localStorage.setItem('pos_cart', JSON.stringify(cart));
      localStorage.setItem('pos_transactions', JSON.stringify(transactions));
    }
  }, [cart, transactions, isClient, isInitialized]);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) return prev.map((item) => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id: number, delta: number) => {
    setCart((prev) => prev.map((item) => item.id === id ? { ...item, qty: Math.max(0, item.qty + delta) } : item).filter((item) => item.qty > 0));
  };

  const handleCheckout = () => {
    if (!customerName.trim()) return alert("Isi Nama Pelanggan!");
    const now = new Date();
    const newTransaction: Transaction = {
      id: `#${Math.floor(1000 + Math.random() * 9000)}`,
      date: now.toLocaleDateString('en-GB'),
      time: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      timestamp: now.getTime(),
      customerName,
      items: [...cart],
      total: cart.reduce((acc, item) => acc + item.price * item.qty, 0),
      method: paymentMethod,
      status: 'pending'
    };
    setTransactions([newTransaction, ...transactions]);
    setCart([]);
    setCustomerName("");
    alert("Pesanan Masuk!");
  };

  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  
  // FILTERING BERDASARKAN DATABASE
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) && 
    (selectedCategory === "Semua" || p.category === selectedCategory)
  );

  if (!isClient) return null;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
        {/* MODAL PIN */}
        {showPinModal && (
            <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white p-6 rounded-2xl w-full max-w-sm text-center">
                    <Lock className="w-8 h-8 mx-auto mb-4 text-slate-900" />
                    <h2 className="text-xl font-bold mb-6">Admin PIN</h2>
                    <input type="password" maxLength={4} className="text-center text-3xl w-full border-b-2 mb-8 outline-none" value={pin} onChange={(e) => setPin(e.target.value)} autoFocus />
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => setShowPinModal(false)} className="py-3 bg-gray-100 rounded-xl">Batal</button>
                        <button onClick={() => {
                            if(pin === "9999") { setView('dashboard'); setShowPinModal(false); }
                            else { alert("Salah!"); setPin(""); }
                        }} className="py-3 bg-slate-900 text-white rounded-xl">Masuk</button>
                    </div>
                </div>
            </div>
        )}

      {/* SIDEBAR */}
      <div className="hidden md:flex flex-col w-20 bg-white border-r items-center py-6 gap-6">
        <Store className="w-8 h-8 text-blue-600" />
        <button onClick={() => setView('pos')} className={`p-3 rounded-xl ${view === 'pos' ? 'bg-blue-50 text-blue-600' : 'text-gray-400'}`}><Banknote /></button>
        <button onClick={() => setShowPinModal(true)} className="p-3 rounded-xl text-gray-400"><BarChart3 /></button>
      </div>

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {view === 'pos' && (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="bg-white border-b p-4">
                    <div className="flex justify-between items-center mb-4">
                        <h1 className="text-xl font-black">WARUNG UMKM</h1>
                        <button onClick={fetchProducts} className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-bold">Refresh Data</button>
                    </div>
                    <div className="flex gap-2 overflow-x-auto">
                        {categories.map(cat => (
                            <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${selectedCategory === cat ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>{cat}</button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {filteredProducts.map(product => (
                            <div key={product.id} onClick={() => addToCart(product)} className="bg-white rounded-xl border p-2 cursor-pointer hover:border-blue-500 transition-all">
                                <img src={product.image || "https://placehold.co/400x300?text=No+Image"} className="w-full h-32 object-cover rounded-lg mb-2" />
                                <h3 className="font-bold text-sm h-10 line-clamp-2">{product.name}</h3>
                                <p className="text-blue-600 font-bold text-sm mt-1">{formatRupiah(product.price)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* CART SIDEBAR */}
            <div className="hidden md:flex w-[350px] bg-white border-l flex-col">
                <div className="p-4 border-b font-bold flex items-center gap-2"><ShoppingCart /> Keranjang</div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {cart.map(item => (
                        <div key={item.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                            <div className="flex-1"><h4 className="text-xs font-bold">{item.name}</h4><p className="text-xs text-blue-600">{formatRupiah(item.price)}</p></div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => updateQty(item.id, -1)} className="p-1 bg-white border rounded"><Minus className="w-3 h-3"/></button>
                                <span className="text-xs font-bold">{item.qty}</span>
                                <button onClick={() => updateQty(item.id, 1)} className="p-1 bg-white border rounded"><Plus className="w-3 h-3"/></button>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="p-4 border-t space-y-3">
                    <input type="text" placeholder="Nama Pelanggan" className="w-full p-2 bg-gray-100 rounded-lg text-sm" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                    <div className="flex justify-between font-bold text-lg"><span>Total</span><span>{formatRupiah(cart.reduce((acc, i) => acc + (i.price * i.qty), 0))}</span></div>
                    <button onClick={handleCheckout} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg">BAYAR SEKARANG</button>
                </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}