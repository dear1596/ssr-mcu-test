import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Clock,
  Users,
  DollarSign,
  Coffee,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  Briefcase,
  Zap,
  Sparkles,
  SlidersHorizontal,
  Info,
  Layers,
  HelpCircle,
  ThumbsUp,
  ArrowUpDown,
  Plus,
  Trash2,
  Edit2,
  Check,
  Lock,
  Unlock,
  Monitor,
  Building,
  Activity,
  Code
} from 'lucide-react';
import { Workspace, WorkspaceType } from './types';

// Translation dictionaries for Thai UI
const TYPE_LABELS: Record<WorkspaceType, string> = {
  'hot-desk': 'โต๊ะทำงานเดี่ยว (Hot Desk)',
  'meeting-room': 'ห้องประชุมอัจฉริยะ (Meeting Room)',
  'private-office': 'ออฟฟิศเฉพาะกลุ่ม (Private Office)',
  'event-space': 'ฮอลล์สัมมนา/จัดอีเวนต์ (Event Space)'
};

const TYPE_EMOJIS: Record<WorkspaceType, string> = {
  'hot-desk': '💻',
  'meeting-room': '🤝',
  'private-office': '💼',
  'event-space': '🎪'
};

const TYPE_COLORS: Record<WorkspaceType, string> = {
  'hot-desk': 'bg-teal-50 text-teal-700 border-teal-200',
  'meeting-room': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'private-office': 'bg-rose-50 text-rose-700 border-rose-200',
  'event-space': 'bg-amber-50 text-amber-700 border-amber-200'
};

