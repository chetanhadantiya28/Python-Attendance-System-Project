import express from "express";
import mongoose from "mongoose";
import cors from "cors";

import loginRoute from "./api/login.js";
import coursesRoute from "./api/courses.js";
import attendanceRoute from "./api/attendance.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/login", loginRoute);
app.use("/api/courses", coursesRoute);
app.use("/api/attendance", attendanceRoute);

mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log("DB connected");
});

app.get("/", (req, res) => res.send("API running"));

app.listen(10000, () => console.log("Server running"));