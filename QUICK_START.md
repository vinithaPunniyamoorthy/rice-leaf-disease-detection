# 🚀 Quick Start Guide - CropShield Rice Disease Detection

## Prerequisites Checklist
- [ ] XAMPP installed with MySQL and Apache
- [ ] Node.js installed (v14 or higher)  
- [ ] Flutter SDK installed
- [ ] Project downloaded at: `C:\Users\vinit\OneDrive\Desktop\Rice_disease`

---

## Step 1: Start XAMPP Services

1. Open **XAMPP Control Panel**
2. Click **Start** for **Apache** module
3. Click **Start** for **MySQL** module
4. Wait for both to show green "Running" status

---

## Step 2: Setup Database

### Option A: Using phpMyAdmin (Recommended)

1. Open browser → `http://localhost/phpmyadmin`
2. Click **SQL** tab at the top
3. Open file: `Rice_disease\database\complete_database_setup.sql`
4. **Copy entire contents** of the file
5. Paste into SQL query box
6. Click **Go** button
7. Wait for "success" message

### Option B: Using MySQL Command Line

```bash
cd C:\xampp\mysql\bin
mysql -u root
```

Then execute:
```sql
source "C:/Users/vinit/OneDrive/Desktop/Rice_disease/database/complete_database_setup.sql";
```

### ✅ Verify Database Setup

In phpMyAdmin or MySQL command line:
```sql
USE cropshield_db;
SHOW TABLES;
SELECT COUNT(*) FROM users;  -- Should return 8
```

---

## Step 3: Start Backend Server

```bash
# Open terminal/PowerShell
cd C:\Users\vinit\OneDrive\Desktop\Rice_disease\backend

# Install dependencies (if first time)
npm install

# Verify database connection
node verify_database.js

# Start the server
npm start
```

**Expected output:**
```
Server is running on port 5000 (accessible on 0.0.0.0)
```

**Test server:** Open browser → `http://localhost:5000` (should see "CropShield API is running...")

**Keep this terminal open** - the backend must stay running!

---

## Step 4: Run Flutter App

### For Chrome (Quick Testing)

```bash
# Open NEW terminal/PowerShell  
cd C:\Users\vinit\OneDrive\Desktop\Rice_disease\frontend\cropshield_app

# Get dependencies
flutter pub get

# Run in Chrome
flutter run -d chrome
```

### For Physical Android Device

1. **Enable Developer Options on Phone:**
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times
   - Go back → Developer Options
   - Enable "USB Debugging"

2. **Connect and Run:**
```bash
# Connect phone via USB

# List devices
flutter devices

# Run on device
flutter run -d <device_id>

# Or if only one device:
flutter run
```

---

## Step 5: Test the Application

### Test Login
1. Open the app
2. Navigate to Login screen
3. **Email:** `farmer@test.com`
4. **Password:** `password123`
5. Click Login
6. ✅ Should navigate to Farmer Dashboard

### Test Other Roles
- **Field Expert:** `expert@test.com` / `password123`
- **Admin:** `admin@test.com` / `password123`

### Test Registration
1. Go to Sign Up screen
2. Fill all fields with valid data
3. Create account
4. Check email for verification link
5. Click verification link
6. Login with new credentials

---

## 🔧 Troubleshooting

### ❌ "Connection Refused" Error
**Problem:** Flutter can't connect to backend  
**Solution:**
1. Verify backend is running (`npm start`)
2. Check backend shows: "Server is running on port 5000"
3. For physical device, update `api_service.dart` baseUrl to use PC's IP address

### ❌ Database Connection Error
**Problem:** Backend can't connect to database  
**Solution:**
1. Verify MySQL is running in XAMPP (green status)
2. Run verification script: `node verify_database.js`
3. Check `.env` file has correct database name: `cropshield_db`
4. Re-run database setup SQL script

### ❌ Registration/Login Returns 400/401 Errors
**Problem:** API returning errors  
**Solution:**
1. Check backend terminal for error logs
2. Verify database tables exist (see Step 2 verification)
3. Check all required fields are filled in frontend

### ❌ "Can't find module" in Backend
**Problem:** Missing Node.js dependencies  
**Solution:**
```bash
cd C:\Users\vinit\OneDrive\Desktop\Rice_disease\backend
npm install
```

---

## 📋 Test Accounts

All accounts use password: **password123**

| Email | Role | Purpose |
|-------|------|---------|
| farmer@test.com | Farmer | Primary farmer testing |
| expert@test.com | Field Expert | Expert features testing |
| admin@test.com | Admin | Admin features testing |
| raj@farmer.com | Farmer | Additional farmer |
| maria@farmer.com | Farmer | Additional farmer |

---

## ✅ Success Checklist

Before testing, ensure:
- [ ] XAMPP MySQL shows green "Running" status
- [ ] Database `cropshield_db` exists
- [ ] Backend terminal shows "Server is running on port 5000"
- [ ] Browser shows "CropShield API is running..." at `http://localhost:5000`
- [ ] Flutter app builds without errors
- [ ] Can login with test credentials
- [ ] Dashboard loads after login

---

## 📞 Need Help?

If issues persist:
1. Check backend terminal for error messages
2. Check browser console for frontend errors (F12)
3. Verify all steps above completed correctly
4. Run database verification: `node verify_database.js`

---

**Database:** `cropshield_db`  
**Backend Port:** `5000`  
**API Base URL:** `http://127.0.0.1:5000/api`
