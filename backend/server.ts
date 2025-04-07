// src/server.ts
import express from "express";
import config from "./config/index";
import connectDB from "./config/db";
import errorMiddleware from "./middlewares/error.middleware";
import mainRoutes from "./routes/index"
import cors from "cors";

const app = express();

// ✅ CORS config
const allowedOrigins = ["http://localhost:3000"];
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Middleware to parse JSON bodies
app.use(express.json());

// Example route
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url}`);
  // console.log('Body:', req.body);
  next();
});


// Place your other routes here
app.use("/api/v1", mainRoutes);

// Error handling middleware should be added after routes
app.use(errorMiddleware);

// Connect to the database and start the server
const PORT = config.port || 5000;
app.listen(PORT, async () => {
  await connectDB();
  console.log(`Server is running on port ${PORT}`);
});
