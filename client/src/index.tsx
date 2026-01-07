import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";
import { Elements } from "@stripe/stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import App from "./App";
import { CurrencyProvider } from "./context/CurrencyContext";
import "./index.css";

const stripePromise = loadStripe(
  process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || ""
);

ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter>
      <Elements stripe={stripePromise}>
        <CurrencyProvider>
          <App />
        </CurrencyProvider>
      </Elements>
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById("root")
);
