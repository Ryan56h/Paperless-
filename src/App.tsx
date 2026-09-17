import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import StaffOrder from './pages/StaffOrder';
import CreateInvoice from './pages/CreateInvoice';
import SendConfirmation from './pages/SendConfirmation';
import CustomerInvoice from './pages/CustomerInvoice';
import InvoiceLookup from './pages/InvoiceLookup';
import ManagerDashboard from './pages/ManagerDashboard';
import LoyaltyVoucher from './pages/LoyaltyVoucher';
import NfcReceiver from './pages/NfcReceiver';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/staff" replace />} />
        <Route path="/staff" element={<StaffOrder />} />
        <Route path="/staff/invoice/new" element={<CreateInvoice />} />
        <Route path="/staff/invoice/confirm" element={<SendConfirmation />} />
        <Route path="/invoice/:id" element={<CustomerInvoice />} />
        <Route path="/nhan-hoa-don" element={<NfcReceiver />} />
        <Route path="/lookup" element={<InvoiceLookup />} />
        <Route path="/manager" element={<ManagerDashboard />} />
        <Route path="/manager/loyalty" element={<LoyaltyVoucher />} />
        <Route path="*" element={<Navigate to="/staff" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
