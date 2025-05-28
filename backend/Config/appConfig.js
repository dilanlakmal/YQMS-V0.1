import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import https from 'https';
import { Server as SocketIO } from "socket.io";

const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(path.resolve(__filename, '..')); 

export const app = express();
export const PORT = process.env.PORT || 5000;
// config.js
import dotenv from "dotenv";
dotenv.config();

export const API_BASE_URL =
  // process.env.API_BASE_URL || "https://192.167.7.252:5000";
  process.env.API_BASE_URL || "https://192.167.8.235:5000";

const options = {
   key: fs.readFileSync(path.resolve(path.dirname(__filename), '192.167.8.235-key.pem')),
  cert: fs.readFileSync(path.resolve(path.dirname(__filename), '192.167.8.235.pem'))
};

export const server = https.createServer(options, app);

export const io = new SocketIO(server, {
  cors: {
    origin: ["https://192.167.8.235:3001", "http://localhost:3001", "https://localhost:3001"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  },
});

// Middleware
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Static file serving
app.use('/public', express.static(path.join(__dirname, '../public')));
app.use('/storage', express.static(path.join(__dirname, '..', 'public', 'storage')));

const allowedOrigins = ["https://192.167.8.235:3001", "http://localhost:3001", "https://localhost:3001"];
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  })
);

app.use((req, res, next) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  next();
});

io.on("connection", (socket) => {
  // console.log("A client connected via appConfig:", socket.id);
  socket.on("disconnect", () => {
    // console.log("A client disconnected via appConfig:", socket.id);
  });
});

