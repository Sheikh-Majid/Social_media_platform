import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv"
import connectDB from "./utils/db.js";
import userRoutes from "./router/user.router.js"

dotenv.config();

const app = express();
// middleware
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());
const corsOptions = {
    origin:'http://localhost:3000',
    credentials:true
}

app.use(cors(corsOptions));
const PORT = process.env.PORT || 3000;

// router

app.use("/api/v1/user", userRoutes)
app.use("/api/v1/post", userRoutes);

app.listen(PORT, () => {
    connectDB()
  console.log(`Server is running at http://localhost:${PORT}`);
});