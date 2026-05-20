-- นำ SQL คำสั่งนี้ไปรันในเมนู "SQL Editor" บน Supabase Dashboard นะครับ

-- (ตัวเลือก) หากเคยสร้างตารางไปแล้ว จะทำการลบทิ้งก่อนเพื่อสร้างใหม่ให้โครงสร้างสมบูรณ์
DROP TABLE IF EXISTS public.bookings;
DROP TABLE IF EXISTS public.workspaces;

CREATE TABLE public.bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    workspace_id TEXT NOT NULL,
    workspace_name TEXT NOT NULL,
    duration_hours NUMERIC NOT NULL,
    price_per_hour NUMERIC NOT NULL,
    total_price NUMERIC NOT NULL,
    
    booked_at TIMESTAMP WITH TIME ZONE NOT NULL,
    booked_until TIMESTAMP WITH TIME ZONE NOT NULL,
    speed_mode TEXT,
    status TEXT DEFAULT 'active'
);

-- (Option) เพิ่ม RLS (Row Level Security) นโยบายความปลอดภัย
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- อนุญาตให้ Insert ข้อมูลได้ (สมมติให้ Insert ได้แบบ public เพื่อให้ server.ts ที่ใช้ anon_key หรือ service_key ใช้งานได้)
CREATE POLICY "Allow anonymous inserts" ON public.bookings
    FOR INSERT 
    TO public
    WITH CHECK (true);

-- อนุญาตให้ทุกคนอ่านข้อมูลได้
CREATE POLICY "Allow public read access" ON public.bookings
    FOR SELECT
    TO public
    USING (true);

-- อนุญาตให้ Update ข้อมูลได้
DROP POLICY IF EXISTS "Allow public update access" ON public.bookings;
CREATE POLICY "Allow public update access" ON public.bookings
    FOR UPDATE
    TO public
    USING (true)
    WITH CHECK (true);

-- ตารางอ้างอิงพื้นที่เช่าห้อง/โต๊ะ
CREATE TABLE public.workspaces (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    capacity INTEGER NOT NULL,
    price_per_hour NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'available',
    image TEXT,
    description TEXT,
    amenities TEXT[] DEFAULT '{}',
    booked_until TIMESTAMP WITH TIME ZONE,
    booked_duration_hours NUMERIC,
    booked_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous full access to workspaces" ON public.workspaces
    FOR ALL 
    TO public
    USING (true)
    WITH CHECK (true);
