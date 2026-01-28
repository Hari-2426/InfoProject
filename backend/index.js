const express = require("express");
const cors = require("cors");
const app = express();
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth")
const taskRoutes = require("./routes/task")
const requestRoutes = require("./routes/request")
const authmiddleware = require("./middleware/auth-middleware");
dotenv.config();

app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

app.use(express.json());
app.get("/api/ping", (req, res) => res.json({ message: "pong" }));

app.use(cors({
    origin: (origin, callback) => callback(null, true),
    credentials: true,
}));
app.use(cookieParser());


app.use("/api/auth", authRoutes);
app.use("/api/task", authmiddleware, taskRoutes);
app.use("/api/request", authmiddleware, requestRoutes);

connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
