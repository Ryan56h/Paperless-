import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { OrderProvider } from './context/OrderContext';

// New Pages
import LandingPage from './pages/Landing';
import Register from './pages/Auth/Register';
import Login from './pages/Auth/Login';

import GroceryOrderPage from './pages/Grocery/OrderPage';
import GroceryDisplayPage from './pages/Grocery/DisplayPage';
import GroceryRevenuePage from './pages/Grocery/RevenuePage';

import CafeOrderPage from './pages/Cafe/OrderPage';
import CafeDisplayPage from './pages/Cafe/DisplayPage';
import CafeRevenuePage from './pages/Cafe/RevenuePage';

// Existing Legacy Pages (Preserved)
import StaffOrder from './pages/StaffOrder';
import CreateInvoice from './pages/CreateInvoice';
import SendConfirmation from './pages/SendConfirmation';
import CustomerInvoice from './pages/CustomerInvoice';
import InvoiceLookup from './pages/InvoiceLookup';
import ManagerDashboard from './pages/ManagerDashboard';
import LoyaltyVoucher from './pages/LoyaltyVoucher';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <OrderProvider>
          <Routes>
            {/* Landing & Authentication */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />

            {/* Grocery Business Module */}
            <Route path="/app/grocery/order" element={<GroceryOrderPage />} />
            <Route path="/app/grocery/display" element={<GroceryDisplayPage />} />
            <Route path="/app/grocery/revenue" element={<GroceryRevenuePage />} />

            {/* Cafe Business Module */}
            <Route path="/app/cafe/order" element={<CafeOrderPage />} />
            <Route path="/app/cafe/display" element={<CafeDisplayPage />} />
            <Route path="/app/cafe/revenue" element={<CafeRevenuePage />} />

            {/* Legacy Features */}
            <Route path="/staff" element={<StaffOrder />} />
            <Route path="/staff/invoice/new" element={<CreateInvoice />} />
            <Route path="/staff/invoice/confirm" element={<SendConfirmation />} />
            <Route path="/invoice/:id" element={<CustomerInvoice />} />
            <Route path="/lookup" element={<InvoiceLookup />} />
            <Route path="/manager" element={<ManagerDashboard />} />
            <Route path="/manager/loyalty" element={<LoyaltyVoucher />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </OrderProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
