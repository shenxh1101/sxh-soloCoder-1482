import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout/Layout';
import Dashboard from '@/pages/Dashboard';
import Workers from '@/pages/Workers';
import Attendance from '@/pages/Attendance';
import Salary from '@/pages/Salary';
import Advances from '@/pages/Advances';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/workers" element={<Workers />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/salary" element={<Salary />} />
          <Route path="/advances" element={<Advances />} />
        </Route>
      </Routes>
    </Router>
  );
}
