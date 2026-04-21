

# Clerk Authentication Integration Plan

Goal: Replace the existing Supabase email/password Login & Signup UI with **Clerk-hosted authentication** (Email + Password, Google, Phone Number), while keeping the **entire backend, RLS, schools, students, edge functions, realtime sync** running on Supabase exactly as they are today.

This is achieved using **Clerk → Supabase Native Third-Party Auth Integration** (officially supported by both Clerk and Supabase since 2024). Clerk issues the JWT, Supabase trusts it, and `auth.uid()` returns the Clerk user ID inside RLS policies — so all your existing RLS, `school_id` isolation, profiles, `useRealtimeSync`, edge functions etc. keep working without any logic rewrite.

---

## What I Need From You (Pre-requisites)

Before I write any code, please prepare these in **Clerk Dashboard** and **Supabase Dashboard**:

### 1. Clerk Dashboard
- Create the application (you already have it: **EDULINKER / Development**).
- In **User & Authentication → Email, Phone, Username**, enable:
  - Email address (with password)
  - Phone number (SMS verification)
- In **User & Authentication → Social Connections**, enable **Google**.
- In **JWT Templates**, create a new template named exactly **`supabase`** (Clerk has a built-in preset for this — one click).
- Copy two values and share them with me:
  - **Publishable Key** (starts with `pk_test_...` or `pk_live_...`)
  - **Frontend API URL / Issuer URL** (looks like `https://xxx-xx.clerk.accounts.dev` for dev, or your custom domain for prod)

### 2. Supabase Dashboard
- Go to **Authentication → Sign In / Up → Third Party Auth**.
- Click **Add provider → Clerk**.
- Paste the Clerk **Issuer URL** from above and save.
  (This makes Supabase accept Clerk JWTs natively — no custom JWT secret swapping required.)

Once these are ready, I'll do everything else in code.

---

## What I'll Build (Code Changes)

### A. Install & Wire Up Clerk
- Add `@clerk/clerk-react` dependency.
- Add `VITE_CLERK_PUBLISHABLE_KEY` to environment.
- Wrap `<App />` in `<ClerkProvider>` inside `src/main.tsx`.

### B. New Auth Pages (replace existing Supabase forms)
- **`src/pages/LoginPage.tsx`** — replace the current email/password form with Clerk's `<SignIn />` component, themed in EDULinker's golden/dark glassmorphism (preserves logo, GoldenBackground, InstallBanner). Three sign-in tabs auto-render: **Email + Password**, **Phone**, **Google** — based on what you enabled in Clerk Dashboard.
- **`src/pages/SignupPage.tsx`** — replace with Clerk's `<SignUp />` component, same theming.
- **`src/pages/ForgotPasswordPage.tsx`** & **`ResetPasswordPage.tsx`** — handled natively by Clerk's flows (one less thing for us to maintain). Old custom pages will redirect to Clerk.
- Keep `/gmail-confirmation` route intact (no change — that was a separate magic-link flow).

### C. Bridge Clerk → Supabase (the core of this integration)
- Update **`src/integrations/supabase/client.ts`** to fetch a fresh Clerk-issued JWT (with the `supabase` template) on every request via the `accessToken` async option. This is the official Supabase + Clerk pattern.
- This means **every Supabase query (students, results, fees, homework, RLS-protected tables, edge functions, storage) automatically gets authenticated as the Clerk user** with zero changes elsewhere in the codebase.

### D. Replace `AuthContext` Internals (keep the same public API)
- `useAuth()` will continue to expose `{ user, session, loading, schoolId, signOut }` exactly as before — so `ProtectedRoute`, `Sidebar`, `SettingsPage`, `useRealtimeSync`, and every page using `useAuth()` keep working unchanged.
- Internally it will read from Clerk (`useUser`, `useAuth` from Clerk) instead of `supabase.auth.onAuthStateChange`, and `user.id` will be the Clerk user ID (which RLS treats as `auth.uid()`).
- `ensureSchoolExists()` logic stays — first login still auto-creates "My School".
- `signOut()` calls Clerk's `signOut()`.

### E. Database Migration (one-time, small)
- Existing rows in `schools`, `students`, `user_roles` etc. are tied to old Supabase `auth.users` UUIDs. Since you're moving to fresh Clerk auth, **existing test users will need to sign up again** (their Clerk `user.id` will differ). This will trigger `ensureSchoolExists` and create their school cleanly.
- **Important**: If you have real production data tied to specific users you must keep, tell me — we'd need a manual user-mapping migration. Otherwise we proceed clean.
- No RLS policy changes are needed — `auth.uid()` continues to return the JWT subject (now Clerk's user ID).

### F. Files Removed/Updated
- `LoginPage.tsx`, `SignupPage.tsx`, `ForgotPasswordPage.tsx`, `ResetPasswordPage.tsx` → updated to use Clerk components.
- `AuthContext.tsx` → internals rewired to Clerk, public API unchanged.
- `supabase/client.ts` → adds `accessToken` callback.
- `main.tsx` → adds `<ClerkProvider>`.
- `.env` → add `VITE_CLERK_PUBLISHABLE_KEY`.

### G. What Stays Untouched
- All Supabase tables, RLS policies, triggers, edge functions, storage bucket.
- `useRealtimeSync`, Zustand store, all dashboard / student / homework / fees / results / announcements pages.
- PIN protection, PWA service worker, auto-update logic.
- Custom domain `main.agentraai.space`.

---

## Visual / UX Notes

- Clerk's `<SignIn />` and `<SignUp />` will be themed using `appearance` prop to match EDULinker's dark + golden palette (primary `hsl(51, 100%, 50%)`, glass card `bg-card/80 backdrop-blur-xl border-primary/20`, golden glow shadow on the submit button, EDULinker logo on top). User won't notice it's a third-party widget.

---

## Risks & Caveats

1. **Existing users must re-sign-up** unless we run a user-mapping migration (let me know if you have important users).
2. **Phone OTP costs**: Clerk charges for SMS after free tier — Email + Google have generous free limits, Phone is the costlier one.
3. **Custom domain for Clerk in production** is optional but recommended later (so users see `accounts.agentraai.space` instead of `xxx.clerk.accounts.dev`). Not required now.

---

## Summary — Just Tell Me

> "Clerk Dashboard ready, Supabase third-party Clerk provider added. Yeh raha **Publishable Key** = `pk_...` aur **Issuer URL** = `https://...clerk.accounts.dev`"

…and I'll implement the entire integration in one go.

