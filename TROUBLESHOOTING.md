# TROUBLESHOOTING GUIDE

## Current Issue
Getting 404 error when trying to register. The Network tab shows request to just "register" instead of full URL.

## Quick Fix - Complete Restart

### Step 1: Stop Both Servers
1. In backend terminal: Press `Ctrl + C`
2. In frontend terminal: Press `Ctrl + C`

### Step 2: Clear Vite Cache
```bash
cd frontend
rm -rf node_modules/.vite
rm -rf dist
```

Or on Windows PowerShell:
```powershell
cd frontend
Remove-Item -Recurse -Force node_modules\.vite -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
```

### Step 3: Restart Backend
```bash
cd backend
npm run dev
```
Wait for "MongoDB connected successfully"

### Step 4: Restart Frontend
```bash
cd frontend
npm run dev
```
Wait for "ready in XXX ms"

### Step 5: Test in Browser
1. Close ALL browser tabs with localhost:5173
2. Open NEW incognito window (Ctrl + Shift + N)
3. Go to http://localhost:5173
4. Try to register

## Alternative: Direct API Test

Open browser console and run:
```javascript
fetch('http://localhost:5000/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test@test.com',
    password: 'test123',
    name: 'Test Driver',
    phone: '+1234567890',
    role: 'driver',
    vehicleType: 'bike',
    vehicleNumber: 'TEST-123',
    licenseNumber: 'DL123456'
  })
}).then(r => r.json()).then(d => console.log('SUCCESS:', d)).catch(e => console.error('ERROR:', e))
```

If this works, the backend is fine and it's a frontend caching issue.

## If Still Not Working

Check these files have the correct content:

### frontend/src/services/api.js
Should have:
```javascript
baseURL: 'http://localhost:5000/api',
```

### frontend/vite.config.js  
Should have proxy configured (though we're not using it now)

### backend/.env
Should have:
```
MONGODB_URI=mongodb://localhost:27017/courier-platform
```
(or your MongoDB Atlas connection string)
