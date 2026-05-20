import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { Workspace, WorkspaceType } from "./src/types";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

// In-Memory Database for workspaces
const defaultWorkspaces: Workspace[] = [
  {
    id: "ws-1",
    name: "A101 - Smart Desk (โซนระเบียง)",
    type: "hot-desk",
    capacity: 1,
    pricePerHour: 60,
    status: "available",
    image: "https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?w=800&auto=format&fit=crop&q=80",
    bookedUntil: null,
    bookedDurationHours: null,
    bookedAt: null,
    amenities: ["WiFi ความเร็วสูง", "ปลั๊กไฟส่วนตัว", "ชามะนาว & กาแฟฟรี", "เก้าอี้ Ergonomic พรีเมียม"],
    description: "โต๊ะทำงานเดี่ยวบรรยากาศเงียบสงบริบระเบียงรับแสงธรรมชาติ เหมาะสำหรับผู้ที่ต้องการสมาธิสูงและการทำงานส่วนตัว"
  },
  {
    id: "ws-2",
    name: "A102 - Creative Desk Cozy (โซนริมสวน)",
    type: "hot-desk",
    capacity: 2,
    pricePerHour: 80,
    status: "available",
    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&auto=format&fit=crop&q=80",
    bookedUntil: null,
    bookedDurationHours: null,
    bookedAt: null,
    amenities: ["WiFi ความเร็วสูง", "แท่นชาร์จไร้สาย", "วิวสวนหย่อมรอบอาคาร", "สิทธิ์เข้าโซน Pantry"],
    description: "โต๊ะทำงานสองที่นั่งริมกระจกบานใหญ่ มองเห็นวิวสวนสีเขียวสะบายตา เหมาะสำหรับนั่งคุยงานเป็นคู่หรือคิดงานสร้างสรรค์"
  },
  {
    id: "ws-3",
    name: "M201 - Serene Room (ห้องประชุมสไตล์มินิมอล)",
    type: "meeting-room",
    capacity: 4,
    pricePerHour: 250,
    status: "available",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80",
    bookedUntil: null,
    bookedDurationHours: null,
    bookedAt: null,
    amenities: ["Smart TV ขนาด 55 นิ้ว", "กระดานไวท์บอร์ดกระจก", "พัดลมฟอกอากาศ Dyson", "เครื่องปรับอากาศแยกส่วน"],
    description: "ห้องประชุมขนาดเล็ก ตกแต่งสไตล์มินิมอลอบอุ่น เพียบพร้อมด้วยอุปกรณ์นำเสนองานและการเชื่อมต่อไร้สายสำหรับกลุ่มแฮกกาธอนขนาดย่อม"
  },
  {
    id: "ws-4",
    name: "M202 - Summit Lounge (ห้องประชุมใหญ่วิลล่า)",
    type: "meeting-room",
    capacity: 12,
    pricePerHour: 500,
    status: "available",
    image: "https://images.unsplash.com/photo-1517502884422-41eaaced0168?w=800&auto=format&fit=crop&q=80",
    bookedUntil: null,
    bookedDurationHours: null,
    bookedAt: null,
    amenities: ["ระบบโปรเจคเตอร์ 4K", "กล้อง Conference Cam 360", "ไมโครโฟนรอบทิศทาง", "เครื่องชงกาแฟ Espresso ในห้อง"],
    description: "ห้องประชุมระดับผู้บริหาร รองรับการประชุมทีมขนาดใหญ่และการจัดประชุมทางไกลผ่านระบบเสียง-ภาพระดับไฮเอนด์"
  },
  {
    id: "ws-5",
    name: "P301 - Loft Executive Suite (ออฟฟิศส่วนตัว)",
    type: "private-office",
    capacity: 6,
    pricePerHour: 400,
    status: "available",
    image: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=800&auto=format&fit=crop&q=80",
    bookedUntil: null,
    bookedDurationHours: null,
    bookedAt: null,
    amenities: ["ระบบสแกนลายนิ้วมือ", "ตู้ล็อกเกอร์เอกสารส่วนตัว", "พอร์ตอินเทอร์เน็ตความเร็วสูง LAN", "เครื่องฟอกอากาศ PM2.5"],
    description: "ห้องทำงานแบบปิดผนึกกระจกตัดแสง สำหรับสตาร์ทอัพที่ต้องการความคุ้มครองและพื้นที่เฉพาะตัวในการพัฒนาซอฟต์แวร์"
  },
  {
    id: "ws-6",
    name: "E401 - Genesis Event Space (ฮอลล์สัมมนา)",
    type: "event-space",
    capacity: 35,
    pricePerHour: 1200,
    status: "available",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80",
    bookedUntil: null,
    bookedDurationHours: null,
    bookedAt: null,
    amenities: ["ไมโครโฟนไร้สาย 4 ตัว", "เครื่องเสียงสเตอริโอ 200W", "เวทียกพื้นและระดับแสงปรับได้", "บาร์น้ำดื่มสำหรับจัดจัดเลี้ยง"],
    description: "พื้นที่เอนกประสงค์ขนาดใหญ่สำหรับกวดวิชา สัมมนาเชิงปฏิบัติการ นำเสนอผลงานขายไอเดียหรือจัดเวิร์กช็อปออฟไลน์เต็มรูปแบบ"
  }
];

