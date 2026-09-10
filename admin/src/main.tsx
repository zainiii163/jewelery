import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import { AuthProvider } from "./lib/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import ProductEdit from "./pages/ProductEdit";
import Orders from "./pages/Orders";
import Appointments from "./pages/Appointments";
import Requests from "./pages/Requests";
import PosReports from "./pages/PosReports";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:sku" element={<ProductEdit />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/requests" element={<Requests />} />
            <Route path="/reports" element={<PosReports />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);