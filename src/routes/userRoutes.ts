import express from "express";
import { register, loginUser } from "../controllers/user.controller";

const app = express();

app.use("/register", register);
app.use("/login", loginUser);

export default app;
