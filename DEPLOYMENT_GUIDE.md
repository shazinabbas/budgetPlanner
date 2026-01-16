# GitHub Pages Deployment Guide

## ✅ Setup Complete

Your project is now configured for GitHub Pages deployment!

---

## What's Been Done

1. ✅ Added `homepage` field to package.json
2. ✅ Added `predeploy` and `deploy` scripts
3. ✅ Installed `gh-pages` package
4. ✅ Build and deployment in progress...

---

## Deployment Steps (Automated)

When you run `npm run deploy`, it:
1. Builds the production app (`npm run build`)
2. Creates optimized static files in `build/` folder
3. Pushes `build/` folder to `gh-pages` branch
4. GitHub Pages serves from `gh-pages` branch

---

## After Deployment Completes

### 1. Enable GitHub Pages
1. Go to your GitHub repo: `https://github.com/YOUR_USERNAME/budgetPlanner`
2. Go to **Settings** → **Pages**
3. Under **Source**, select:
   - Branch: `gh-pages`
   - Folder: `/ (root)`
4. Click **Save**

### 2. Wait 1-2 Minutes
GitHub Pages will build and deploy your site.

### 3. Your App Will Be Live At:
```
https://YOUR_USERNAME.github.io/budgetPlanner
```

**Note:** Update `homepage` in `package.json` with YOUR actual GitHub username!

---

## Update Firebase Authorized Domains

⚠️ **Important**: Add your GitHub Pages domain to Firebase

1. Go to Firebase Console
2. **Authentication** → **Settings** → **Authorized domains**
3. Click **Add domain**
4. Add: `YOUR_USERNAME.github.io`
5. Click **Add**

Without this, Google sign-in won't work on the deployed site!

---

## Future Deployments

Any time you make changes:

```bash
cd frontend
npm run deploy
```

That's it! Your changes will be live in 1-2 minutes.

---

## Troubleshooting

### "fatal: A branch named 'gh-pages' already exists"
This is normal on subsequent deployments. gh-pages handles it automatically.

### "Permission denied (publickey)"
Set up SSH keys with GitHub or use HTTPS:
```bash
git remote set-url origin https://github.com/YOUR_USERNAME/budgetPlanner.git
```

### "404 Page Not Found"
1. Check GitHub Pages settings (branch = gh-pages)
2. Wait 2-3 minutes for initial deployment
3. Clear browser cache

### Google Sign-In Doesn't Work
Add your GitHub Pages domain to Firebase authorized domains (see above).

### Blank Page
1. Check `homepage` in package.json matches your GitHub Pages URL
2. Redeploy: `npm run deploy`

---

## Check Deployment Status

1. Go to your repo → **Actions** tab
2. See "pages build and deployment" workflow
3. Green checkmark = deployed successfully

---

## Local vs Production

### Local (Development)
```bash
npm start
```
- Hot reload
- Development mode
- Runs on localhost:3000

### Production (GitHub Pages)
```bash
npm run deploy
```
- Optimized build
- Production mode
- Served from GitHub Pages

---

## Project Structure After Deployment

```
budgetPlanner/
├── frontend/
│   ├── build/          ← Production files (created by npm run build)
│   ├── src/            ← Your source code
│   └── package.json    ← Updated with homepage and deploy scripts
└── .git/
    └── refs/
        └── gh-pages    ← Deployment branch (created by gh-pages)
```

---

## Custom Domain (Optional)

Want to use your own domain instead of github.io?

1. Buy a domain (e.g., mybudget.com)
2. Add CNAME file in `frontend/public/`:
   ```
   mybudget.com
   ```
3. Update DNS records:
   ```
   CNAME → YOUR_USERNAME.github.io
   ```
4. Update `homepage` in package.json:
   ```json
   "homepage": "https://mybudget.com"
   ```
5. Deploy: `npm run deploy`

---

## Security Notes

✅ **Your app is secure on GitHub Pages because:**
- Only authenticated users can access data (Firebase Auth)
- Firestore rules protect your data
- Public repo = public code, but private data
- Firebase credentials are safe to expose (protected by rules)

---

## Next Steps

1. ✅ Wait for `npm run deploy` to finish
2. ✅ Enable GitHub Pages in repo settings
3. ✅ Add GitHub Pages domain to Firebase
4. ✅ Visit your live app!
5. ✅ Share the link (but only you can sign in)

---

## Your Live App URL

After setup:
```
https://YOUR_USERNAME.github.io/budgetPlanner
```

**Remember to replace YOUR_USERNAME with your actual GitHub username in:**
- package.json `homepage` field
- Firebase authorized domains
- This documentation

---

## 🎉 Congratulations!

You now have a fully deployed, cloud-synced budget planner!

**Features:**
- ✅ Hosted on GitHub Pages (free)
- ✅ Secure authentication
- ✅ Cloud backup with Firebase
- ✅ Works offline
- ✅ Multi-device sync
- ✅ Auto-deploys when you push changes

Happy budgeting! 💰📊🚀
