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
import Customers from "./pages/Customers";
import GoldRates from "./pages/GoldRates";
import Expenses from "./pages/Expenses";
import Repairs from "./pages/Repairs";
import Payments from "./pages/Payments";
import Staff from "./pages/Staff";
import Settings from "./pages/Settings";
import Categories from "./pages/Categories";
import SalesRecords from "./pages/SalesRecords";

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
            <Route path="/customers" element={<Customers />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/requests" element={<Requests />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/sales" element={<SalesRecords />} />
            <Route path="/gold-rates" element={<GoldRates />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/repairs" element={<Repairs />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/staff" element={<Staff />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/reports" element={<PosReports />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
