# Project Engineering Report: Aeris Travel Companion & Pricing Analytics Engine

An advanced full-stack travel dashboard, dynamic pricing simulator, and real-time flight tracking system equipped with Google Gemini-powered smart assistants, secure database persistence, and adaptive visualization modes.

---

## 1. Executive Summary

**Aeris** is a high-fidelity, production-grade flight companion and travel intelligence dashboard. The application addresses the computational complexities of dynamic ticket scheduling while presenting travelers with an elegant workspace. 

Key product modules include:
*   **Aero-Logistics Hub:** Real-time query mechanism pulling actual tracking states from the network.
*   **Pricing Engine Hub:** An interactive pricing index visualizer showcasing simulated market volatility.
*   **Aeris Travel AI Agent Companion:** A server-side conversational concierge anchored with Google Gemini models.
*   **Terminal Synchronization:** A synchronized user state layer built on Firebase (Authentication & Cloud Firestore) for seamless tracking.

---

## 2. Technical Stack & Systems Architecture

```
                                  [ CLIENT SIDE ]
                          +-------------------------------+
                          |   React 18 (Vite SPA Engine)  |
                          |  Tailwind CSS & Lucide Icons  |
                          +---------------+---------------+
                                          |
                                          | JSON over HTTPS
                                          v
      +-----------------------------------+-----------------------------------+
      |                                                                       |
[ SERVER FALLBACK / CLOUD RUN ]                                      [ SERVERLESS HANDLERS / VERCEL ]
+------------------------------+                                     +-------------------------------+
|     Express Multi-Route      |                                     |  Vercel Serverless Functions  |
|      (server.ts Server)      |                                     |    (/api/* Endpoint Proxies)  |
+--------------+---------------+                                     +---------------+---------------+
               | Proxying API Calls                                                  | Proxying API Calls
               v                                                                     v
+--------------+---------------------------------------------------------------------+---------------+
|  External Resources: Google Gemini API (gemini-3.5-flash) | OpenSky Network Live Flight Stream     |
+----------------------------------------------------------------------------------------------------+
```

### Infrastructure Strategy
Aeris is engineered with a **dual deployment-fallback protocol**:
1.  **Vercel Serverless Architecture:** Designed to serve `/api/flights/live` and `/api/recommendations/chat` without running a persistent 24/7 Virtual Machine. This architecture eliminates high server billing, minimizes execution latency, and guarantees maximum global scalability.
2.  **Express Backend (`server.ts`):** Operates as a local development sandbox and high-performance server container fallback on standard container runtimes (such as Google Cloud Run).

---

## 3. Deep-Dive: Core Modules & Features

### 3.1 Pricing Engine Hub & Interactive SVG Charts
A major core feature is the **Pricing Index View**, offering passengers insights into how travel ticket prices fluctuate across a 6-month horizon (January to June).
*   **Dual Orientation Canvas:** Users can instantaneously toggle the pricing chart between two visual layouts:
    *   **Vertical Line Graph (Y-Axis Mode):** Generates custom vector connecting path nodes representing high-fidelity price fluctuations.
    *   **Horizontal Bar Graph (X-Axis Mode):** Formulates progress-bar gauges that reflect relative ticket costs and factor ratios.
*   **Entropy Seeding:** To prevent identical lines for all routes, price graphs are uniquely seeded using a character hashing algorithm on the specific model ID (`currentItem.id`), ensuring flight routes and hotel types display distinct, realistic market trends.

### 3.2 Real-Time Flight Tracker
Instead of hardcoding mock logs, Aeris contains an operational bridge with the **OpenSky Network Aviation Database**.
*   **Live Stream:** Fetches physical transponder reports from commercial airlines.
*   **Simulation Fallback:** If API quotas are exhausted or network firewalls block calls, the controller activates an aerodynamic flight-path simulator that scales based on local system time.