let workspaces: Workspace[] = [...defaultWorkspaces];

// Helper to sync single workspace to supabase
function syncWorkspaceToSupabase(ws: Workspace) {
  if (!supabase) return;
  supabase.from("workspaces").upsert({
    id: ws.id,
    name: ws.name,
    type: ws.type,
    capacity: ws.capacity,
    price_per_hour: ws.pricePerHour,
    status: ws.status,
    image: ws.image,
    description: ws.description,
    amenities: ws.amenities,
    booked_until: ws.bookedUntil,
    booked_duration_hours: ws.bookedDurationHours,
    booked_at: ws.bookedAt
  }).then(({ error }) => {
    if (error) console.error(`Failed to sync workspace ${ws.id}:`, error.message);
  });
}

// Helper to check and release expired bookings
function refreshBookingStatuses() {
  const now = new Date();
  let updated = false;

  workspaces = workspaces.map((ws) => {
    if (ws.status === "occupied" && ws.bookedUntil) {
      const untilDate = new Date(ws.bookedUntil);
      if (now >= untilDate) {
        updated = true;
        const newWs: Workspace = {
          ...ws,
          status: "available",
          bookedUntil: null, // we can use null, but typings might need attention, wait, type is string | Date | null.
          bookedDurationHours: null,
          bookedAt: null,
        };
        syncWorkspaceToSupabase(newWs);
        if (supabase) {
          supabase.from("bookings").update({ status: 'completed' })
            .eq("workspace_id", ws.id)
            .or("status.eq.active,status.is.null")
            .then(({ error }) => {
              if (error) console.error("Failed to complete booking:", error.message);
            });
        }
        return newWs;
      }
    }
    return ws;
  });

  return updated;
}

// 1. Get all workspaces with actual expiration refresh
app.get("/api/workspaces", (req, res) => {
  refreshBookingStatuses();
  res.json(workspaces);
});

