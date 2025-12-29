import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// --- CONFIG & DB ---
import connectDB from './src/config/db.js';

// --- ROUTES ---
import verifyRoutes from './src/routes/verify.routes.js';
import authRoutes from './src/routes/auth.routes.js';

dotenv.config();

// 1. Connect to Database
connectDB();

const app = express();
const PORT = process.env.PORT || 3000;

// 2. Middleware (ENHANCED CORS)
app.use(cors({
  origin: "*", // Allows requests from Vercel to Render
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

// 3. Mount Routes
app.use('/api', verifyRoutes); 
app.use('/api/auth', authRoutes);

// 4. Root Check
app.get('/', (req, res) => {
  res.send('✅ VeriLens Backend is Active & Connected to DB');
});

// 5. Start Server
app.listen(PORT, () => {
  console.log(`\n================================`);
  console.log(`🚀 VeriLens Server running on Port: ${PORT}`);
  console.log(`🧠 Lane Architecture: ACTIVE`);
  console.log(`================================\n`);
});