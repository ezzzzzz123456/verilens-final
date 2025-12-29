import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// --- CONFIG & DB ---
import connectDB from './src/config/db.js';

// --- ROUTES ---
import verifyRoutes from './src/routes/verify.routes.js';
import authRoutes from './src/routes/auth.routes.js';

dotenv.config();

// 1. Connect to Database (Before starting the app)
connectDB();

const app = express();
const PORT = process.env.PORT || 3000;

// 2. Middleware
app.use(cors());
app.use(express.json());

// 3. Mount Routes
// Existing Verification Route (accessible at /api/verify)
app.use('/api', verifyRoutes); 

// New Auth Routes (accessible at /api/auth/login & /api/auth/signup)
app.use('/api/auth', authRoutes);

// 4. Root Check
app.get('/', (req, res) => {
  res.send('✅ VeriLens Backend is Active & Connected to DB');
});

// 5. Start Server
app.listen(PORT, () => {
  console.log(`\n================================`);
  console.log(`🚀 VeriLens Server running on http://localhost:${PORT}`);
  console.log(`🧠 Lane Architecture: ACTIVE`);
  console.log(`🍃 MongoDB Status: INITIALIZED`);
  console.log(`🔐 Auth System: READY`);
  console.log(`================================\n`);
});