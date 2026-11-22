# PropertyOS Pakistan — WhatsApp Ingestion Backend

This Node.js backend handles **WhatsApp Cloud API (Meta)** webhook ingestion, automated duplicate checks, intent parsing, and real-time lead broadcasting to the PropertyOS CRM frontend.

---

## 🚀 Quick Start

### 1. Install dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```env
PORT=5000
FRONTEND_URL=http://localhost:5173

# Meta WhatsApp Cloud API credentials
META_VERIFY_TOKEN=propertyos_pakistan_verify_2026
META_ACCESS_TOKEN=your_token_here
META_PHONE_NUMBER_ID=your_id_here
META_WABA_ID=your_waba_id_here
```

### 3. Run Development Server
```bash
npm run dev
```

---

## 📡 Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Server health check |
| `GET` | `/api/webhook` | Meta Webhook token verification endpoint |
| `POST` | `/api/webhook` | Receives incoming messages from Meta |
| `GET` | `/api/leads` | Returns all captured leads |
| `POST` | `/api/leads/simulate` | Test endpoint to simulate an incoming WhatsApp message |
| `GET` | `/api/whatsapp/status` | Check Meta connection status |
| `POST` | `/api/whatsapp/send` | Send an outgoing WhatsApp message to a lead |

---

## 🔗 Connecting with Meta WhatsApp Cloud API (Option A)

1. **Expose your local server to the internet** (for testing):
   ```bash
   npx ngrok http 5000
   ```
   Copy the `https://xxxx.ngrok-free.app` URL provided by ngrok.

2. **Configure in Meta App Dashboard:**
   - Go to [developers.facebook.com](https://developers.facebook.com) > Your App > **WhatsApp** > **Configuration**.
   - Under **Webhook**:
     - **Callback URL:** `https://xxxx.ngrok-free.app/api/webhook`
     - **Verify Token:** `propertyos_pakistan_verify_2026` (must match your `META_VERIFY_TOKEN` in `.env`).
   - Click **Verify and Save**.
   - Under **Webhook fields**, click **Manage** and subscribe to **`messages`**.

3. **Test with Live WhatsApp:**
   - Send a WhatsApp message to your Meta WhatsApp Business number.
   - The lead will be received, parsed, formatted, and instantly broadcast to your CRM!
