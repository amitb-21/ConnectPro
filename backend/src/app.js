import express from 'express';
import {createServer} from 'node:http';

import {Server} from 'socket.io';
import dotenv from 'dotenv';

import mongoose from 'mongoose';
import {connectToSocket} from './controllers/socketManager.js';

import cors from 'cors';
import authRoutes from './routes/auth.routes.js';

dotenv.config();

const app = express();
const server = createServer(app);
const io = connectToSocket(server);

app.set("port", process.env.PORT || 5000);
app.use(cors());
app.use(express.json({limit: "40kb"}))
app.use(express.urlencoded({limit: "40kb", extended: true}));


app.use('/auth/user', authRoutes);

const start = async () => {
    try {
        app.set("mongo_user");
        const connectionDb = await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB connected successfully");
        const PORT = app.get("port");
        server.listen(PORT, () => {
            console.log(`🚀 Server is running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}


start();