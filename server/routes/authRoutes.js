import {Router} from 'express';import {register,login,me} from '../controllers/authController.js';import protect from '../middleware/authMiddleware.js';import asyncHandler from '../utils/asyncHandler.js';
const r=Router();r.post('/register',asyncHandler(register));r.post('/login',asyncHandler(login));r.get('/me',protect,asyncHandler(me));export default r;
