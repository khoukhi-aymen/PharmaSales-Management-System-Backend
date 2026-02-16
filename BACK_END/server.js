const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const session = require("express-session");
const AuthRoutes = require("./routers/AuthRouter");
const StockRouter = require("./routers/StockRouter");
const ProfomaRouter = require("./routers/ProformaRouter");
const VenteRouter = require("./routers/VenteRouter");
const AchatRouter = require("./routers/AchatRouter");

dotenv.config();
const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true, // IMPORTANT : autorise les cookies session
}));

// SESSION CONFIG
app.use(
  session({
    secret: "MON_SECRET_SUPER_LONG_ET_SECURISE",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // mettre true si HTTPS
      maxAge: 24 * 60 * 60 * 1000, // 1 jour
    },
  })
);

// Routes
app.use("/", AuthRoutes);
app.use("/", StockRouter);
app.use("/", ProfomaRouter);
app.use("/", VenteRouter);
app.use("/", AchatRouter);





// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully!");
    app.listen(8000, () => console.log("Server running on http://localhost:8000"));
  })
  .catch((err) => console.error("MongoDB connection failed:", err));
