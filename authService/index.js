const express = require("express");
const dotenv = require("dotenv");

const publicKeyRoute = require("./routes/auth/publicKeyRoute");
const loginRoute = require("./routes/auth/loginRoute");

dotenv.config();
const{ correlationIdMiddleware }= require("../correlationId");
const rateLimit = require("express-rate-limit");
const { head } = require("../studentService/routes/studentRoute");

const limiter = rateLimit({
  windowMs: 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  headers: true,
});

// Initialize express app
const app = express();

// Middleware
app.use(express.json());

// Public Key
app.use("/.well-known/jwks.json", publicKeyRoute);

// Routes
app.use("/api/login", loginRoute);
app.use(correlationIdMiddleware);
// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Auth Server running on port ${PORT}`);
});
