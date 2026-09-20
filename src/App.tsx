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
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';

function AppRedirect() {
  const { business, user } = useAuth();
  const type = business?.type || user?.businessType || 'grocery';
  return <Navigate to={type === 'cafe' ? '/app/cafe/order' : '/app/grocery/order'} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <OrderProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/lookup" element={<InvoiceLookup />} />
            <Route path="/invoice/:id" element={<CustomerInvoice />} />

            {/* Authenticated POS Routes */}
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <AppRedirect />
                </ProtectedRoute>
              }
            />

            {/* Grocery Business Module */}
            <Route
              path="/app/grocery/order"
              element={
                <ProtectedRoute requiredBusinessType="grocery">
                  <GroceryOrderPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/grocery/display"
              element={
                <ProtectedRoute requiredBusinessType="grocery">
                  <GroceryDisplayPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/grocery/revenue"
              element={
                <ProtectedRoute requiredBusinessType="grocery">
                  <GroceryRevenuePage />
                </ProtectedRoute>
              }
            />

            {/* Cafe Business Module */}
            <Route
              path="/app/cafe/order"
              element={
                <ProtectedRoute requiredBusinessType="cafe">
                  <CafeOrderPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/cafe/display"
              element={
                <ProtectedRoute requiredBusinessType="cafe">
                  <CafeDisplayPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/cafe/revenue"
              element={
                <ProtectedRoute requiredBusinessType="cafe">
                  <CafeRevenuePage />
                </ProtectedRoute>
              }
            />

            {/* Staff & Manager Features */}
            <Route
              path="/staff"
              element={
                <ProtectedRoute>
                  <StaffOrder />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/invoice/new"
              element={
                <ProtectedRoute>
                  <CreateInvoice />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/invoice/confirm"
              element={
                <ProtectedRoute>
                  <SendConfirmation />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager"
              element={
                <ProtectedRoute>
                  <ManagerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/loyalty"
              element={
                <ProtectedRoute>
                  <LoyaltyVoucher />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </OrderProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
