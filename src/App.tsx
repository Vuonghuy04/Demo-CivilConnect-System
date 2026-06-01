import { Navigate, Route, Routes } from 'react-router-dom';

import { Layout } from './components/Layout';
import { Appointments } from './pages/Appointments';
import { Dashboard } from './pages/Dashboard';
import { FeedbackReports } from './pages/FeedbackReports';
import { RequestDetail } from './pages/RequestDetail';
import { ServiceRequests } from './pages/ServiceRequests';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/requests" element={<ServiceRequests />} />
        <Route path="/requests/:id" element={<RequestDetail />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/reports" element={<FeedbackReports />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
