# Admin Scripts Setup Guide

## Providing the Supabase Secret Key

The admin scripts require the **Supabase Secret Key** to bypass row-level security policies. You have **3 options** for providing it:

### Option 1: Store in .env (Convenient) ✅ Recommended for local development

Add this to your `.env` or `.env.local` file:

```env
SUPABASE_SECRET_KEY=your_secret_key_here
```

**Pros:** Convenient, don't need to enter it every time
**Cons:** Key is stored on disk (but gitignored)

### Option 2: Pass via Command Line (Secure) 🔒 No disk storage

Provide the key when running the command:

```bash
SUPABASE_SECRET_KEY=eyJhbG... npm run import-courts -- --city="los angeles"
```

**Pros:** Key never written to disk, most secure
**Cons:** Must paste it every time you run a script

### Option 3: Interactive Prompt (Hybrid) 🎯 Prompted if not in .env

If the key isn't found in your environment, the script will prompt you:

```bash
npm run import-courts -- --city="los angeles"
# 🔐 Supabase secret key not found in environment variables
# 📋 Paste your Supabase secret key: [enter key here]
```

**Pros:** Flexible, secure fallback
**Cons:** Need to paste it each time if not in .env

---

### Getting Your Secret Key

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. **Project Settings** (gear icon) → **API**
4. Copy the **secret** key (may be labeled "service_role" in legacy UI)
5. ⚠️ **Keep this secret!** Never commit to git or expose in client-side code

**Security Note:** The secret key bypasses ALL RLS policies. Only use in server-side/admin scripts.

**Note:** Scripts support both `SUPABASE_SECRET_KEY` (recommended) and `SUPABASE_SERVICE_ROLE_KEY` (legacy) for backwards compatibility.

## Running the Scripts

### If key is in .env:

```bash
# Import courts
npm run import-courts -- --city="los angeles"

# Review submissions
npm run review-courts
```

### If passing key via command line:

```bash
# Import courts
SUPABASE_SECRET_KEY=eyJhbG... npm run import-courts -- --city="los angeles"

# Review submissions
SUPABASE_SECRET_KEY=eyJhbG... npm run review-courts
```

### If using interactive prompt:

```bash
# Just run the command, it will prompt for the key
npm run import-courts -- --city="los angeles"
# 🔐 Supabase secret key not found...
# 📋 Paste your Supabase secret key: [paste here]
```

## Troubleshooting

**Error: "Missing Supabase credentials"**
- Make sure your `.env` file exists in the project root
- Verify `SUPABASE_SECRET_KEY` is set
- Restart your terminal after adding the key

**Error: "new row violates row-level security policy"**
- You're using the publishable/anon key instead of secret key
- Check that you've added `SUPABASE_SECRET_KEY` to .env
- Verify you're using the secret key, not the anon/publishable key

**Error: "Could not find column in schema cache"**
- Go to Supabase Dashboard → Project Settings → API
- Click "Refresh Schema" button
- Wait 30 seconds and try again
