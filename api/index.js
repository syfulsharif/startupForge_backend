import app from '../src/app.js';
import connectDB from '../src/config/db.js';

// Establish a connection to MongoDB before serving requests
await connectDB();

export default app;
