#!/usr/bin/env bash
# ─── Mukesh Unisex Salon — Fix & Re-push to GitHub ───
# Run this in Termux after downloading the fixed project ZIP.
# It cleans the repo and pushes the working version.
set -e

echo "═══════════════════════════════════════════════"
echo "  Mukesh Unisex Salon — Fix & Re-push"
echo "═══════════════════════════════════════════════"

# 1. Make sure git is configured
if ! git config user.name >/dev/null 2>&1; then
  read -p "Your GitHub name: " NAME
  read -p "Your GitHub email: " EMAIL
  git config --global user.name "$NAME"
  git config --global user.email "$EMAIL"
fi

# 2. Download the fixed project ZIP
echo ""
echo "▶ Downloading fixed project..."
cd ~
rm -rf mukesh-salon-pkg mukesh-salon-project.zip
curl -L -o mukesh-salon-project.zip "https://mukeshunisexsaloon.space-z.ai/mukesh-salon-project.zip"
unzip -q mukesh-salon-project.zip
cd mukesh-salon-pkg

echo ""
echo "▶ Fixed files downloaded:"
ls -la

# 3. Initialize git and commit
echo ""
echo "▶ Committing fixed version..."
rm -rf .git
git init
git add .
git commit -m "Fix: Vercel deployment (remove standalone output, fix build script)"

# 4. Ask for repo URL and push
echo ""
echo "───────────────────────────────────────────────"
echo "Your GitHub repo URL (from your existing repo):"
echo "  e.g. https://github.com/uutkarssh/Mukesh-Unisex-Saloon.git"
echo "───────────────────────────────────────────────"
read -p "Repo URL: " REPO_URL

git branch -M main
git remote add origin "$REPO_URL" 2>/dev/null || git remote set-url origin "$REPO_URL"

echo ""
echo "▶ Pushing to GitHub (force overwrite with the fixed version)..."
echo "  (you'll be asked for your GitHub username + Personal Access Token)"
git push -u origin main --force

echo ""
echo "═══════════════════════════════════════════════"
echo "  ✅ DONE! Fixed code pushed to GitHub."
echo "═══════════════════════════════════════════════"
echo ""
echo "Next: Go to Vercel → your project → Deployments →"
echo "click the latest → 'Redeploy' (or push any commit to trigger a rebuild)."
echo ""
echo "⚠️  Make sure these env vars are set in Vercel:"
echo "    TURSO_DATABASE_URL"
echo "    TURSO_AUTH_TOKEN"
echo "    SESSION_SECRET"
echo ""