// 2. Book a workspace
app.post("/api/workspaces/:id/book", (req, res) => {
  refreshBookingStatuses();
  
  const { id } = req.params;
  const { durationHours, speedMode } = req.body; // speedMode: 'real' | 'fast' (minutes) | 'lightning' (seconds)
  
  const wsIndex = workspaces.findIndex((w) => w.id === id);
  if (wsIndex === -1) {
    return res.status(404).json({ success: false, message: "ไม่พบพื้นที่เช่าที่ต้องการจอง" });
  }

  const workspace = workspaces[wsIndex];

  // Prevent double booking
  if (workspace.status === "occupied") {
    return res.status(400).json({ 
      success: false, 
      message: `ไม่สามารถทำการจองได้ เนื่องจากพื้นที่ ${workspace.name} ถูกจองไปแล้วโดยผู้ใช้อื่น` 
    });
  }

  if (!durationHours || typeof durationHours !== "number" || durationHours <= 0) {
    return res.status(400).json({ 
      success: false, 
      message: "กรุณาระบุจำนวนชั่วโมงที่ถูกต้อง (ต้องมากกว่า 0)" 
    });
  }

  const bookedAt = new Date();
  let bookedUntil = new Date();

  // Calculate booking end time based on simulation modes
  if (speedMode === "lightning") {
    // 1 Hour = 10 Seconds
    bookedUntil = new Date(bookedAt.getTime() + durationHours * 10 * 1000);
  } else if (speedMode === "fast") {
    // 1 Hour = 1 Minute
    bookedUntil = new Date(bookedAt.getTime() + durationHours * 60 * 1000);
  } else {
    // Real-time: 1 Hour = 3600 Seconds
    bookedUntil = new Date(bookedAt.getTime() + durationHours * 3600 * 1000);
  }

  // Update in state
  const updatedWs = {
    ...workspace,
    status: "occupied" as const,
    bookedAt: bookedAt.toISOString(),
    bookedUntil: bookedUntil.toISOString(),
    bookedDurationHours: durationHours,
  };
  workspaces[wsIndex] = updatedWs;
  syncWorkspaceToSupabase(updatedWs);

  // Push booking record to Supabase asynchronously
  if (supabase) {
    supabase.from("bookings").insert([{
      workspace_id: workspace.id,
      workspace_name: workspace.name,
      duration_hours: durationHours,
      price_per_hour: workspace.pricePerHour,
      total_price: workspace.pricePerHour * durationHours,
      booked_at: bookedAt.toISOString(),
      booked_until: bookedUntil.toISOString(),
      speed_mode: speedMode,
      status: 'active'
    }]).then(({ error }) => {
      if (error) {
        console.error("Failed to insert booking to Supabase:", error.message);
      } else {
        console.log(`Booking for ${workspace.name} saved to Supabase.`);
      }
    });
  }

  res.json({
    success: true,
    message: `ทำการจอง ${workspace.name} สำเร็จเรียบร้อยแล้ว`,
    workspace: workspaces[wsIndex],
  });
});

app.get("/api/bookings", async (req, res) => {
  if (!supabase) {
    return res.json({ bookings: [] });
  }

  try {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50); // Get latest 50 bookings

    if (error) throw error;

    res.json({ bookings: data });
  } catch (error: any) {
    console.error("Error fetching bookings:", error.message);
    res.json({ bookings: [] });
  }
});

// 2.5 Get stats from Supabase
app.get("/api/stats", async (req, res) => {
  if (!supabase) {
    return res.json({ revenue: 0, count: 0, source: "mock" });
  }

  try {
    const { data, error } = await supabase
      .from("bookings")
      .select("total_price")
      .neq("status", "cancelled");

    if (error) throw error;

    const count = data.length;
    const revenue = data.reduce((acc: number, row: any) => acc + (row.total_price || 0), 0);

    res.json({ revenue, count, source: "supabase" });
  } catch (error: any) {
    console.error("Error fetching stats:", error.message);
    res.json({ revenue: 0, count: 0, source: "error" });
  }
});

// 3. Manually release a booking
app.post("/api/workspaces/:id/release", (req, res) => {
  const { id } = req.params;
  const wsIndex = workspaces.findIndex((w) => w.id === id);
  
  if (wsIndex === -1) {
    return res.status(404).json({ success: false, message: "ไม่พบพื้นที่ดังกล่าว" });
  }

  const workspace = workspaces[wsIndex];
  workspaces[wsIndex] = {
    ...workspace,
    status: "available",
    bookedUntil: null,
    bookedDurationHours: null,
    bookedAt: null,
  };
  syncWorkspaceToSupabase(workspaces[wsIndex]);

  if (supabase) {
    supabase.from("bookings").update({ status: 'cancelled' })
      .eq("workspace_id", id)
      .or("status.eq.active,status.is.null")
      .then(({ error }) => {
        if (error) console.error("Failed to cancel booking:", error.message);
      });
  }

  res.json({
    success: true,
    message: `คืนสถานะห้องว่างสำหรับ ${workspace.name} แล้ว`,
    workspace: workspaces[wsIndex],
  });
});

