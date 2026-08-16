<div align="center">
  <h1>🍎 ProducePilot</h1>
  <p><strong>AI-Native Fresh Produce Operations Platform</strong></p>
  <p>An intelligent platform optimizing supply chain, storage, and sales of fresh produce to reduce food waste and maximize profit.</p>
</div>

<hr />

## 🌟 Overview

**ProducePilot** is an advanced operations platform tailored for the fresh produce supply chain. By tracking environmental conditions, assessing quality using computer vision AI, and modeling shelf-life based on horticultural reference ranges, ProducePilot enables warehouse managers to proactively mitigate risks. The platform provides predictive rescue actions for produce at risk of spoiling, ensuring optimal inventory management across global storage locations.

## 🚀 Features

- **Global Inventory Tracking**: Monitor batches of fresh produce across various warehouses on a geospatial map.
- **AI Vision Assessment**: Computer vision integration to analyze produce quality, detect defects, and estimate visual condition scores.
- **Environmental Monitoring**: Track current storage temperature and humidity against ideal horticultural reference ranges (e.g., Tomatoes at 13-15°C, Apples at 0-4°C).
- **Intelligent Rescue Actions**: Receive AI-driven preemptive action recommendations for produce at risk of spoilage, minimizing food waste.
- **Comprehensive Analytics**: Dashboard for viewing business stats, batch details, and operational logs.
- **Automated Workflows**: Integration with n8n for running external automations, scheduling tasks, and agent activities.

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 19, Vite, React Router v7
- **Styling:** Tailwind CSS (Custom Design System with semantic colors)
- **Data Visualization:** Recharts
- **Mapping:** @react-google-maps/api
- **Icons:** Lucide React

### Backend
- **Server:** Node.js, Express.js
- **Database:** MongoDB via Mongoose
- **Security & Logging:** Helmet, CORS, Morgan

### Automation & Data
- **Workflows:** n8n for scheduled tasks and AI agent workflows
- **Data Layer:** Custom data generation scripts for synthetic inventory and sales

## ⚙️ Setup & Installation

### Prerequisites
- Node.js (v18+)
- MongoDB instance (local or Atlas)

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/ProducePilot.git
   cd ProducePilot
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   npm install
   # Create a .env file and configure PORT and MONGO_URI
   npm run dev
   ```

3. **Frontend Setup:**
   ```bash
   cd ../frontend
   npm install
   # Create a .env file and configure any needed environment variables
   npm run dev
   ```

## 🔄 Technical Workflow

1. **Data Ingestion:** New produce batches are logged with initial specs (quantity, received date, harvest date).
2. **Monitoring & Assessments:** Environmental data is updated. AI vision models process images from the warehouse floor to evaluate condition and identify defects.
3. **Risk Analysis:** AI agents evaluate conditions against ideal reference ranges and shelf-life metrics.
4. **Action Recommendations:** If a batch is at risk, an actionable recommendation (e.g., ship immediately, markdown price) is presented to the manager.
5. **Operational Execution:** Managers accept or dismiss AI suggestions. The backend updates inventory statuses and logs the action, potentially triggering external n8n workflows.

<hr />
<div align="center">
  <sub>Built with ❤️ for a sustainable supply chain.</sub>
</div>
