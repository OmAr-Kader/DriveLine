import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db';
import userRoutes from './routes/userRoutes';
import authRoutes from './routes/authRoutes';
import aiSessionRoutes from './routes/aiSessionRoutes';
import aiMessageRoutes from './routes/aiMessageRoutes';
import fixServiceRoutes from './routes/fixServiceRoutes';
import courseRoutes from './routes/courseRoutes';
import videoRoutes from './routes/shortVideoRoutes';
import serviceRoutes from './routes/serviceRoutes';

dotenv.config();
connectDB();

const app = express();

app.use('', authRoutes); // Base Route Removed
app.use('', userRoutes); // Base Route Removed
app.use('', aiSessionRoutes); // Base Route Removed
app.use('', aiMessageRoutes); // Base Route Removed
app.use('', fixServiceRoutes); // Base Route Removed
app.use('', courseRoutes); // Base Route Removed
app.use('', videoRoutes); // Base Route Removed
app.use('', serviceRoutes); // Base Route Removed

app.set('trust proxy', 1)

app.use(express.json());

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
