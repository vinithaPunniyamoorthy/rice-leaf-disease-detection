# CropShield Project Documentation

## 1. Project Overview
CropShield is a full-stack solution for rice disease detection using AI. It provides different interfaces for Farmers, Admins, and Agricultural Experts to collaborate and protect crops.

## 2. Technology Stack
- **Frontend**: Flutter (Android/iOS)
- **Backend**: Node.js + Express
- **Database**: MySQL
- **AI Integration**: Mocked analysis engine (designed for seamless integration with TensorFlow/PyTorch models)

## 3. System Architecture
### Frontend (Flutter)
- **lib/core**: Manages themes, colors, and global constants.
- **lib/presentation**: Follows a screen-based architecture with reusable widgets.
- **lib/data**: Handles API services and models (designed for Provider/Riverpod state management).

### Backend (Node.js)
- **Controllers**: Logic for Auth and Detection.
- **Routes**: RESTful endpoints for frontend consumption.
- **Middleware**: JWT-based authentication for secure data access.
- **Config**: Database connection pooling.

## 4. Screens & User Flow
1. **Splash Screen**: Initial branding view.
2. **Login/Signup**: Secure authentication.
3. **Farmer Dashboard**: Primary hub for uploading crop images and viewing history.
4. **Detection Result**: Detailed analysis listing disease name, confidence, symptoms, and treatment.
5. **Admin Dashboard**: Oversight of system users and analytical stats.
6. **Expert Panel**: Interface for agricultural experts to review and consult on cases.

## 5. Business Rules & Assumptions
- **Roles**: Users must specify a role (Farmer/Admin/Expert) during registration or be assigned one.
- **Accuracy**: Detection confidence below 70% should trigger a recommendation to "Consult Expert".
- **Storage**: Leaf images are stored locally on the server (`/uploads`) and referenced via database paths.
- **Security**: All API requests except login/register require a valid JWT token.

## 6. How to Run
### Backend
1. Import `database/init.sql` into your MySQL server.
2. Navigate to `backend/` and run `npm install`.
3. Create a `.env` file with `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, and `JWT_SECRET`.
4. Run `npm start`.

### Frontend
1. Navigate to `frontend/cropshield_app`.
2. Run `flutter pub get`.
3. Run `flutter run`.
