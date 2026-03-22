import express from "express";
import morgan from "morgan";
import cors from "cors";
import Routes from "./src/routes/routes.js";
import { PORT } from "./config.js";


var corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "x-payment",
    "X-PAYMENT",
    "X-Payment",
    "payment-signature",
    "Payment-Signature",
    "payment-required",
    "Payment-Required",
    "x-secret-key",
  ],
  exposedHeaders: [
    "x-payment",
    "X-PAYMENT",
    "X-Payment",
    "payment-required",
    "Payment-Required",
  ],
  optionsSuccessStatus: 204,
};

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(morgan("dev"));
app.use(Routes);
app.use(express.static("public"));
app.listen(PORT);

console.log("Server on port", PORT);

/*import { makeTransfer } from "./src/services/thirdweb/playground/ServerWallet.js";

const transfer =  await makeTransfer("0x27f4D86af5a518D778BDBd753ACdBF8c9d81EEb9", "10", "0x68857773a075a4Bd07ED6891c95cACD68A047b72");
console.log(transfer);*/