export default function App() {
  // Synchronously parse current query param for URL-based role separation
  const getInitialRole = (): 'customer' | 'back-office' => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const role = params.get('role');
      if (role === 'admin' || role === 'back-office' || role === 'backoffice') {
        return 'back-office';
      }
    }
    return 'customer';
  };

  // Navigation State between Customer and Back Office (Smart URL Routed)
  const [activeTab, setActiveTab] = useState<'customer' | 'back-office'>(getInitialRole);

  // Synchronize state changes back to url params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const currentRole = params.get('role');
      const expectedRole = activeTab === 'back-office' ? 'admin' : 'customer';
      if (currentRole !== expectedRole) {
        const newUrl = window.location.origin + window.location.pathname + `?role=${expectedRole}`;
        window.history.replaceState({ path: newUrl }, '', newUrl);
      }
    }
  }, [activeTab]);

  // Handle Clipboard Copy Link actions
  const handleCopyLink = (roleType: 'customer' | 'admin') => {
    if (typeof window !== 'undefined') {
      const link = window.location.origin + window.location.pathname + `?role=${roleType}`;
      navigator.clipboard.writeText(link).then(() => {
        showNotification(`📋 คัดลอกลิงก์ฝั่ง ${roleType === 'admin' ? 'แอดมินหลังบ้าน (Admin)' : 'ลูกค้าหน้าร้าน (Customer)'} เรียบร้อยแล้ว!`);
      }).catch(() => {
        showNotification(`ไม่สามารถคัดลอกอัตโนมัติได้ ลิงก์คือ: ${link}`);
      });
    }
  };

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // SEARCH, FILTER, SORT For Customer View
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<WorkspaceType | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'available' | 'occupied'>('all');
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc' | 'capacity-asc' | 'capacity-desc'>('default');

  // Customer Booking Dialog Action State
  const [bookingTarget, setBookingTarget] = useState<Workspace | null>(null);
  const [bookHours, setBookHours] = useState<number>(2);
  const [speedMode, setSpeedMode] = useState<'real' | 'fast' | 'lightning'>('lightning');
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);

  // Back-office Admin Add Workspace Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [newWsType, setNewWsType] = useState<WorkspaceType>('hot-desk');
  const [newWsPrice, setNewWsPrice] = useState<number>(120);
  const [newWsCapacity, setNewWsCapacity] = useState<number>(4);
  const [newWsDescription, setNewWsDescription] = useState('');
  const [newWsAmenities, setNewWsAmenities] = useState<string>('WiFi ความเร็วสูง, ปลั๊กไฟส่วนตัว, ชา-กาแฟบริการฟรี');
  const [newWsImage, setNewWsImage] = useState('');

  // Back-office Admin inline Edit area state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editCapacity, setEditCapacity] = useState<number>(1);
  const [editDescription, setEditDescription] = useState('');

  // Total calculated statistics (Revenue, volume)
  const [simulationRevenue, setSimulationRevenue] = useState<number>(0);
  const [completedBookingsCount, setCompletedBookingsCount] = useState<number>(0);
  const [bookingHistory, setBookingHistory] = useState<any[]>([]);

  // Auto Tick timer update state (updated every 1,000ms for accurate countdown calculations)
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [showLiveDbConsole, setShowLiveDbConsole] = useState(true); // Default true so user can instantly "ดูข้อมูลที่เก็บไว้"

  // 1. Fetch current workspaces list from backend Express service
  const fetchWorkspaces = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const res = await fetch('/api/workspaces');
      if (!res.ok) {
        throw new Error('ไม่สามารถโหลดข้อมูลสถานที่ล่าสุดจาก Express API หลังบ้านได้');
      }
      const data = await res.json();
      setWorkspaces(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'เกิดความขัดข้องทางเครือข่าย');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const res = await fetch('/api/bookings');
      if (res.ok) {
        const data = await res.json();
        setBookingHistory(data.bookings || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        // Since the backend calculates revenue from all time in Supabase
        if (data.source === "supabase") {
          setSimulationRevenue(data.revenue);
          setCompletedBookingsCount(data.count);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Poll the Express API backend every 4 seconds to sync state alterations (avoiding stale displays)
  useEffect(() => {
    fetchWorkspaces();
    fetchStats();
    fetchBookings();
    const interval = setInterval(() => {
      fetchWorkspaces(true);
      if (activeTab === 'back-office') {
        fetchStats();
        fetchBookings();
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [activeTab]);

  // Countdown Live Timer ticker
  useEffect(() => {
    const clockTimer = setInterval(() => {
      setCurrentTime(Date.now());

      // If any booking expired just now, we force fetch a database status sweep to free resources
      const triggerForceSync = workspaces.some(ws => {
        if (ws.status === 'occupied' && ws.bookedUntil) {
          const delta = new Date(ws.bookedUntil).getTime() - Date.now();
          return delta <= 0 && delta > -1100; // Trigger roughly once
        }
        return false;
      });

      if (triggerForceSync) {
        fetchWorkspaces(true);
      }
    }, 1000);
    return () => clearInterval(clockTimer);
  }, [workspaces]);

  // Customer: Handle Confirm Reservation Submit
  const executeBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingTarget) return;

    setIsSubmittingBooking(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/workspaces/${bookingTarget.id}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          durationHours: bookHours,
          speedMode: speedMode
        })
      });

      const body = await res.json();

      if (!res.ok || !body.success) {
        throw new Error(body.message || 'การเรียกจองพื้นที่ล้มเหลวเนื่องจากห้องอาจเปลี่ยนสถานะไปแล้ว');
      }

      // Add to simulated analytics
      setSimulationRevenue(prev => prev + (bookingTarget.pricePerHour * bookHours));
      setCompletedBookingsCount(prev => prev + 1);

      showNotification(`🎉 สำเร็จ! จองพื้นที่ "${bookingTarget.name}" (${bookHours} ชั่วโมง) เรียบร้อยแล้ว`);
      setBookingTarget(null);
      await fetchWorkspaces(true); // Silent sync with state
    } catch (err: any) {
      setErrorMessage(err.message || 'เกิดอุปสรรคในการประสานงานจองห้อง');
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  // Customer/Admin: Release / Clear Booking Reservation manually
  const cancelOrFinishBooking = async (wsId: string, wsName: string) => {
    try {
      setErrorMessage(null);
      const res = await fetch(`/api/workspaces/${wsId}/release`, {
        method: 'POST'
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        throw new Error(body.message || 'ไม่สามารถปล่อยพื้นที่เป็นห้องว่างได้');
      }

      showNotification(`🔓 เคลียร์สิทธิ์สำเร็จ! "${wsName}" กลับคืนสู่รายชื่อพื้นที่ว่างแล้ว`);
      await fetchWorkspaces(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการปลดสถานะจอง');
    }
  };

  // Admin Back Office: Create new Workspace area zone
  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) {
      setErrorMessage('กรุณากรอกชื่อสเปซพื้นที่เช่าใหม่');
      return;
    }

    try {
      setErrorMessage(null);
      const amenitiesList = newWsAmenities.split(',').map(item => item.trim()).filter(Boolean);
      
      const res = await fetch('/api/workspaces/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newWsName,
          type: newWsType,
          pricePerHour: newWsPrice,
          capacity: newWsCapacity,
          description: newWsDescription || `พื้นที่ให้บริการระดับเรือธงประเภท ${TYPE_LABELS[newWsType]} ตกแต่งโมเดิร์น สภาพแวดล้อมดีเยี่ยม`,
          amenities: amenitiesList,
          image: newWsImage || undefined
        })
      });

      const body = await res.json();
      if (!res.ok || !body.success) {
        throw new Error(body.message || 'ไม่สามารถผลิตพื้นที่โซนพื้นที่เช่าใหม่ได้');
      }

      showNotification(`🟢 เพิ่มพื้นที่เช่าใหม่ "${newWsName}" เรียบร้อยแล้ว!`);
      setShowAddForm(false);
      
      // Reset form controls
      setNewWsName('');
      setNewWsDescription('');
      setNewWsPrice(120);
      setNewWsCapacity(4);
      setNewWsAmenities('WiFi ความเร็วสูง, ปลั๊กไฟส่วนตัว, ชา-กาแฟบริการฟรี');
      setNewWsImage('');

      await fetchWorkspaces(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'ไม่เสถียรด้านคอมพิวเตอร์');
    }
  };

  // Admin Back Office: Delete a Workspace Zone permanently
  const handleDeleteWorkspace = async (wsId: string, wsName: string) => {
    if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบพื้นที่ "${wsName}" ออกจากระบบถาวร?`)) return;

    try {
      setErrorMessage(null);
      const res = await fetch(`/api/workspaces/${wsId}/delete`, {
        method: 'POST'
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        throw new Error(body.message || 'ระบบไม่สามารถเข้าทำรายการลบสถานที่นี้ได้');
      }

      showNotification(`🗑️ ลบพืนที่ "${wsName}" สำเร็จเรียบร้อย`);
      await fetchWorkspaces(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'เกิดข้อบกพร่อง');
    }
  };

  // Admin Back Office: Inline Update parameters
  const startInlineEdit = (ws: Workspace) => {
    setEditingId(ws.id);
    setEditName(ws.name);
    setEditPrice(ws.pricePerHour);
    setEditCapacity(ws.capacity);
    setEditDescription(ws.description);
  };

  const saveInlineEdit = async (wsId: string) => {
    if (!editName.trim()) {
      setErrorMessage('กรุณาระบุชื่อในการบันทึกให้ครบถ้วน');
      return;
    }

    try {
      setErrorMessage(null);
      const res = await fetch(`/api/workspaces/${wsId}/admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          pricePerHour: editPrice,
          capacity: editCapacity,
          description: editDescription
        })
      });

      const body = await res.json();
      if (!res.ok || !body.success) {
        throw new Error(body.message || 'ไม่สามารถแก้ไขข้อมูลผ่านฝ่ายบริหารหลังบ้านได้');
      }

      showNotification('📝 อัปเดตข้อมูลรายละเอียดหลังบ้านแล้วอย่างรวดเร็ว');
      setEditingId(null);
      await fetchWorkspaces(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'อัปเดตล้มเหลว');
    }
  };

  // Admin Back Office: Update occupation status directly with absolute override (ว่าง <-> ไม่ว่าง)
  const toggleOccupationByAdmin = async (ws: Workspace) => {
    const nextStatus = ws.status === 'available' ? 'occupied' : 'available';
    try {
      setErrorMessage(null);
      const res = await fetch(`/api/workspaces/${ws.id}/admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        throw new Error(body.message || 'ไม่อนุญาตการสลับสถานะส่วนกลาง');
      }

      showNotification(`⚙️ แอดมินบังคับสลับสถานะห้อง ${ws.name} เป็น "${nextStatus === 'occupied' ? 'ไม่ว่าง' : 'ว่าง'}"`);
      await fetchWorkspaces(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดระหว่างสลับประเภทรองรับหลังบ้าน');
    }
  };

  // Toast notifier helper
  const showNotification = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3800);
  };

  // Client Filter logic computed via React cache memo
  const filteredWorkspaces = useMemo(() => {
    return workspaces
      .filter((ws) => {
        const matchesSearch =
          ws.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ws.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ws.amenities.some(amenity => amenity.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesType = selectedType === 'all' || ws.type === selectedType;
        const matchesStatus = selectedStatus === 'all' || ws.status === selectedStatus;

        return matchesSearch && matchesType && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.pricePerHour - b.pricePerHour;
        if (sortBy === 'price-desc') return b.pricePerHour - a.pricePerHour;
        if (sortBy === 'capacity-asc') return a.capacity - b.capacity;
        if (sortBy === 'capacity-desc') return b.capacity - a.capacity;
        return 0; // Default server arrays representation
      });
  }, [workspaces, searchQuery, selectedType, selectedStatus, sortBy]);

  // General counts & ratios
  const occupancyStats = useMemo(() => {
    const total = workspaces.length;
    const available = workspaces.filter(w => w.status === 'available').length;
    const occupied = total - available;
    const ratio = total > 0 ? Math.round((occupied / total) * 100) : 0;
    return { total, available, occupied, ratio };
  }, [workspaces]);

  // Quick total cost simulation computation inside modal
  const estimatedCostValue = useMemo(() => {
    if (!bookingTarget) return 0;
    return bookingTarget.pricePerHour * bookHours;
  }, [bookingTarget, bookHours]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      
      {/* Dynamic Floating Feedback Notices */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-md w-full px-4 sm:px-0">
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="bg-slate-900 text-white rounded-2xl p-4.5 shadow-2xl flex items-start gap-3 border border-teal-500/30"
              id="success-toast"
            >
              <div className="p-1 px-1.5 bg-teal-500/20 text-teal-400 font-bold rounded-lg text-xs">OK</div>
              <div className="flex-1">
                <p className="font-semibold text-xs font-mono uppercase tracking-wider text-slate-400">ระบบทำงานสำเร็จ</p>
                <p className="text-xs font-medium text-white mt-1 leading-relaxed">{successMessage}</p>
              </div>
              <button onClick={() => setSuccessMessage(null)} className="text-slate-400 hover:text-white shrink-0 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="bg-rose-900/90 text-white rounded-2xl p-4.5 shadow-2xl flex items-start gap-4 border border-rose-500/40 backdrop-blur-md"
              id="error-toast"
            >
              <AlertCircle className="w-5 h-5 text-rose-300 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-xs uppercase text-rose-300 font-mono tracking-wider">เกิดข้อสังเกต</p>
                <p className="text-xs text-rose-50 mt-1 leading-relaxed">{errorMessage}</p>
              </div>
              <button onClick={() => setErrorMessage(null)} className="text-rose-300 hover:text-white shrink-0 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Visual Identity Navigation Header (Smart Space Rental Custom Edition) */}
      <header className="bg-slate-900 text-white relative overflow-hidden pt-10 pb-16 px-4 md:px-8 shadow-xl">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-teal-500/10 to-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-[20%] w-[350px] h-[350px] bg-gradient-to-tr from-sky-500/8 to-teal-500/8 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            {/* Branding elements */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-500/10 text-teal-400 text-xs font-semibold rounded-full border border-teal-500/20 mb-3 tracking-wider">
                <Sparkles className="w-3 h-3 text-teal-400 animate-spin" /> SMART SPACE RENTAL
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight font-display text-white">
                SMART <span className="text-teal-400 font-light font-sans text-2xl md:text-3.5xl">SPACE RENTAL</span>
              </h1>
              <p className="text-slate-400 mt-2 text-xs md:text-sm max-w-xl font-normal leading-relaxed">
                ระบบจองโต๊ะทํางานและห้องประชุมแบบใช้งานง่าย แยกส่วนหน้าบ้านสำหรับลูกค้า และหลังบ้านสำหรับคนดูแลร้านแยกกันได้อย่างชัดเจนครับ
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 -mt-8 relative z-20">

        {/* VIEW 1: Customer View Panel */}
        {activeTab === 'customer' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            id="customer-view-container"
          >
            {/* Header Title inside client */}
            <div className="flex items-center gap-2 mb-4">
              <Building className="w-5 h-5 text-teal-600" />
              <h2 className="text-lg font-bold text-[#a2b3d1]">รายการพื้นที่และห้องประชุมที่เปิดให้บริการ</h2>
            </div>

            {/* Filter Controls Bar */}
            <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 mb-8" id="customer-filter-bar">
              <div className="flex flex-col gap-4">
                
                {/* Search Text with Sort select */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="relative md:col-span-6">
                    <Search className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="พิมพ์ค้นหา: พิมพ์ชื่อสเปซ, ห้อง, หรือออฟฟิศที่นี่ ได้เลยครับ..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full text-sm pl-11 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-hidden focus:border-teal-500 focus:ring-3 focus:ring-teal-100 transition-all font-medium"
                      id="search-input"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-4.5 h-4.5" />
                      </button>
                    )}
                  </div>

                  <div className="md:col-span-4 flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500 whitespace-nowrap hidden sm:inline-block">
                      <ArrowUpDown className="w-3.5 h-3.5 inline mr-1" /> จัดเรียงตาม:
                    </span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="w-full text-xs font-semibold py-2.5 pl-3 pr-8 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-hidden focus:border-teal-500 focus:ring-3 focus:ring-teal-100 transition-all appearance-none cursor-pointer"
                      id="sort-select"
                    >
                      <option value="default">ค่าเริ่มต้นของร้าน</option>
                      <option value="price-asc">ราคาเช่า: ถูกไปแพง</option>
                      <option value="price-desc">ราคาเช่า: แพงไปถูก</option>
                      <option value="capacity-asc">จำนวนที่นั่ง: น้อยไปมาก</option>
                      <option value="capacity-desc font-sans">จำนวนที่นั่ง: มากไปน้อย</option>
                    </select>
                  </div>

                  <div className="md:col-span-2 flex justify-end">
                    {(searchQuery || selectedType !== 'all' || selectedStatus !== 'all' || sortBy !== 'default') && (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedType('all');
                          setSelectedStatus('all');
                          setSortBy('default');
                        }}
                        className="w-full text-xs text-rose-600 hover:text-rose-700 font-bold border border-rose-200 bg-rose-50/30 hover:bg-rose-50 rounded-xl py-2 px-3 transition-colors text-center cursor-pointer"
                        id="reset-customer-filters"
                      >
                        ล้างตัวกรองทั้งหมด
                      </button>
                    )}
                  </div>
                </div>

                {/* Subcategory selectors */}
                <div className="border-t border-slate-100 pt-3.5">
                  <div className="flex flex-col gap-3">
                    
                    {/* Workspace Category filters */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mr-2">ประเภทห้อง:</span>
                      <button
                        onClick={() => setSelectedType('all')}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                          selectedType === 'all'
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        ทั้งหมด
                      </button>
                      <button
                        onClick={() => setSelectedType('hot-desk')}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                          selectedType === 'hot-desk'
                            ? 'bg-teal-600 text-white border-teal-500 shadow-xs'
                            : 'bg-teal-50/30 text-teal-700 border-teal-100 hover:bg-teal-50'
                        }`}
                      >
                        💻 Hot Desk (โต๊ะเดี่ยว)
                      </button>
                      <button
                        onClick={() => setSelectedType('meeting-room')}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                          selectedType === 'meeting-room'
                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
                            : 'bg-indigo-50/30 text-indigo-700 border-indigo-100 hover:bg-indigo-50'
                        }`}
                      >
                        🤝 ห้องประชุม
                      </button>
                      <button
                        onClick={() => setSelectedType('private-office')}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                          selectedType === 'private-office'
                            ? 'bg-rose-600 text-white border-rose-500 shadow-xs'
                            : 'bg-rose-50/30 text-rose-700 border-rose-100 hover:bg-rose-50'
                        }`}
                      >
                        💼 ห้องทำงานส่วนตัว
                      </button>
                      <button
                        onClick={() => setSelectedType('event-space')}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                          selectedType === 'event-space'
                            ? 'bg-amber-600 text-white border-amber-500 shadow-xs'
                            : 'bg-amber-50/30 text-amber-700 border-amber-100 hover:bg-amber-50'
                        }`}
                      >
                        🎪 พื้นที่จัดอีเวนต์ใหญ่
                      </button>
                    </div>

                    {/* Status filters */}
                    <div className="flex flex-wrap items-center gap-2 border-t border-slate-50 pt-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mr-2">ตามสถานะ:</span>
                      <button
                        onClick={() => setSelectedStatus('all')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          selectedStatus === 'all'
                            ? 'bg-slate-200 text-slate-800'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        ทั้งหมด
                      </button>
                      <button
                        onClick={() => setSelectedStatus('available')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
                          selectedStatus === 'available'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-250 shadow-xs'
                            : 'bg-slate-100/50 text-slate-500 border-transparent hover:bg-emerald-50/50'
                        }`}
                      >
                        🟢 แสดงเฉพาะห้องว่างตอนนี้
                      </button>
                      <button
                        onClick={() => setSelectedStatus('occupied')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
                          selectedStatus === 'occupied'
                            ? 'bg-rose-50 text-rose-800 border-rose-250 shadow-xs'
                            : 'bg-slate-100/50 text-slate-500 border-transparent hover:bg-rose-50/50'
                        }`}
                      >
                        🔴 แสดงเฉพาะห้องที่มีคนจองแล้ว
                      </button>
                    </div>

                  </div>
                </div>

              </div>
            </section>

            {/* Display loading layout */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-200">
                <RefreshCw className="w-8 h-8 text-teal-600 animate-spin" />
                <p className="text-xs font-semibold text-slate-400 mt-3 font-mono">กำลังประมูลกวาดสถานะห้องว่างวินาทีต่อวินาทีจากระบบ Express Server Room DB...</p>
              </div>
            ) : filteredWorkspaces.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-250 p-16 text-center max-w-xl mx-auto flex flex-col items-center">
                <Search className="w-10 h-10 text-slate-350 bg-slate-100 p-2.5 rounded-full mb-3" />
                <p className="font-bold text-slate-800">ไม่พบคลังคำขอที่กรองในระบบ</p>
                <p className="text-xs text-slate-400 mt-1">ไม่มีข้อมูลพื้นที่เช่าหรือโต๊ะตามเป้าหมาย โปรดกวาดข้อความล้างฟิลเตอร์ออกเพื่อมองภาพรวม</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedType('all');
                    setSelectedStatus('all');
                    setSortBy('default');
                  }}
                  className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-850 cursor-pointer"
                >
                  คลิกเพื่อรีเซ็ตทั้งหมด
                </button>
              </div>
            ) : (
              // Real Space Area Cards
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="customer-grid">
                <AnimatePresence>
                  {filteredWorkspaces.map((ws) => {
                    const isOccupied = ws.status === 'occupied';
                    
                    // Calc timer duration seconds
                    let bookingCountdownSeconds = 0;
                    if (isOccupied && ws.bookedUntil) {
                      bookingCountdownSeconds = Math.max(0, Math.floor((new Date(ws.bookedUntil).getTime() - currentTime) / 1000));
                    }

                    return (
                      <motion.div
                        key={ws.id}
                        layout
                        initial={{ opacity: 0, scale: 0.98, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-lg hover:border-slate-300 flex flex-col justify-between group relative transition-all duration-200"
                      >
                        {/* Space Image Frame */}
                        <div className="h-48 sm:h-52 w-full relative overflow-hidden bg-slate-100 shrink-0">
                          <img
                            src={ws.image}
                            alt={ws.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                          />
                          
                          {/* Left Badge: Status flag */}
                          <div className="absolute top-3 left-3 z-10">
                            <span className={`px-2.5 py-1 text-[10px] font-bold tracking-wide rounded-full border shadow-sm uppercase ${
                              isOccupied 
                                ? 'bg-rose-500 text-white border-rose-450' 
                                : 'bg-emerald-500 text-white border-emerald-450'
                            }`}>
                              {isOccupied ? '🔴 ไม่ว่าง' : '🟢 ว่าง'}
                            </span>
                          </div>

                          {/* Capacity indicators */}
                          <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-xs text-white px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-sm">
                            <Users className="w-3 h-3 text-teal-300" />
                            <span>รองรับสูงสุด {ws.capacity} ท่าน</span>
                          </div>

                          {/* Category Tag */}
                          <div className="absolute bottom-3 left-3 z-10">
                            <span className={`px-2.5 py-1 rounded-md text-[9px] font-bold tracking-wider uppercase border shadow-sm ${TYPE_COLORS[ws.type]}`}>
                              {TYPE_EMOJIS[ws.type]} {TYPE_LABELS[ws.type].split(' ')[0]}
                            </span>
                          </div>
                        </div>

                        {/* Text detail section */}
                        <div className="p-5 flex-1 flex flex-col justify-between">
                          <div>
                            <h3 className="font-bold text-slate-850 text-base md:text-lg tracking-tight leading-snug group-hover:text-teal-600 transition-colors">
                              {ws.name}
                            </h3>
                            <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed min-h-[2.5rem]">
                              {ws.description}
                            </p>

                            {/* Perks elements list */}
                            <div className="flex flex-wrap gap-1 mt-4">
                              {ws.amenities.map((amenity, key) => (
                                <span key={key} className="bg-slate-100/80 border border-slate-150 text-slate-600 text-[9px] font-bold px-2 py-0.5 rounded-sm">
                                  ✓ {amenity}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Calculation details & booking layout */}
                          <div className="border-t border-slate-150 pt-4 mt-5">
                            {isOccupied ? (
                              <div className="bg-slate-50 border border-dashed border-rose-200/80 rounded-2xl p-3 mb-4 animate-pulse">
                                <div className="flex items-center justify-between text-[10px] text-rose-500 font-bold mb-1">
                                  <span className="flex items-center gap-1 uppercase tracking-widest font-mono">
                                    <Clock className="w-3.5 h-3.5" /> เวลาในสัญญาเหลือ :
                                  </span>
                                  <span className="font-mono bg-rose-100 text-rose-700 rounded px-1 scale-90">
                                    {ws.bookedDurationHours} ชม.
                                  </span>
                                </div>

                                <div className="text-center py-0.5 font-mono text-xl font-extrabold text-slate-800 tracking-wider">
                                  {bookingCountdownSeconds > 0 ? (
                                    <>
                                      {Math.floor(bookingCountdownSeconds / 3600).toString().padStart(2, '0')}:
                                      {Math.floor((bookingCountdownSeconds % 3600) / 60).toString().padStart(2, '0')}:
                                      {(bookingCountdownSeconds % 60).toString().padStart(2, '0')}
                                    </>
                                  ) : (
                                    <span className="text-teal-500 text-xs font-semibold">กำลังคืนสิทธิ์ว่าง...</span>
                                  )}
                                </div>
                                <p className="text-[9px] text-center text-slate-400 mt-1">
                                  กำหนดสิทธิ์หมดเวลาที่: {ws.bookedUntil ? new Date(ws.bookedUntil).toLocaleTimeString('th-TH') : '--'} น.
                                </p>
                              </div>
                            ) : (
                              // Available View - Rates
                              <div className="flex justify-between items-center mb-4 bg-teal-50/25 p-3 rounded-2xl border border-teal-100/30">
                                <div>
                                  <p className="text-[9px] text-slate-400 uppercase tracking-widest font-mono font-bold leading-none">ค่าเช่าอัศรา</p>
                                  <p className="text-xs text-slate-500 mt-1 font-medium italic">คำนวณราคาตามชั่วโมงได้</p>
                                </div>
                                <div className="text-right">
                                  <span className="text-xl font-bold font-mono text-teal-600">฿{ws.pricePerHour}</span>
                                  <span className="text-[10px] font-bold text-slate-400 font-mono"> /ชม.</span>
                                </div>
                              </div>
                            )}

                            {/* Booking Action */}
                            {isOccupied ? (
                              <button
                                disabled
                                className="w-full bg-slate-100 text-slate-400 font-bold text-xs py-3 px-4 rounded-xl cursor-not-allowed border border-slate-200"
                              >
                                ไม่พร้อมให้จองขณะนี้
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setBookingTarget(ws);
                                  // Recommended sensible duration limit
                                  setBookHours(4);
                                }}
                                className="w-full bg-teal-600 hover:bg-teal-700 active:bg-teal-850 text-white font-bold text-xs py-3 rounded-xl shadow-xs hover:shadow-md transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <span>⚡ กดจองใช้นั่งตรงนี้</span>
                              </button>
                            )}
                          </div>
                        </div>

                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}

        {/* VIEW 2: Back Office Room Control Panel */}
        {activeTab === 'back-office' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            id="backoffice-view-container"
          >
            {/* Header Title inside Admin */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Monitor className="w-5 h-5 text-indigo-600 animate-pulse" />
                <h2 className="text-lg font-bold text-[#a2b3d1]">ระบบจัดการพื้นที่และติดตามสถานะ (Back Office Console)</h2>
              </div>
              
              {/* Trigger addition of workspace */}
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                id="show-add-workspace-form-btn"
              >
                {showAddForm ? (
                  <>
                    <X className="w-4 h-4" /> ปิดหน้าต่างเพิ่ม
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" /> เพิ่มห้องหรือโต๊ะใหม่เข้าระบบ
                  </>
                )}
              </button>
            </div>

            {/* Bento Board: Instant Statistics Monitoring Panel only for Admin */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8" id="statistics-cards">
              
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <p className="text-[10px] font-bold text-slate-400 font-mono">พื้นที่ว่างตอนนี้</p>
                  <span className="p-1 px-1.5 bg-emerald-50 text-emerald-700 rounded-md text-[10px] font-bold">ว่างอยู่</span>
                </div>
                <div className="mt-4">
                  <span className="text-3xl font-extrabold text-slate-800 font-display">{occupancyStats.available}</span>
                  <span className="text-xs text-slate-400 font-medium ml-1.5">/ {occupancyStats.total} สเปซทั้งหมด</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <p className="text-[10px] font-bold text-slate-400 font-mono">พื้นที่ที่มีคนจองอยู่</p>
                  <span className="p-1 px-1.5 bg-rose-50 text-rose-700 rounded-md text-[10px] font-bold">ไม่ว่าง</span>
                </div>
                <div className="mt-4">
                  <span className="text-3xl font-extrabold text-slate-800 font-display">{occupancyStats.occupied}</span>
                  <span className="text-xs text-slate-400 font-medium ml-1.5">กำลังใช้งาน</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow col-span-2 sm:col-span-1">
                <div className="flex justify-between items-start">
                  <p className="text-[10px] font-bold text-slate-400 font-mono">ยอดเงินรวมจากการจอง (จำลอง)</p>
                  <span className="p-1 px-1.5 bg-sky-50 text-sky-700 rounded-md text-[10px] font-bold">รายได้รวม</span>
                </div>
                <div className="mt-4">
                  <span className="text-2xl font-extrabold text-teal-600 font-mono">฿{simulationRevenue.toLocaleString()}</span>
                  <span className="text-xs text-slate-400 font-medium ml-1 block mt-0.5">
                    กดจองสำเร็จทั้งหมด {completedBookingsCount} ครั้ง
                  </span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-5 rounded-2xl shadow-md flex flex-col justify-between relative overflow-hidden col-span-2 lg:col-span-1">
                <div className="absolute top-0 right-0 translate-x-4 -translate-y-4 opacity-10 pointer-events-none">
                  <Zap className="w-32 h-32" />
                </div>
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider font-mono text-teal-300 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 fill-teal-350" /> ทิปเล็กๆ สำหรับเดโม
                  </h4>
                  <p className="text-[10px] text-slate-300 mt-1 leading-relaxed">
                    ระบบจะปลดห้องว่างให้อัตโนมัติเมื่อหมดเวลาจอง <strong>แนะนำให้ปรับสปีดเวลาขวาบนเป็นสปีดติดเทอร์โบ</strong> เพื่อทดลองดูระบบถอยหลังเสมือนจริงนะครับ!
                  </p>
                </div>
              </div>

            </section>

            {/* Dynamic Add Workspace form (Admin Landlord exclusive action) */}
            <AnimatePresence>
              {showAddForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white border-2 border-indigo-100 rounded-3xl p-6 mb-8 shadow-md overflow-hidden"
                  id="add-workspace-panel"
                >
                  <div className="flex items-center gap-1.5 border-b border-slate-150 pb-3 mb-5">
                    <Sparkles className="w-4 h-4 text-indigo-600 animate-spin-slow" />
                    <h3 className="font-bold text-slate-850 text-sm uppercase tracking-wider font-mono">แบบฟอร์มเพิ่มพืนที่เช่าใหม่เข้าระบบ (Backend Core Dynamic Record)</h3>
                  </div>

                  <form onSubmit={handleCreateWorkspace} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      
                      <div className="md:col-span-4">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono block mb-1">ชื่อพื้นที่เช่า/หมายเลขออฟฟิศ *</label>
                        <input
                          type="text"
                          required
                          placeholder="เช่น EX303 - Silicon Valley Private Suite"
                          value={newWsName}
                          onChange={(e) => setNewWsName(e.target.value)}
                          className="w-full text-xs font-medium p-3 rounded-lg border border-slate-200 focus:outline-hidden focus:border-indigo-500 bg-slate-50/50"
                        />
                      </div>

                      <div className="md:col-span-3">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono block mb-1">ประเภทสเปซ *</label>
                        <select
                          value={newWsType}
                          onChange={(e) => setNewWsType(e.target.value as WorkspaceType)}
                          className="w-full text-xs font-bold p-3 rounded-lg border border-slate-200 focus:outline-hidden focus:border-indigo-500 bg-slate-50/50 appearance-none cursor-pointer"
                        >
                          <option value="hot-desk">💻 โต๊ะทำงานเดี่ยว (Hot Desk)</option>
                          <option value="meeting-room">🤝 ห้องประชุมอัจฉริยะ (Meeting Room)</option>
                          <option value="private-office">💼 ออฟฟิศเฉพาะกลุ่ม (Private Office)</option>
                          <option value="event-space">🎪 ฮอลล์สัมมนา/จัดอีเวนต์ (Event Space)</option>
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono block mb-1">ราคาเช่าต่อช่ั่วโมง (บาท) *</label>
                        <input
                          type="number"
                          required
                          min="10"
                          max="9999"
                          value={newWsPrice}
                          onChange={(e) => setNewWsPrice(Number(e.target.value))}
                          className="w-full text-xs font-bold p-3 rounded-lg border border-slate-200 focus:outline-hidden focus:border-indigo-500 bg-slate-50/50"
                        />
                      </div>

                      <div className="md:col-span-3">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono block mb-1">ความจุสูงสุด (คน) *</label>
                        <input
                          type="number"
                          required
                          min="1"
                          max="150"
                          value={newWsCapacity}
                          onChange={(e) => setNewWsCapacity(Number(e.target.value))}
                          className="w-full text-xs font-bold p-3 rounded-lg border border-slate-200 focus:outline-hidden focus:border-indigo-500 bg-slate-50/50"
                        />
                      </div>

                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      
                      <div className="md:col-span-6">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono block mb-1">คำอธิบายรายละเอียด</label>
                        <input
                          type="text"
                          placeholder="รายละเอียดสินค้าสิ่งก่อสร้างบรรยากาศธรรมชาติ ความบันเทิงสูง..."
                          value={newWsDescription}
                          onChange={(e) => setNewWsDescription(e.target.value)}
                          className="w-full text-xs font-medium p-3 rounded-lg border border-slate-200 focus:outline-hidden focus:border-indigo-500 bg-slate-50/50"
                        />
                      </div>

                      <div className="md:col-span-6">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono block mb-1">สิ่งอำนวยความสะดวกในตัว (พิมพ์ขั้นด้วยเครื่องหมายลูกน้ำ ,)</label>
                        <input
                          type="text"
                          placeholder="WiFi ความเร็วสูง, ปลั๊กไฟส่วนตัว, ชา-กาแฟบริการฟรี, เก้าอี้ Ergonomic"
                          value={newWsAmenities}
                          onChange={(e) => setNewWsAmenities(e.target.value)}
                          className="w-full text-xs font-medium p-3 rounded-lg border border-slate-200 focus:outline-hidden focus:border-indigo-500 bg-slate-50/50"
                        />
                      </div>

                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono block mb-1">ที่อยู่อิสระรูปภาพ URL (เว้นว่างไว้เพื่อสุ่มรูปจากคลังภาพตามประเภท)</label>
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/photo-..."
                        value={newWsImage}
                        onChange={(e) => setNewWsImage(e.target.value)}
                        className="w-full text-xs font-medium p-3 rounded-lg border border-slate-200 focus:outline-hidden focus:border-indigo-500 bg-slate-50/50"
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddForm(false)}
                        className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold cursor-pointer"
                      >
                        ยกเลิกการเพิ่ม
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
                        id="submit-create-workspace-btn"
                      >
                        เพิ่มลงรายการหลังบ้านสดตอนนี้
                      </button>
                    </div>

                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Backoffice tabular management grid list */}
            <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden" id="backoffice-management-table">
              
              <div className="p-5 border-b border-slate-150 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">ตารางแอร์ริตี้และสถานะของห้องเช่าทั้งหมด</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">คุณสามารถสลับสถานะ 'ว่าง/ไม่ว่าง' ได้โดยตรง, แนะนำการบำรุงรักษา หรือคลิกแก้ไขค่าเช่ารายชั่วโมงล่วงหน้าได้ทันที</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded">
                    Total Records: {workspaces.length}
                  </span>
                </div>
              </div>

              {/* Responsive Table UI */}
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse text-xs">
                  
                  <thead>
                    <tr className="bg-slate-900 text-white border-b border-slate-800 uppercase tracking-wider font-mono text-[9px]">
                      <th className="py-3 px-4">รูปภาพ & รายการชื่อ</th>
                      <th className="py-3 px-4">ประเภทสเปซ</th>
                      <th className="py-3 px-4 text-center">ความจุ (คน)</th>
                      <th className="py-3 px-4 text-right">ค่าเช่าต่อชั่วโมง</th>
                      <th className="py-3 px-4 text-center">สถานะห้องปัจจุบัน</th>
                      <th className="py-3 px-4 text-center">ปรับสถานะ (ว่าง-ไม่ว่าง)</th>
                      <th className="py-3 px-4 text-right">การจัดการดำเนินการ</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {workspaces.map((ws) => {
                      const isEditing = editingId === ws.id;
                      const isOccupied = ws.status === 'occupied';

                      return (
                        <tr key={ws.id} className="hover:bg-slate-50/50 transition-colors">
                          
                          {/* Image & Title details */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={ws.image}
                                alt={ws.name}
                                referrerPolicy="no-referrer"
                                className="w-12 h-12 object-cover rounded-xl shrink-0 border border-slate-200"
                              />
                              <div>
                                {isEditing ? (
                                  <div className="space-y-1">
                                    <input
                                      type="text"
                                      value={editName}
                                      onChange={(e) => setEditName(e.target.value)}
                                      className="border border-slate-350 px-2 py-1 rounded text-xs w-full max-w-xs font-semibold"
                                    />
                                    <input
                                      type="text"
                                      value={editDescription}
                                      onChange={(e) => setEditDescription(e.target.value)}
                                      className="border border-slate-200 px-2 py-0.5 rounded text-[10px] text-slate-400 w-full max-w-xs block"
                                    />
                                  </div>
                                ) : (
                                  <>
                                    <p className="font-bold text-slate-800 leading-tight">{ws.name}</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5 max-w-xs truncate">{ws.description}</p>
                                    <p className="text-[9px] text-slate-400 font-mono mt-0.5 bg-slate-100 inline-block px-1 rounded">ID: {ws.id}</p>
                                  </>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Space type */}
                          <td className="py-4 px-4 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${TYPE_COLORS[ws.type]}`}>
                              {TYPE_EMOJIS[ws.type]} {TYPE_LABELS[ws.type].split(' ')[0]}
                            </span>
                          </td>

                          {/* Capacity limit */}
                          <td className="py-4 px-4 text-center">
                            {isEditing ? (
                              <input
                                type="number"
                                min="1"
                                max="150"
                                value={editCapacity}
                                onChange={(e) => setEditCapacity(Number(e.target.value))}
                                className="border border-slate-350 px-2 py-1 rounded text-xs w-16 text-center"
                              />
                            ) : (
                              <span className="font-mono text-xs font-semibold">{ws.capacity} ที่นั่ง</span>
                            )}
                          </td>

                          {/* Price rate */}
                          <td className="py-4 px-4 text-right">
                            {isEditing ? (
                              <input
                                type="number"
                                min="10"
                                max="9999"
                                value={editPrice}
                                onChange={(e) => setEditPrice(Number(e.target.value))}
                                className="border border-slate-350 px-2 py-1 rounded text-xs w-20 text-right font-mono"
                              />
                            ) : (
                              <span className="font-mono font-bold text-slate-800 text-sm">฿{ws.pricePerHour}</span>
                            )}
                          </td>

                          {/* Currently status with live details */}
                          <td className="py-4 px-4 text-center whitespace-nowrap">
                            <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg ${
                              ws.status === 'occupied'
                                ? 'bg-rose-100 text-rose-800 border border-rose-250 animate-pulse'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-250'
                            }`}>
                              {ws.status === 'occupied' ? 'ไม่ว่าง (Reserved)' : 'ว่าง (Ready)'}
                            </span>
                            {ws.status === 'occupied' && ws.bookedDurationHours && (
                              <p className="text-[9px] text-slate-500 mt-1 font-mono">จองแล้ว ({ws.bookedDurationHours} ชม.)</p>
                            )}
                          </td>

                          {/* Instant toggle status from "ว่าง" to "ไม่ว่าง" manually */}
                          <td className="py-4 px-4 text-center">
                            <button
                              onClick={() => toggleOccupationByAdmin(ws)}
                              className={`p-1 px-2 rounded-lg text-[10px] font-bold transition-all border shrink-0 cursor-pointer ${
                                ws.status === 'occupied'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                              }`}
                              title={ws.status === 'occupied' ? "บังคับเปลี่ยนกลับเป็นว่าง" : "บังคับเปลี่ยนเป็นไม่ว่าง"}
                            >
                              {ws.status === 'occupied' ? '❌ ยกเลิกการจอง' : '⚙️ บังคับจองเต็ม'}
                            </button>
                          </td>

                          {/* Admin Action triggers */}
                          <td className="py-4 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {isEditing ? (
                                <>
                                  <button
                                    onClick={() => saveInlineEdit(ws.id)}
                                    className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer"
                                    title="บันทึกข้อมูลแก้ไขซ่อมแซม"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setEditingId(null)}
                                    className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-lg cursor-pointer"
                                    title="ยกเลิกแก้ไข"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => startInlineEdit(ws)}
                                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg cursor-pointer transition-colors border border-slate-200"
                                    title="กดเปิดแก้ไขข้อมูล"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={() => handleDeleteWorkspace(ws.id, ws.name)}
                                    className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg cursor-pointer transition-colors"
                                    title="ลบยูนิตนี้ออกจากคลังหลังบ้านถาวร"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>

                </table>
              </div>

              {/* Empty database state inside Back office table */}
              {workspaces.length === 0 && (
                <div className="p-16 text-center">
                  <p className="font-mono text-xs text-slate-400">--- ไม่มีระบบข้อมูลพื้นที่แชร์สเปซที่ว่างในเซิร์ฟเวอร์ ---</p>
                  <p className="text-[11px] text-slate-400 mt-1">กรุณากดปุ่ม "เพิ่มพืนที่เช่าใหม่เข้าระบบ" ด้านขวาบนเพื่อเติมข้อมูล</p>
                </div>
              )}

            </section>
            
            {/* Booking History View */}
            <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mt-6" id="backoffice-booking-history">
              <div className="p-5 border-b border-slate-150 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">ประวัติการจองและบันทึกหลังบ้าน (Booking History)</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">การจองทั้งหมดที่เกิดขึ้น (ดึงจาก Supabase)</p>
                </div>
              </div>

              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-900 text-white border-b border-slate-800 uppercase tracking-wider font-mono text-[9px]">
                      <th className="py-3 px-4">วันที่/เวลาที่จอง</th>
                      <th className="py-3 px-4">สเปซที่จอง</th>
                      <th className="py-3 px-4 text-center">ระยะเวลา</th>
                      <th className="py-3 px-4 text-right">ยอดรวม (บาท)</th>
                      <th className="py-3 px-4 text-center">สถานะการจอง</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bookingHistory.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-xs font-mono text-slate-400">--- ยังไม่มีประวัติการจองในระบบ ---</td>
                      </tr>
                    ) : (
                      bookingHistory.map((booking) => {
                        const isCancelled = booking.status === 'cancelled';
                        const isCompleted = booking.status === 'completed';
                        return (
                          <tr key={booking.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-3 px-4">
                              <span className="font-mono text-xs">{new Date(booking.created_at).toLocaleString('th-TH')}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-bold text-slate-700">{booking.workspace_name}</span>
                              <br/>
                              <span className="text-[9px] text-slate-400 font-mono">ID: {booking.workspace_id}</span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="font-mono">{booking.duration_hours} ชม.</span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className="font-bold text-slate-800">฿{booking.total_price}</span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                                isCancelled ? 'bg-rose-100 text-rose-700' :
                                isCompleted ? 'bg-slate-200 text-slate-600' :
                                'bg-emerald-100 text-emerald-700'
                              }`}>
                                {isCancelled ? 'ถูกยกเลิกแล้ว' : isCompleted ? 'เสร็จสมบูรณ์' : 'กำลังใช้งาน/จองล่วงหน้า'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </motion.div>
        )}

      </main>





      {/* Customer Booking Dialog Modal Frame */}
      <AnimatePresence>
        {bookingTarget && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 10 }}
              className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200"
              id="booking-modal"
            >
              {/* Header inside modal */}
              <div className="bg-slate-900 text-white p-6 relative">
                <button
                  type="button"
                  onClick={() => setBookingTarget(null)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors bg-white/10 p-1.5 rounded-full cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex gap-2 mb-2 items-center">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase border ${TYPE_COLORS[bookingTarget.type]}`}>
                    {TYPE_EMOJIS[bookingTarget.type]} {TYPE_LABELS[bookingTarget.type]}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">ID: {bookingTarget.id}</span>
                </div>

                <h3 className="text-lg md:text-xl font-bold font-display text-white pr-6">{bookingTarget.name}</h3>
                <p className="text-xs text-slate-400 mt-1">
                  กรุณากำหนดระยะเวลาและอัตราเช่าเพื่อส่งคำร้องขอจองคิวเข้าระบบส่วนกลาง
                </p>
              </div>

              {/* Modal Calculations Body */}
              <form onSubmit={executeBooking} className="p-6 space-y-5">
                
                {/* Duration select slider */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
                      จำนวนชั่วโมงการเช่า :
                    </label>
                    <span className="text-base font-extrabold text-teal-600 font-mono">
                      {bookHours} ชั่วโมง
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="1"
                      max="12"
                      step="1"
                      value={bookHours}
                      onChange={(e) => setBookHours(parseInt(e.target.value))}
                      className="flex-1 accent-teal-600 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setBookHours(prev => Math.max(1, prev - 1))}
                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold flex items-center justify-center cursor-pointer"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => setBookHours(prev => Math.min(12, prev + 1))}
                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold flex items-center justify-center cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    * ขั้นต่ำการเช่าตั้งแต่ 1 ชั่วโมง ถึงไม่เกิน 12 ชั่วโมงสิทธิ์สูงสุด
                  </p>
                </div>

                {/* Total Price Display */}
                <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl flex justify-between items-center">
                  <div className="text-xs font-bold text-slate-500 flex flex-col">
                    <span>ยอดรวมที่ต้องชำระ</span>
                    <span className="text-[10px] text-slate-400 font-mono">฿{bookingTarget.pricePerHour}/ชม.</span>
                  </div>
                  <div className="text-2xl font-extrabold text-teal-600 font-mono">
                    ฿{(bookHours * bookingTarget.pricePerHour).toLocaleString()}
                  </div>
                </div>

                {/* Simulation Speed Choices */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Zap className="w-4 h-4 text-amber-500 fill-amber-50 animate-bounce" />
                    <span className="text-xs font-bold text-slate-700">สปีดความเร็วจำลองคิว (สำหรับการสแกนทดสอบคิวตรวจงาน)</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setSpeedMode('real')}
                      className={`py-2 px-1 rounded-xl text-[10px] font-bold text-center transition-all cursor-pointer ${
                        speedMode === 'real'
                          ? 'bg-slate-950 text-white shadow-xs'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      ⏱️ เรียลไทม์จริง
                      <span className="block text-[8px] opacity-75 font-normal mt-0.5">1 ชม. = 1 ชั่วโมง</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSpeedMode('fast')}
                      className={`py-2 px-1 rounded-xl text-[10px] font-bold text-center transition-all cursor-pointer ${
                        speedMode === 'fast'
                          ? 'bg-indigo-600 text-indigo-50 shadow-xs'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      ⚡ สปีดนาที
                      <span className="block text-[8px] opacity-75 font-normal mt-0.5">1 ชม. = 1 นาที</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSpeedMode('lightning')}
                      className={`py-2 px-1 rounded-xl text-[10px] font-bold text-center transition-all cursor-pointer ${
                        speedMode === 'lightning'
                          ? 'bg-amber-500 text-amber-950 shadow-xs'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      🚀 สปีดแสงสุด
                      <span className="block text-[8px] opacity-75 font-normal mt-0.5 font-sans">1 ชม. = 10 วินาที</span>
                    </button>
                  </div>
                </div>

                {/* Price Receipt */}
                <div className="border-t border-slate-150 pt-3.5 space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">สรุปค่าใช้จ่ายเช่าสเปซ</span>
                  
                  <div className="text-xs text-slate-600 font-medium space-y-1">
                    <div className="flex justify-between">
                      <span>อัตราเช่าประจำยูนิต (฿{bookingTarget.pricePerHour}/ชม. x {bookHours} ชั่วโมง)</span>
                      <span className="font-mono text-slate-800">฿{estimatedCostValue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>ภาษีบริการจัดระเบียบ (VAT 7%)</span>
                      <span className="font-mono">฿{(estimatedCostValue * 0.07).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="border-t border-slate-100 my-2 pt-2.5 flex justify-between text-base font-extrabold text-slate-800">
                      <span>ยอดสุทธิรวมทั้งสิ้น (Net Estimated)</span>
                      <span className="font-mono text-teal-600">฿{(estimatedCostValue * 1.07).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setBookingTarget(null)}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 rounded-xl text-xs text-center cursor-pointer"
                  >
                    ยกเลิกปิดหน้าต่าง
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingBooking}
                    className="w-full bg-teal-600 hover:bg-teal-700 active:bg-teal-850 disabled:bg-slate-300 text-white font-bold py-2.5 rounded-xl text-xs text-center flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                  >
                    {isSubmittingBooking ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> กำลังบันทึกจอง...
                      </>
                    ) : (
                      'ยืนยันทำรายการจองทันที'
                    )}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