// 4. [Admin Back-Office] Update workspace properties (including direct status toggle)
app.post("/api/workspaces/:id/admin", (req, res) => {
  const { id } = req.params;
  const { name, status, pricePerHour, capacity, description, amenities } = req.body;
  
  const wsIndex = workspaces.findIndex((w) => w.id === id);
  if (wsIndex === -1) {
    return res.status(404).json({ success: false, message: "ไม่พบพื้นที่พนักงานหลัก" });
  }

  const workspace = workspaces[wsIndex];
  
  // Handle manual state change
  let updatedBookedUntil = workspace.bookedUntil;
  let updatedBookedAt = workspace.bookedAt;
  let updatedDuration = workspace.bookedDurationHours;

  if (status === "occupied" && workspace.status === "available") {
    // If Admin manually sets to Occupied, simulate 2 Hr lightning booking
    const now = new Date();
    updatedBookedAt = now.toISOString();
    updatedBookedUntil = new Date(now.getTime() + 2 * 10 * 1000).toISOString(); // 20 seconds Lightning Simulation
    updatedDuration = 2;
    
    if (supabase) {
      supabase.from("bookings").insert([{
        workspace_id: workspace.id,
        workspace_name: workspace.name,
        duration_hours: 2,
        price_per_hour: workspace.pricePerHour,
        total_price: workspace.pricePerHour * 2,
        booked_at: updatedBookedAt,
        booked_until: updatedBookedUntil,
        speed_mode: "lightning",
        status: "active"
      }]).then();
    }
  } else if (status === "available" && workspace.status === "occupied") {
    updatedBookedAt = null;
    updatedBookedUntil = null;
    updatedDuration = null;
    
    if (supabase) {
      supabase.from("bookings").update({ status: 'cancelled' })
        .eq("workspace_id", id)
        .or("status.eq.active,status.is.null")
        .then(({ error }) => {
          if (error) console.error("Failed to cancel booking (admin):", error.message);
        });
    }
  } else if (status === "available") {
    updatedBookedAt = null;
    updatedBookedUntil = null;
    updatedDuration = null;
  }

  workspaces[wsIndex] = {
    ...workspace,
    name: name !== undefined ? name : workspace.name,
    status: status !== undefined ? status : workspace.status,
    pricePerHour: pricePerHour !== undefined ? Number(pricePerHour) : workspace.pricePerHour,
    capacity: capacity !== undefined ? Number(capacity) : workspace.capacity,
    description: description !== undefined ? description : workspace.description,
    amenities: amenities !== undefined ? amenities : workspace.amenities,
    bookedAt: updatedBookedAt,
    bookedUntil: updatedBookedUntil,
    bookedDurationHours: updatedDuration,
  };
  syncWorkspaceToSupabase(workspaces[wsIndex]);

  res.json({
    success: true,
    message: `อัปเดตข้อมูลพื้นที่ "${workspaces[wsIndex].name}" สิทธิ์ผู้บริหารเสร็จสิ้น`,
    workspace: workspaces[wsIndex],
  });
});

