import express from 'express';
const app = express();
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { connectDB } from './config/dbConnect.js';
import errorMiddleware from './middlewares/errors.js';


// const path = require('path')
//Handle Uncaught exceptions
process.on('uncaughtException', (err) => {
    console.log(`Error: ${err}`);
    console.log('Shutting down the server due to Uncaught Exception');
    process.exit(1);
}
)

dotenv.config({ path: 'backend/config/config.env' });
// Connect to database
connectDB();
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
// Import all routes

import auth from './routes/auth.js';


app.use('/api/v1', auth);

// Middleware to handle errors
app.use(errorMiddleware);
const server = app.listen(process.env.PORT, () => {
    console.log(`Server on port  ${process.env.PORT} in ${process.env.NODE_ENV} mode`);
})

//Handle Unhandled Promise rejections
process.on('unhandledRejection', err => {
    console.log(`Error: ${err.message}`);
    console.log('Shutting down the server due to Unhandled Promise rejection');
    server.close(() => {
        process.exit(1);
    })
}
)