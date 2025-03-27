import express from "express";
import userRoutes from "./userRoutes";
const app = express();

app.use("/user", userRoutes);

export default app;
