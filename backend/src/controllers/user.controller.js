import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/users.model.js';
import { Meeting } from '../models/meeting.model.js';

export const registerUser = async (req, res) => {
    const { name, username, password } = req.body;
    if (!name || !username || !password) {
        return res.status(400).json({ message: 'All fields are required.' });
    }
    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(409).json({ message: 'Username already exists.' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({ name, username, password: hashedPassword });
        res.status(201).json({ message: 'User registered successfully.', user: { name: newUser.name, username: newUser.username } });
    } catch (err) {
        res.status(500).json({ message: 'Registration failed.', error: err.message });
    }
};

export const loginUser = async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }
    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const token = jwt.sign(
            { id: user._id, username: user.username, name: user.name },
            process.env.JWT_SECRET || 'jwtsecret',
            { expiresIn: '1h' }
        );
        res.json({ user: { name: user.name, username: user.username }, token });
    } catch (err) {
        res.status(500).json({ message: 'Login failed.', error: err.message });
    }
};

const getUserFromToken = (req) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'jwtsecret');
        return decoded;
    } catch (err) {
        return null;
    }
};

export const getUserHistory = async (req, res) => {
    const userData = getUserFromToken(req);
    if (!userData) {
        return res.status(401).json({ message: 'Invalid or missing token.' });
    }

    try {
        const meetings = await Meeting.find({ user_id: userData.username });
        res.json(meetings);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch history.', error: err.message });
    }
};

export const addToHistory = async (req, res) => {
    const userData = getUserFromToken(req);
    const { meetingCode } = req.body;

    if (!userData || !meetingCode) {
        return res.status(400).json({ message: 'Token and meeting code are required.' });
    }

    try {
        const newMeeting = await Meeting.create({
            user_id: userData.username,
            meetingCode
        });
        res.status(201).json({ message: 'Meeting added to history.', meeting: newMeeting });
    } catch (err) {
        res.status(500).json({ message: 'Failed to add meeting to history.', error: err.message });
    }
};

export const deleteMeetingFromHistory = async (req, res) => {
    const userData = getUserFromToken(req);
    const meetingId = req.params.id;

    if (!userData || !meetingId) {
        return res.status(400).json({ message: 'Token and meeting ID are required.' });
    }

    try {
        const deleted = await Meeting.findOneAndDelete({ _id: meetingId });
        if (!deleted) {
            return res.status(404).json({ message: 'Meeting not found.' });
        }
        res.json({ message: 'Meeting deleted from history.' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete meeting from history.', error: err.message });
    }
};
