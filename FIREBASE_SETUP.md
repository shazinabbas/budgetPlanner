# Budget Planner - Firebase Setup Guide

## Overview
This app uses **offline-first architecture** with Firebase for authentication and cloud sync.

- **IndexedDB**: Local storage for fast, offline-capable UI
- **Firebase Authentication**: Secure Google sign-in
- **Firestore**: Cloud backup and multi-device sync

---

## Setup Steps

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Name it (e.g., "BudgetPlanner")
4. Disable Google Analytics (optional)
5. Click "Create project"

### 2. Register Web App
1. In Firebase Console, click "</>" (Web icon)
2. Name your app: "BudgetPlanner"
3. Check "Firebase Hosting" if you want to use it
4. Click "Register app"
5. Copy the `firebaseConfig` object

### 3. Add Firebase Config
1. Open `frontend/src/lib/firebase.js`
2. Replace the placeholder values with your Firebase config:
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_AUTH_DOMAIN",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_STORAGE_BUCKET",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```

### 4. Enable Authentication
1. In Firebase Console, go to **Authentication** → **Get started**
2. Go to **Sign-in method** tab
3. Enable **Google** provider:
   - Click "Google"
   - Toggle "Enable"
   - Add support email
   - Click "Save"

### 5. Enable Firestore Database
1. In Firebase Console, go to **Firestore Database** → **Create database**
2. Choose **Start in test mode** (for development)
3. Select a location (choose closest to you)
4. Click "Create"

### 6. Configure Firestore Security Rules
1. Go to **Firestore Database** → **Rules**
2. Replace with the following (only authenticated users can access):
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```
3. Click "Publish"

### 7. Install Dependencies
In the `frontend` folder, run:
```bash
npm install firebase
```

### 8. Test Authentication
1. Start the app: `npm start`
2. You should see a **"Sign in with Google"** button
3. Click and sign in
4. Once signed in, you'll see the dashboard

---

## How Cloud Sync Works

### On Sign In
- Fetches all transactions from Firestore
- Loads them into IndexedDB
- Sets up real-time listeners for live updates

### Adding/Editing Transactions
- Saves to IndexedDB **immediately** (instant UI update)
- Syncs to Firestore **in the background**
- If offline: queues sync for later

### Multi-Device Sync
- Changes on Device A → sync to Firestore
- Device B automatically receives updates via real-time listeners
- Both devices stay in sync

### Offline Support
- All features work offline (using IndexedDB)
- Changes are queued and synced when back online
- No data loss

---

## Deployment to GitHub Pages

### Build the App
```bash
cd frontend
npm run build
```

### Deploy to GitHub Pages
1. Install gh-pages:
   ```bash
   npm install --save-dev gh-pages
   ```

2. Add to `package.json`:
   ```json
   {
     "homepage": "https://YOUR_USERNAME.github.io/budgetPlanner",
     "scripts": {
       "predeploy": "npm run build",
       "deploy": "gh-pages -d build"
     }
   }
   ```

3. Deploy:
   ```bash
   npm run deploy
   ```

4. Enable GitHub Pages:
   - Go to your repo → Settings → Pages
   - Source: Deploy from branch `gh-pages`
   - Click Save

### Update Firebase Authorized Domains
1. In Firebase Console, go to **Authentication** → **Settings** → **Authorized domains**
2. Add your GitHub Pages URL:
   ```
   YOUR_USERNAME.github.io
   ```

---

## Security Notes

✅ **Firestore Rules** ensure only authenticated users can access data
✅ **Firebase Authentication** validates user identity
✅ **Public Repo** is safe - Firebase credentials are public, but protected by security rules
✅ **Only you** can access your data after signing in

---

## Troubleshooting

### "Module not found: firebase"
- Run `npm install firebase` in the frontend folder

### "Permission denied" in Firestore
- Check Firestore Rules (must allow `request.auth != null`)
- Make sure you're signed in

### Data not syncing
- Check browser console for errors
- Verify internet connection
- Check Firebase Console → Firestore to see if data exists

### Authentication not working
- Verify Google sign-in is enabled in Firebase Console
- Check that your domain is authorized in Firebase settings

---

## Architecture

```
User Action
    ↓
IndexedDB (instant update)
    ↓
UI Re-renders (instant)
    ↓
Firestore Sync (background)
    ↓
Other Devices Updated (real-time)
```

This **offline-first** approach ensures:
- ⚡ Instant UI updates
- 📡 Cloud backup
- 🔄 Multi-device sync
- 🚀 Works offline

---

## Support

For issues or questions:
1. Check browser console for errors
2. Verify Firebase setup
3. Review Firestore Rules
4. Check Firebase Console for logs
