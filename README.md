# 🌱 EcoVerse AI

EcoVerse AI is a next-generation, gamified carbon footprint tracking application and personal climate coaching platform. Built with **TanStack Start**, **React 19**, and **Supabase**, it leverages **Google Gemini AI** to make carbon tracking effortless, engaging, and rewarding.

---

## ✨ Features

### 1. Interactive Carbon Budget Rings (Dashboard)
* concentric rings reflecting daily emissions vs budgets:
  * **Outer Ring (Green)**: Total Daily CO₂e.
  * **Middle Ring (Blue/Cyan)**: Transport CO₂e.
  * **Inner Ring (Orange/Amber)**: Food CO₂e.
* Real-time reactive updates as logs are tracked.

### 2. AI-Powered Food Photo Analyzer (Dashboard Quick-Scan)
* Upload or snap photos of your meals directly from the dashboard.
* Automatically analyzes food composition, estimates CO₂e emissions, and provides a friendly breakdown.
* **Instant Alternative Recipes**: For high-impact meals, instantly generate structured low-carbon recipes with a single click.

### 3. Personal EcoAI Climate Coach
* Interactive chat interface loaded with your profile data, diet type, heating setup, commute details, and log history.
* Get precise, tailored advice to reduce your emissions and build healthy habits.
* Seamless transition from simulated **Demo Mode** to **Live Mode** once credentials are set.

### 4. Eco-Achievement Badge Showcase
* Gamified gallery showcasing unlockable environmental milestones with hover animations:
  * 🌱 **Green Pioneer** (Onboarding complete)
  * 🚲 **Green Commuter** (Using clean transport)
  * 🥗 **Plant-Powered** (Adopting plant-based diets)
  * 🔥 **Habit Builder** (Keeping streaks alive)
  * 🌳 **Carbon Hero** (Saving substantial CO₂e)
  * 🏝️ **Island Guardian** (Upgrading your living island)

---

## 🛠️ Technology Stack

* **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide icons, Recharts
* **Backend Framework**: TanStack Start (SSR / Server Functions)
* **Database & Auth**: Supabase (via `@supabase/supabase-js`)
* **AI Integration**: `@ai-sdk/google` (Google Gemini) and `@ai-sdk/openai-compatible` (Lovable Gateway)
* **Build Tool**: Vite 8 & Nitro

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have **Node.js** installed on your system.

### 2. Installation
Clone the repository and install the dependencies:
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the root of the project and populate the following keys:
```env
# Supabase Configuration
SUPABASE_URL="https://your-project-id.supabase.co"
SUPABASE_PUBLISHABLE_KEY="your-supabase-anon-key"
SUPABASE_PROJECT_ID="your-project-id"

# AI Key (Choose either Lovable or Direct Gemini Key)
LOVABLE_API_KEY="your-lovable-gateway-key"
# OR
GEMINI_API_KEY="your-google-gemini-key"
```

### 4. Development Server
Run the local development server:
```bash
npm run dev
```
Open [http://localhost:8080](http://localhost:8080) in your browser.

---

## 📦 Production & Deployment

### 1. Build
To compile the production assets and server functions:
```bash
npm run build
```

### 2. Netlify Deployment
This project is configured with a `netlify.toml` preset. When pushed to Netlify:
* **Build Command**: `npm run build`
* **Publish Directory**: `dist`
* **Functions Directory**: `.netlify/functions-internal`

> [!IMPORTANT]
> Make sure to configure your environment variables (from `.env`) in the **Site Configuration > Environment variables** settings in the Netlify Dashboard.
