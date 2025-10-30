const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const cors = require("cors");

dotenv.config();

const connectDB = require("./config/db");
const colors = require("colors");

const authRoutes = require("./modules/authentication/routes/authRoutes");
const otpRoutes = require("./modules/otp/routes/otpRoutes");
const userRoutes = require("./modules/user/routes/userRoutes");
const messageRouter = require("./modules/message/routes/messageRoutes");
const groupRouter = require("./modules/group/routes/groupRoutes");
const groupMessageController = require("./modules/groupMessage/routes/groupMessageRoutes");
const notificationRouter = require("./modules/notification/routes/notificationRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const { initializeSocket } = require("./socket/socketHandler");

const startServer = async () => {
  try {
    await connectDB();

    const app = express();

    app.use(
      cors({
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
      })
    );

    app.use(express.json());

    app.use(
      "/uploads",
      express.static(path.join(__dirname, "modules", "user", "uploads"))
    );
    app.use(
      "/uploads/group",
      express.static(path.join(__dirname, "modules", "group", "uploads"))
    );
    app.use("/auth", authRoutes);
    app.use("/otp", otpRoutes);
    app.use("/users", userRoutes);
    app.use("/messages", messageRouter);
    app.use("/group", groupRouter);
    app.use("/groupsMsg", groupMessageController);
    app.use("/notifications", notificationRouter);
    app.use(notFound);
    app.use(errorHandler);

    const PORT = process.env.PORT || 3001;
    const server = app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`.yellow.bold);
    });

    const io = require("socket.io")(server, {
      pingTimeout: 60000,
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
      },
    });

    app.set("io", io);
    initializeSocket(io);
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
};

startServer();
