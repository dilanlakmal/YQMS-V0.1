import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import fs from "fs";
import { Server as SocketIO } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import https from "https";
// import http from "http";

import gracefulFs from "graceful-fs";
gracefulFs.gracefulify(fs);
import dotenv from "dotenv";

export const app = express();
export const PORT = 5001;

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);
// Define a base directory for the backend root
export const __backendDir = path.resolve(__dirname, "..");

export const API_BASE_URL =
  process.env.API_BASE_URL || "https://192.167.6.207:5001";
  // process.env.API_BASE_URL || "http://localhost:5001";
  const options = {
    key: fs.readFileSync(
      path.resolve(path.dirname(__filename), "192.167.6.207-key.pem")
    ),
    cert: fs.readFileSync(
      path.resolve(path.dirname(__filename), "192.167.6.207.pem")
    )
  };

export const server = https.createServer(options,app);

// Initialize Socket.io
export const io = new SocketIO(server, {
  cors: {
    origin: "https://192.167.6.207:3001",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  }
});

// Define allowed origins once
const allowedOrigins = [
  "https://192.167.12.85:3001",
  "http://localhost:3001",
  "https://localhost:3001",
  "https://yqms.yaikh.com",
  "https://192.167.6.207:3001",
];

//http
// const allowedOrigins = [
//   "http://192.167.12.85:3001",
//   "http://localhost:3001",
//   "http://localhost:3001",
//   "http://yqms.yaikh.com",
//   "http://192.167.6.207:3001",
// ];


// CORS configuration
const corsOptions = {

  
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log("CORS blocked origin:", origin);
      callback(null, true); // Allow all origins for image proxy
    }
  },



  methods: "GET,POST,PUT,DELETE,OPTIONS,PATCH",
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Cache-Control",
    "Origin",
    "X-Requested-With",
    "Accept",
    "Pragma",
    "Expires",
    "Last-Modified",
    "If-Modified-Since",
    "If-None-Match",
    "ETag",
    "Mode"
  ],
  exposedHeaders: [
    "Content-Length",
    "Content-Type",
    "Cache-Control",
    "Last-Modified",
    "ETag"
  ],
  credentials: true, // Set to false for broader compatibility
  optionsSuccessStatus: 204
};

// CORS configuration http
// const corsOptions = {
//   origin: (origin, callback) => {
//     // Allow requests with no origin (like mobile apps or curl requests)
//     if (!origin) {
//       callback(null, true);
//       return;
//     }
    
//     // Allow all local network IPs (192.167.x.x, 192.168.x.x, 10.x.x.x, 172.16-31.x.x)
//     const localNetworkPattern = /^http:\/\/(192\.(167|168)\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+|localhost|127\.0\.0\.1)(:\d+)?$/;
    
//     if (allowedOrigins.includes(origin) || localNetworkPattern.test(origin)) {
//       callback(null, true);
//     } else {
//       console.log("CORS blocked origin:", origin);
//       callback(null, true); // Allow all origins for image proxy
//     }
//   },
//   methods: "GET,POST,PUT,DELETE,OPTIONS,PATCH",
//   allowedHeaders: [
//     "Content-Type",
//     "Authorization",
//     "Cache-Control",
//     "Origin",
//     "X-Requested-With",
//     "Accept",
//     "Pragma",
//     "Expires",
//     "Last-Modified",
//     "If-Modified-Since",
//     "If-None-Match",
//     "ETag",
//     "Mode"
//   ],
//   exposedHeaders: [
//     "Content-Length",
//     "Content-Type",
//     "Cache-Control",
//     "Last-Modified",
//     "ETag"
//   ],
//   credentials: true, // Set to false for broader compatibility
//   optionsSuccessStatus: 204
// };

// Apply CORS globally
app.use(cors(corsOptions));

// Body parser configuration
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(express.json());

// Static file serving with simplified CORS
app.use(
  "/storage",
  express.static(path.join(__backendDir, "public/storage"), {
    setHeaders: (res, path) => {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Cache-Control", "public, max-age=3600");
    }
  })
);

app.use(
  "/storage/PivotY",
  express.static(path.join(__backendDir, "storage/PivotY"), {
    setHeaders: (res, path) => {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Cache-Control", "public, max-age=3600");
    }
  })
);

app.use(
  "/public",
  express.static(path.join(__backendDir, "public"), {
    setHeaders: (res, path) => {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Cache-Control", "public, max-age=3600");
    }
  })
);

// Socket.io connection handler
io.on("connection", (socket) => {
  //console.log("A client connected:", socket.id);

  socket.on("disconnect", () => {
    //console.log("A client disconnected:", socket.id);
  });
});
