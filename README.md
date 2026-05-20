# Workspace Booking System

ระบบบริหารจัดการพื้นที่เช่า (Workspace) และห้องประชุมแบบเรียลไทม์ (Real-time Booking System)

## ฟีเจอร์หลัก (Features)
- **ระบบทำงานแบบ 2 ฝั่ง (Customer / Admin):** แบ่งแยกมุมมองการใช้งานระหว่างลูกค้าและผู้ดูแลหลังบ้าน
- **ดูสถานะห้องแบบเรียลไทม์:** ทราบได้ทันทีว่าห้องไหนว่าง หรือกำลังใช้งานอยู่
- **ระบบคำนวณราคา:** คำนวณราคารวมจากการจองระยะเวลาต่างๆ อัตโนมัติ
- **ระบบจัดการสำหรับแอดมิน (Back Office):** ควบคุมการเปิด-ปิดล็อกห้อง, ยกเลิกการจอง หรือปรับสถานะการจองได้ทันที
- **บันทึกประวัติการจองและสถิติ (Supabase):** เชื่อมต่อฐานข้อมูล Supabase เพื่อเก็บประวัติการจอง ยอดขาย และคำนวณรายได้ทั้งหมด

## การติดตั้งและการรัน (Installation & Setup)

โปรเจกต์นี้ทำงานด้วย Node.js และจัดการแพ็กเกจด้วย npm ส่วนฝั่ง Frontend ใช้ React + Vite และ Backend ใช้ Express.js

### 1. ติดตั้งแพ็กเกจ
```bash
npm install
```

### 2. ตั้งค่า Environment Variables
ให้สร้างไฟล์ `.env` ที่ root ของโปรเจกต์ (หรือคัดลอกไฟล์ `.env.example` มาเป็น `.env` ถ้ามี) และใส่ค่าเหล่านี้ (สำหรับการเชื่อมต่อฐานข้อมูล):
```env
SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```
> สำหรับฐานข้อมูลในโปรเจกต์นี้จะใช้ Supabase กรุณา setup หน้าตารางด้วยไฟล์ `supabase-schema.sql` ใน Supabase ของคุณเพื่อสร้าง Table `workspaces` และ `bookings`

### 3. รันโปรเจกต์โหมดพัฒนา (Development)
```bash
npm run dev
```
ระบบจะเริ่มต้นใช้งานที่พอร์ต 3000 โดยสามารถเข้าถึงได้ผ่านเบราว์เซอร์:
- **หน้าหลัก/หน้าลูกค้า:** `http://localhost:3000/?role=customer`
- **จัดการหลังบ้าน:** `http://localhost:3000/?role=admin`

### 4. การ Build สำหรับ Production
```bash
npm run build
npm start
```

## ข้อมูลเพิ่มเติม 
ระบบนี้ใช้ **Tailwind CSS** ในการจัดการสไตล์ต่างๆ และใช้ **Lucide React** สำหรับส่วนของไอคอนทั้งหมด
