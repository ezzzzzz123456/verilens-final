// src/routes/verify.routes.js
import express from 'express';
import { verifyNews } from '../controllers/verify.controller.js';

const router = express.Router();

router.post('/verify', verifyNews);

export default router;