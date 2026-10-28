import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";

const app = express();

app.use(helmet());

app.use(
    cors({
        origin: process.env.FRONTEND_URL ?? "http://localhost:5173",
        credentials: true,
    }),
);

app.use(express.json({ limit: "10kb" }));

app.use(
    rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 100,
        standardHeaders: "draft-8",
        legacyHeaders: false,
    }),
);

app.get("/api/health", (_req, res,) => {
    res.status(200).json({
        status: "ok",
        message: "LMS API is running",
    });
});

export default app;             