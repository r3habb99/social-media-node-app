import express from "express";
import userRoutes from "./userRoutes";
import notificationRoutes from "./notificationRoutes";
import postRoutes from "./postRoutes";
const app = express();

app.use("/user", userRoutes);
app.use("/notification", notificationRoutes);
app.use("/post", postRoutes);

export default app;
