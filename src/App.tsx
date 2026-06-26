import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/ui/Toast';
import { AppShell } from './components/layout/AppShell';
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { Editor } from './pages/Editor';
import { BulkEdit } from './pages/BulkEdit';
import { MergeSplit } from './pages/MergeSplit';
import { Templates } from './pages/Templates';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          {/* Landing page — no sidebar */}
          <Route path="/" element={<Landing />} />

          {/* App shell with sidebar */}
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/editor" element={<Editor />} />
            <Route path="/bulk" element={<BulkEdit />} />
            <Route path="/merge" element={<MergeSplit />} />
            <Route path="/templates" element={<Templates />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
}
