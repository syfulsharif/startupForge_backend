import app from './src/app.js';
import connectDB from './src/config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`[StartupForge Server] Running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to start server due to Database Connection error:', err.message);
  process.exit(1);
});
