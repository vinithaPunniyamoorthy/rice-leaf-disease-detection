# CropShield Rice Disease Detection - Complete Setup Guide

## 📋 PREREQUISITES

1. **XAMPP Installed** (with MySQL and Apache)
2. **Node.js Installed** (v14 or higher)
3. **Flutter Installed** (Latest stable version)
4. **Java JDK 17 or 21** for Android builds (see [Java setup](#java-jdk-for-android-builds) below)
5. **Physical Device or Emulator** for testing

---

## ☕ Java (JDK) for Android builds

Flutter Android builds require a **JDK 17 or 21** (not JDK 25). Set **JAVA_HOME** to your JDK root.

**Install JDK 21 (recommended):**
- Download: [Eclipse Temurin JDK 21 (Windows x64)](https://adoptium.net/temurin/releases/?version=21&os=windows&arch=x64)
- Run the installer. Note the install path (e.g. `C:\Program Files\Eclipse Adoptium\jdk-21.x.x-hotspot`).

**Set JAVA_HOME:**
1. **Windows:** Search **“Environment Variables”** → **Edit the system environment variables** → **Environment Variables**.
2. Under **User variables** (or **System variables**), click **New** (or edit **JAVA_HOME** if it exists).
3. Variable name: `JAVA_HOME`  
   Variable value: JDK root folder (the one that contains a `bin` folder), e.g.  
   `C:\Program Files\Eclipse Adoptium\jdk-21.0.5.11-hotspot`
4. Click **OK** on all dialogs.
5. **Restart the terminal** (and Cursor/IDE if you run Flutter from there).

**Verify:** In a new terminal run `echo $env:JAVA_HOME` (PowerShell) and confirm it shows the JDK path.

---

## 🗄️ STEP 1: DATABASE SETUP (XAMPP + phpMyAdmin)

### 1.1 Start XAMPP Services
1. Open **XAMPP Control Panel**
2. Start **Apache** server
3. Start **MySQL** server
4. Wait for both to show "Running" status (green)

### 1.2 Setup Database via phpMyAdmin

**Method 1: Using phpMyAdmin Interface**
1. Open browser and go to: `http://localhost/phpmyadmin`
2. Click on **"SQL"** tab at the top
3. Open the file: `Rice_disease/database/complete_setup.sql`
4. Copy the ENTIRE content
5. Paste into the SQL query box
6. Click **"Go"** button at the bottom
7. Wait for "Query executed successfully" message

**Method 2: Using MySQL Command Line**
```bash
# Navigate to MySQL bin directory
cd C:\xampp\mysql\bin

# Login to MySQL
mysql -u root -p
# (Press Enter when prompted for password - default is blank)

# Execute the setup script
source "C:/Users/vinit/OneDrive/Desktop/Rice_disease/database/complete_setup.sql"

# Verify
USE cropshield_db;
SHOW TABLES;
SELECT * FROM users;
```

### 1.3 Verify Database Setup
After running the SQL script, you should see:
- ✅ Database: `cropshield_db` created
- ✅ 4 Tables: `users`, `diseases`, `detections`, `feedback`
- ✅ 6 test users with different roles
- ✅ 6 disease records
- ✅ Sample detection history
- ✅ Sample feedback entries

**Test Login Credentials (All use password: `password123`)**
- **Farmer:** farmer@test.com / password123
- **Expert:** expert@test.com / password123
- **Admin:** admin@test.com / password123

---

## 🖥️ STEP 2: BACKEND SETUP (Node.js Server)

### 2.1 Install Dependencies
```bash
# Navigate to backend directory
cd C:\Users\vinit\OneDrive\Desktop\Rice_disease\backend

# Install all npm packages
npm install

# This installs: express, mysql2, bcryptjs, jsonwebtoken, cors, dotenv, multer
```

### 2.2 Verify `.env` File
The `.env` file should already exist with:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=cropshield_db
PORT=5000
JWT_SECRET=cropshield_secret_key_2024_secure
```

### 2.3 Start Backend Server
```bash
# Still in backend directory
npm start

# You should see:
# "Server is running on port 5000"
```

**Keep this terminal window open!** The backend must keep running.

### 2.4 Test Backend APIs

**Test 1: Check server is running**
- Open browser: `http://localhost:5000`
- Should see: "CropShield API is running..."

**Test 2: Test Registration (using Postman or browser console)**
```javascript
// Open browser console (F12) and run:
fetch('http://localhost:5000/api/auth/register', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    name: 'Test User',
    email: 'test@example.com',
    password: 'test123',
    phone: '1234567890',
    role: 'Farmer',
    region: 'Wet'
  })
})
.then(r => r.json())
.then(d => console.log(d))

// Expected response:
// { message: "User registered successfully", userId: <number>, success: true }
```

**Test 3: Test Login**
```javascript
fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    email: 'farmer@test.com',
    password: 'password123'
  })
})
.then(r => r.json())
.then(d => console.log(d))

// Expected response:
// { token: "...", user: {...}, success: true, message: "Login successful" }
```

---

## 📱 STEP 3: FLUTTER FRONTEND SETUP

### 3.1 Install Flutter Dependencies
```bash
# Navigate to Flutter project
cd C:\Users\vinit\OneDrive\Desktop\Rice_disease\frontend\cropshield_app

# Get Flutter packages
flutter pub get

# Clean and rebuild
flutter clean
flutter pub get
```

### 3.2 Run on Chrome (for quick testing)
```bash
# Make sure backend is running on port 5000
flutter run -d chrome
```

### 3.3 Run on Physical Device (Android)

**Enable USB Debugging on Phone:**
1. Go to **Settings → About Phone**
2. Tap **Build Number** 7 times (Developer mode enabled)
3. Go to **Settings → Developer Options**
4. Enable **USB Debugging**
5. Connect phone via USB cable
6. On phone, tap **"Allow"** when prompted

**Run the App:**
```bash
# List connected devices
flutter devices

# Run on specific device (replace with your device ID)
flutter run -d R58RB1S87GK

# Or just run and select device
flutter run
```

### 3.4 Run on Android Emulator
```bash
# Start emulator from Android Studio or:
flutter emulators --launch <emulator_id>

# Then run
flutter run
```

---

## ✅ STEP 4: TESTING THE COMPLETE APPLICATION

### 4.1 Test User Registration
1. Open the app
2. Click "Sign Up"
3. Fill in details:
   - Name: Test Farmer
   - Email: testfarmer@example.com
   - Phone: 9999999999
   - Role: Farmer
   - Region: Wet
   - Password: test123456
4. Click "Create Account"
5. Should see: "Account created! Please login."

### 4.2 Test User Login
1. On login screen
2. Enter: farmer@test.com
3. Password: password123
4. Click "Login"
5. Should navigate to Farmer Dashboard

### 4.3 Test Disease Detection (if implemented)
1. From Dashboard, click "Scan Crop"
2. Grant Camera/Gallery permission if prompted
3. Take/upload a rice leaf photo
4. View detection results
5. Check history in "My Detections"

---

## 🔧 TROUBLESHOOTING

### Issue 1: Backend not connecting
**Error:** `ERR_CONNECTION_REFUSED`
**Solution:**
- Verify backend is running: `npm start` in backend folder
- Check port 5000 is free: `netstat -ano | findstr :5000`
- Restart backend server

### Issue 2: Database connection failed
**Error:** `ER_ACCESS_DENIED_ERROR` or `ECONNREFUSED`
**Solution:**
- Verify MySQL is running in XAMPP
- Check `.env` file has correct credentials
- Re-run database setup SQL script
- Grant privileges: `GRANT ALL PRIVILEGES ON *.* TO 'root'@'localhost';`

### Issue 3: Registration returns 400 error
**Error:** 400 Bad Request
**Solution:**
- Check all required fields are filled
- Verify database has `region` column
- Check backend logs for specific error
- Re-run database setup script

### Issue 4: Flutter can't connect to API
**Error:** Connection timeout or network error
**Solution:**
- For Chrome: Use `http://localhost:5000/api`
- For Physical Device: Find PC IP and use `http://<PC_IP>:5000/api`
  ```bash
  # Find IP on Windows
  ipconfig
  # Look for IPv4 Address (e.g., 192.168.1.100)
  ```
- Update `lib/data/api_service.dart` with correct base URL

### Issue 5: 500 Server Error
**Solution:**
- Check backend terminal for error logs
- Verify database tables exist
- Check MySQL connection in XAMPP
- Restart backend: Stop (Ctrl+C) and `npm start`

---

## 📊 API ENDPOINTS REFERENCE

### Authentication
- **POST** `/api/auth/register` - Register new user
- **POST** `/api/auth/login` - User login

### Detection (requires authentication token)
- **POST** `/api/detections` - Upload image for detection
- **GET** `/api/detections` - Get user's detection history

---

## 🎯 SUCCESS CRITERIA CHECKLIST

- [ ] XAMPP running (Apache + MySQL = Green)
- [ ] Database `cropshield_db` created
- [ ] All 4 tables exist with data
- [ ] Test users can login (farmer@test.com / password123)
- [ ] Backend server running on port 5000
- [ ] Backend responds at http://localhost:5000
- [ ] Registration API works (returns userId)
- [ ] Login API works (returns token)
- [ ] Flutter app builds without errors
- [ ] App runs on Chrome/Emulator/Device
- [ ] Can register new user from app
- [ ] Can login with test credentials
- [ ] Dashboard loads after login

---

## 📞 DEFAULT TEST ACCOUNTS

| Email | Password | Role | Region |
|-------|----------|------|--------|
| farmer@test.com | password123 | farmer | Wet |
| expert@test.com | password123 | expert | Intermediate |
| admin@test.com | password123 | admin | Dry |
| raj@farmer.com | password123 | farmer | Wet |
| maria@farmer.com | password123 | farmer | Dry |
| chen@expert.com | password123 | expert | Intermediate |

---

## 🚀 QUICK START COMMANDS

```bash
# Terminal 1: Start Backend
cd C:\Users\vinit\OneDrive\Desktop\Rice_disease\backend
npm start

# Terminal 2: Start Flutter (Chrome)
cd C:\Users\vinit\OneDrive\Desktop\Rice_disease\frontend\cropshield_app
flutter run -d chrome

# Terminal 2: Start Flutter (Physical Device)
cd C:\Users\vinit\OneDrive\Desktop\Rice_disease\frontend\cropshield_app
flutter run -d R58RB1S87GK
```

---

## ✅ PROJECT STATUS: READY FOR TESTING

All backend bugs have been fixed. The application is now fully functional and ready for end-to-end testing.
