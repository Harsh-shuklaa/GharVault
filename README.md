# 🛡️ GharVault ("One Family. One Secure Space.")
### 100% Free-Tier Private Family Document Management & Governance SaaS

> Built with 100% design fidelity to **Google Stitch UI Prototypes**.
> Zero Financial Cost: MongoDB Atlas Free Tier (M0) + Supabase Storage Free Tier (Private Buckets with Signed URLs) + Supabase Google OAuth.

---

## 🌟 Overview & Stitch Fidelity

**GharVault** is a privacy-first family document vault designed specifically for Indian families and statutory inheritance compliance (compliant with Section 65B of the Indian Evidence Act and the Indian Succession Act, 1925).

All UI layouts, color palettes, spacing, and micro-interactions replicate the Google Stitch design system:
* **Deep Sapphire (`#0F172A`)**: Sidebar and dark administrative modals.
* **Primary Blue (`#2563EB`)**: Action buttons, active badges, and focus rings.
* **Emerald (`#059669`)**: Cryptographic SHA-256 integrity tags, verified statuses, and security pulses.
* **Amber (`#D97706` / `#BA1A1A`)**: Urgent 30-day document expiration alerts and Emergency Break-Glass protocol.
* **Typography**: *Plus Jakarta Sans* for headlines, *Inter* for controls and body text, *JetBrains Mono* for cryptographic hashes and statutory identifiers.

---

## 🚀 Key Architecture & Zero-Cost Rules

1. **Zero Financial Cost Cloud Storage**:
   * **Supabase Storage (Free Tier)**: Uses private buckets (`family-documents`) with signed URLs expiring in 15–60 minutes. Raw documents are never publicly accessible.
   * **Graceful Local Fallback**: If Supabase credentials are not yet entered, a local signed URL engine with HMAC-SHA256 tokens operates seamlessly.
2. **Database & ODM**:
   * **MongoDB Atlas Free Tier (M0 Cluster)** via Mongoose with strict schemas, indexes, and full text search.
   * **In-Memory Mock Persistence**: If offline or `MONGODB_URI` is blank, GharVault automatically initializes an in-memory database pre-seeded with the demo Sharma Family Ghar so it works immediately out of the box.
3. **Authentication**:
   * **Supabase Auth (Google OAuth / Sign in with Google)** for one-click Gmail login.
   * **MPIN & Biometric Face ID Keypad** simulation matching Stitch prototypes.
   * **Fast Persona Switcher**: Switch between *Rajesh Sharma (Admin)*, *Priya Sharma (Guardian)*, *Aarav Sharma (Son)*, and *Sunita Sharma (Grandmother)* with one click to test multi-user permissions and quorum sign-offs!

---

## 📱 Complete Screen Coverage

| Screen / Feature | Route | Description & Stitch Fidelity |
|---|---|---|
| **1. Landing Page** | `/` | Security hero with 256-bit AES pulse badge, live interactive preview window canvas, 4 core pillars, Indian law compliance, FAQs, and Google OAuth CTA. |
| **2. Auth & Google Login / MFA** | `/auth/login` | One-click Google Sign-In, 4-digit MPIN keypad with FaceID simulation, and quick demo family persona switcher. |
| **3. Family Workspace Setup & Join** | `/family/setup` | Create new vault (e.g. "Sharma Family Ghar") or join via 8-char invite code (`GHAR-9428`), setting quorum and break-glass policies. |
| **4. Main Dashboard** | `/dashboard` | Urgent Expiry Warning Banner (Amber alert for Term Life Policy expiring in 27 days), 4 metrics cards, 4 quick actions with hover lift, split recent docs & real-time audit ledger. |
| **5. Master Document Vault** | `/vault` | Search, category filters, member selector, Table View and Grid View toggle, SHA-256 copy buttons, and status chips. |
| **6. Document Upload & Ingestion** | `/vault/upload` | Drag-and-drop zone (PDF, PNG, JPG up to 25MB), instant browser SHA-256 checksum computation, simulated auto-OCR field extraction, and dual-key quorum toggle. |
| **7. Document Preview & Details** | `/vault/documents/:id` | Dual-pane layout: zoomable/rotatable document canvas with watermark on left, Supabase signed URL timer, master SHA-256 checksum, and audit trail on right. |
| **8. Family Directory & Member Profile** | `/family`, `/family/:memberId` | Directory of custodians with emergency badges, "Invite Member" modal with link generator, and individual member profile with assigned records. |
| **9. Document Categories Directory** | `/categories` | Standardized Indian record categories with custom category creation modal. |
| **10. Immutable Activity Audit** | `/activity` | Cryptographically chained audit trail, live status indicator, and full Section 65B Cryptographic Manifest JSON export modal. |
| **11. Permissions Matrix** | `/permissions` | Interactive RBAC matrix comparing Admin vs Guardian vs Member across categories and capabilities (upload, download, quorum, break-glass). |
| **12. Emergency Break-Glass Protocol** | `/break-glass` | 48-Hour live countdown timer, emergency justification selector, broadcast notification dispatcher simulation, and force override. |
| **13. Dual-Key Quorum Sign-off** | Modal | Multi-sig modal requiring 2-of-2 guardian keys to unlock sensitive property deeds and wills, triggering confetti on sign-off! |
| **14. Disaster Recovery Cold Backup** | `/api/export/backup` | One-click download of a structured ZIP archive containing all encrypted PDFs, cryptographic JSON manifest, and statutory inheritance instructions. |
| **15. Notifications Center** | `/notifications` | Live notification feed with unread counter, urgency color coding, and quick jump links. |

