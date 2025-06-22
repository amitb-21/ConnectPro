import express from 'express';
import { authenticateJWT } from '../middleware/jwt.js';
import { registerUser, loginUser, addToHistory, getUserHistory, deleteMeetingFromHistory  } from '../controllers/user.controller.js';

const router = express.Router();

router.post('/login', loginUser);
router.post('/register', registerUser);
router.post("/add_to_activity", addToHistory);
router.get("/get_all_activity",getUserHistory);
router.delete('/user/delete_meeting/:id', deleteMeetingFromHistory);

export default router;