import express from 'express';
import { authenticateJWT } from '../middleware/jwt.js';
import { registerUser, loginUser, addToHistory, getUserHistory, deleteMeetingFromHistory } from '../controllers/user.controller.js';

const router = express.Router();

router.post('/login', loginUser);
router.post('/register', registerUser);
router.post("/add_to_activity", authenticateJWT, addToHistory);
router.get("/get_all_activity", authenticateJWT, getUserHistory);
router.delete('/delete_meeting/:id', authenticateJWT, deleteMeetingFromHistory);

export default router;