#!/bin/bash
# === "สุดยอดใบสั่งงาน" สำหรับการ Deploy โปรเจกต์สู่โลกออนไลน์ ===
# เวอร์ชันนี้จะสร้าง .gitignore ให้เองโดยอัตโนมัติ เพื่อแก้ปัญหา Permission Denied

# หยุดการทำงานทันทีหากมีคำสั่งใดล้มเหลว
set -e

# --- ข้อมูลโปรเจกต์ ---
GITHUB_REPO_URL="https://github.com/elmacca318/Autodeploy-health-planner.git"

# --- เริ่มการทำงาน ---

echo "🚀 เริ่มกระบวนการ Deploy สู่โลกออนไลน์ (ฉบับสมบูรณ์ที่สุด)..."
echo "============================================================"

# ขั้นตอน A: สร้าง "ใบสั่งเมิน" (.gitignore) ก่อนเป็นอันดับแรก!
echo ". (A/B) กำลังสร้างไฟล์ .gitignore เพื่อป้องกันปัญหา Permission Denied..."
cat << EOF > .gitignore
# โฟลเดอร์เก็บไลบรารีทั้งหมด (ห้ามอัปโหลดเด็ดขาด!)
node_modules

# ไฟล์ระบบปฏิบัติการ
.DS_Store

# โฟลเดอร์ที่โปรแกรมสร้างขึ้นตอน Build
dist

# ไฟล์ที่เก็บข้อมูลลับ เช่น API Key
.env
.env.local

# ไฟล์ Log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# รายการสำหรับแก้ปัญหา Permission Denied
[Cc]loud[Ss]torage
.tmp
EOF
echo "    -> .gitignore ถูกสร้างเรียบร้อยแล้ว"


# ขั้นตอน B: เริ่มกระบวนการอัปโหลดโค้ดสู่ GitHub
echo ". (B/B) กำลังเริ่มกระบวนการอัปโหลดโค้ด..."

# 0. ทำความสะอาดค่า Git เก่า (ถ้ามี)
if [ -d ".git" ]; then
  echo "    .(0/5) พบค่า Git เก่า... กำลังลบทิ้งเพื่อเริ่มต้นใหม่"
  rm -rf .git
fi

# 1. เริ่มต้น Git Repository ใหม่
echo "    .(1/5) กำลังเริ่มต้น Git Repository ที่สะอาด..."
git init

# 2. ตั้งค่าเส้นทางหลักเป็น 'main'
echo "    .(2/5) กำลังตั้งค่าเส้นทางหลักเป็น 'main'..."
git branch -M main

# 3. เพิ่มไฟล์ทั้งหมด (ตอนนี้จะปลอดภัยแล้วเพราะมี .gitignore)
echo "    .(3/5) กำลังเตรียมไฟล์โปรเจกต์ทั้งหมด..."
git add .

# 4. บันทึกการเปลี่ยนแปลง
echo "    .(4/5) กำลังบันทึกเวอร์ชันโปรเจกต์..."
git commit -m "Initial deployment with automated gitignore script"

# 5. เชื่อมต่อและส่งโค้ดขึ้น GitHub
echo "    .(5/5) กำลังเชื่อมต่อและส่งโค้ดขึ้น GitHub (โปรดเตรียม Token)..."
git remote remove origin 2>/dev/null || true
git remote add origin $GITHUB_REPO_URL
git push -u origin main --force

echo "============================================================"
echo "✅ อัปโหลดโค้ดสู่ GitHub เรียบร้อยแล้ว!"
echo "🎉 สำเร็จ! ตอนนี้คุณพร้อมที่จะไปที่ Netlify เพื่อ Deploy ได้เลย!"