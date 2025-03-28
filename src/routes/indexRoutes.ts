import express from "express";
import userRoutes from "./userRoutes";
import notificationRoutes from "./notificationRoutes";
const app = express();

app.use("/user", userRoutes);
app.use("/notification", notificationRoutes);

export default app;