### 3.3 Security-Sovereign Gemini AI Agent
All conversational tasks leverage the modern `@google/genai` TypeScript SDK.
*   **Zero Client Exposure:** The system strictly maintains security best practices. The `GEMINI_API_KEY` is bound server-side to prevent malicious clients from inspecting, scraping, or hijacking the developer’s credits.
*   **Role-Guided Intelligence:** The model is anchored with highly tailored instructions configuring it as the professional *Aeris Travel AI Agent*.

### 3.4 Persistent Database Sync & Session Navigation Gates
All critical operations are fortified behind an active cryptographic synchronization layer.
*   **Authentication:** Dual pathways (standard robust Email/Password verification and Google Fast Sync Single Sign-on).
*   **Strict Security Gates (Zero-Anonymous Transactions):** Guests are restricted to reading static telemetry boards. To book flights/hotels, consult the Gemini-powered AI Companion, freeze price indexes, process cancellations, or publish feedback / replies on the discussion ledgers, users must have an active synced session. Attempting any locked triggers prompts an automatic dispatch warning and seamlessly routes the interface to the Secure Registry Panel (modal).
*   **Real-Time Subscriptions:** Listens to collection changes so that multi-terminal logouts, bookings, and alerts remain fully coherent across multiple browser environments.

### 3.5 High-Fidelity Tactical Drone Cursor Engine
To elevate the aerospace aesthetic, the desktop experience integrates a custom interactive flight-drone locator cursor overlaying classical interfaces.
*   **Dynamic Vector Aerodynamics:** Renders a floating, high-tech space drone SVG with realistic bobbing hover cycles and spinning blade stabilizers whose frequency matches engagement levels.
*   **Adaptive Target-Reticle Locking:** Whenever hovering over clickable items, the cursor animates, scaling up 125% while overlaying high-speed cyan calibration reticles.
*   **Chrono-Compensated Diffuse Shadow:** Coordinates a dark physical blob shadow matching the frequency and spatial amplitude of the drone's hover cycle beneath it.
*   **High-Velocity Radar Clicks:** Every click maps an immediate radar pulse to the coordinates. The radar splits into cyan and orange dual-shockwave expand pulses with white laser cores before dissolving.
*   **Ergonomic Coarse Bypass:** Automatically queries pointer-precision matrices; on touch/mobile devices, the drone shuts down to favor native click ergonomics.

---

## 4. Database Schema Design

Aeris structures its cloud records under two primary collection schemas inside Google Cloud Firestore:

### `users` Collection
Tracks authentication metrics, configurations, and core profile metadata.
```json
{
  "uid": "usr_99a82f3efbc8",
  "email": "traveler@aeris.io",
  "displayName": "Amelia Earhart",
  "photoURL": "https://images.unsplash.com/photo-...",
  "createdAt": "2026-06-21T10:14:33Z"
}
```

### `bookings` Collection
Synchronizes active purchases, seats, refund tracking states, and live alerts.
```json
{
  "id": "book_e391a92bf",
  "userId": "usr_99a82f3efbc8",
  "flightNumber": "UA-926",
  "carrier": "United Airlines",
  "originCode": "SFO",
  "destinationCode": "LHR",
  "seatSelected": "14A (Premium)",
  "ticketType": "Deluxe Cabin",
  "status": "Confirmed",
  "pricePaid": 850,
  "syncDate": "2026-06-21T10:14:33Z"
}
```

---

## 5. Security & Deployment Best Practices

Whether hosting on **Google Cloud Run (via AI Studio)** or **Vercel**, ensure the following configurations are defined:

### 5.1 Environment Configuration (`.env`)
Generate a private context variables file or input them directly into your deployment console settings:
```env
# Gemini API Configuration
GEMINI_API_KEY=your_secured_google_gemini_api_key

# Firebase SDK client credentials (safe to show in browser)
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### 5.2 Serverless Routing Rules
To deploy to **Vercel** with fully functional API endpoints and a React Single Page App structure, create a `vercel.json` file in the project root:
```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## 6. Conclusion

**Aeris** exemplifies how to marry modern, high-fidelity user experiences with secure and robust backend proxy strategies. By decoupling API keys from frontend clients, structuring portable serverless handlers, and styling with premium typography and dynamic SVG elements, Aeris remains a benchmark for reactive web applications.