// 5. [Admin Back-Office] Create new workspace zone dynamically
app.post("/api/workspaces/create", (req, res) => {
  const { name, type, pricePerHour, capacity, description, amenities, image } = req.body;

  if (!name || !type || !pricePerHour || !capacity) {
    return res.status(400).json({ success: false, message: "กรุณากรอกข้อมูลสำคัญให้ครบถ้วน" });
  }

  const defaultImages: Record<WorkspaceType, string> = {
    "hot-desk": "https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?w=800&auto=format&fit=crop&q=80",
    "meeting-room": "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80",
    "private-office": "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=800&auto=format&fit=crop&q=80",
    "event-space": "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80"
  };

  const newId = `ws-${workspaces.length + Date.now().toString().slice(-4)}`;

  const newWorkspace: Workspace = {
    id: newId,
    name,
    type,
    capacity: Number(capacity),
    pricePerHour: Number(pricePerHour),
    status: "available",
    image: image || defaultImages[type as WorkspaceType] || defaultImages["hot-desk"],
    bookedUntil: null,
    bookedDurationHours: null,
    bookedAt: null,
    amenities: Array.isArray(amenities) ? amenities : ["WiFi ความเร็วสูง", "ปลั๊กไฟส่วนตัว"],
    description: description || "ไม่มีรายละเอียดเพิ่มเติมสำหรับพื้นที่อเนกประสงค์แห่งใหม่นี้"
  };

  workspaces.push(newWorkspace);
  syncWorkspaceToSupabase(newWorkspace);

  res.json({
    success: true,
    message: `เพิ่มพื้นที่เช่าระบุชื่อ "${name}" เข้าระบบสำเร็จ`,
    workspace: newWorkspace
  });
});

// 6. [Admin Back-Office] Delete a workspace zone
app.post("/api/workspaces/:id/delete", (req, res) => {
  const { id } = req.params;
  const wsIndex = workspaces.findIndex(w => w.id === id);

  if (wsIndex === -1) {
    return res.status(404).json({ success: false, message: "ไม่พบพื้นที่ที่ท่านพยายามลบ" });
  }

  const removedName = workspaces[wsIndex].name;
  workspaces.splice(wsIndex, 1);
  if (supabase) {
    supabase.from("workspaces").delete().eq("id", id).then(({ error }) => {
      if (error) console.error(`Failed to delete workspace ${id} from Supabase:`, error.message);
    });
  }

  res.json({
    success: true,
    message: `ลบพื้นที่สำเร็จเรียบร้อย ลบช่อง "${removedName}" แล้ว`
  });
});

// Initialize data from Supabase
async function initWorkspaces() {
  if (!supabase) return;
  try {
    const { data, error } = await supabase.from("workspaces").select("*");
    if (error) {
      console.error("Failed to fetch workspaces from Supabase:", error.message);
      return;
    }
    
    if (!data || data.length === 0) {
      console.log("No workspaces found in Supabase, seeding default workspaces...");
      const itemsToInsert = defaultWorkspaces.map(ws => ({
        id: ws.id,
        name: ws.name,
        type: ws.type,
        capacity: ws.capacity,
        price_per_hour: ws.pricePerHour,
        status: ws.status,
        image: ws.image,
        description: ws.description,
        amenities: ws.amenities,
        booked_until: ws.bookedUntil,
        booked_duration_hours: ws.bookedDurationHours,
        booked_at: ws.bookedAt
      }));
      await supabase.from("workspaces").insert(itemsToInsert);
      workspaces = [...defaultWorkspaces];
    } else {
      console.log(`Loaded ${data.length} workspaces from Supabase.`);
      workspaces = data.map(row => ({
        id: row.id,
        name: row.name,
        type: row.type as WorkspaceType,
        capacity: row.capacity,
        pricePerHour: row.price_per_hour,
        status: row.status as "available" | "occupied",
        image: row.image,
        description: row.description,
        amenities: row.amenities,
        bookedUntil: row.booked_until,
        bookedDurationHours: row.booked_duration_hours,
        bookedAt: row.booked_at
      }));
    }
  } catch (err: any) {
    console.error("Init Error:", err.message);
  }
}

// Serve frontend React application via Vite Dev Server
async function start() {
  await initWorkspaces();
  
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] running on http://localhost:${PORT}`);
  });
}

start();
