import express from "express";
import userRoutes from "./userRoutes";
import notificationRoutes from "./notificationRoutes";
import postRoutes from "./postRoutes";
import chatRoutes from "./chatRoutes";
import messageRoutes from "./messageRoutes";
const app = express();

app.use("/user", userRoutes);
app.use("/notification", notificationRoutes);
app.use("/post", postRoutes);
app.use("/chat", chatRoutes);
app.use("/message", messageRoutes);

export default app;