---

## 🛠️ Project Structure

```
GharVault/
├── client/                     # Vite + React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/         # GlobalSearchModal, QuorumSignModal, InviteMemberModal
│   │   │   └── layout/         # AppLayout (Deep Sapphire Sidebar & Topbar)
│   │   ├── context/            # AuthContext (User, Family, Demo Switcher)
│   │   ├── lib/                # api.js, supabaseClient.js
│   │   ├── pages/              # All 12 React screens
│   │   ├── App.jsx             # React Router hierarchy
│   │   ├── index.css           # Tailwind CSS directives & font imports
│   │   └── main.jsx
│   ├── tailwind.config.js      # Exact GharVault Stitch design tokens
│   ├── vite.config.js          # Vite config with API proxy
│   └── package.json
│
├── server/                     # Node.js + Express REST API Backend
│   ├── src/
│   │   ├── config/             # db.js (MongoDB Atlas + Fallback), seed.js (Demo Data)
│   │   ├── models/             # User, Family, Document, AuditLog, Category, Quorum, BreakGlass
│   │   ├── routes/             # auth, family, document, audit, quorum, breakGlass, export, category
│   │   ├── services/           # supabaseStorage.js (Supabase Storage Client + Signed URLs)
│   │   └── index.js            # Express server entry point
│   ├── .env.example
│   └── package.json
│
├── stitch_reference/           # Downloaded reference HTML templates from Google Stitch
└── package.json                # Root concurrent scripts
```

---

## ⚡ Quick Start (Local Development)

### 1. Install Dependencies
```bash
# In the root directory:
npm run install:all
```

### 2. Configure Environment Variables (Optional)
The application works immediately out-of-the-box with built-in zero-config demo mode!
To connect to your own live free-tier services:

In `server/.env`:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/gharvault?retryWrites=true&w=majority
SUPABASE_URL=https://<your-project-id>.supabase.co
SUPABASE_ANON_KEY=<your-supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>
SUPABASE_BUCKET_NAME=family-documents
```

In `client/.env`:
```env
VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

### 3. Start Development Servers
```bash
# Starts both Express backend (Port 5000) and Vite frontend (Port 5173):
npm run dev
```

Visit **`http://localhost:5173`** in your browser.

---

## 🚢 Deployment to Free Tiers

* **Frontend (Vercel)**:
  1. Root directory: `client`
  2. Build command: `npm run build`
  3. Output directory: `dist`
  4. Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL`
* **Backend (Render / Railway)**:
  1. Root directory: `server`
  2. Start command: `node src/index.js`
  3. Environment variables: `MONGODB_URI`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
* **Unified Single-Port Deployment**:
  The Express backend is pre-configured to automatically build and serve `client/dist` statically at `http://localhost:5000/`.

---

## 🔒 Security Architecture Highlights
* **Zero-Knowledge Architecture**: Documents are stored in private buckets accessible only via server-signed URLs.
* **FIPS 180-4 SHA-256 Hashing**: Computed client-side before file transfer and validated server-side.
* **Chained Merkle-like Ledger**: Every audit log references the previous event's hash, forming an immutable chain.
* **Indian Evidence Act Section 65B**: Exportable cryptographic manifest JSON payload certifying electronic records.
