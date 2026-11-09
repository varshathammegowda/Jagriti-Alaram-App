import {Router} from 'express';import protect from '../middleware/authMiddleware.js';import asyncHandler from '../utils/asyncHandler.js';import {getInsights} from '../controllers/insightController.js';
const r=Router();r.get('/',protect,asyncHandler(getInsights));export default r;
