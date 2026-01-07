import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import paymentRoutes from "./routes/payment.routes";

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/api/payments", paymentRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
