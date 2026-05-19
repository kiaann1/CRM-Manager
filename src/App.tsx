import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { LoginPage } from './components/auth/LoginPage'
import { InviteAcceptPage } from './pages/InviteAcceptPage'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { AppLayout } from './components/layout/AppLayout'
import { CrmProvider } from './context/CrmContext'
import { ToastProvider } from './context/ToastContext'
import { Toaster } from './components/ui/Toaster'
import { AutomationsPage } from './pages/AutomationsPage'
import { BoardsPage } from './pages/BoardsPage'
import { CalendarPage } from './pages/CalendarPage'
import { CompaniesPage } from './pages/CompaniesPage'
import { ContactsPage } from './pages/ContactsPage'
import { Dashboard } from './pages/Dashboard'
import { DealsPage } from './pages/DealsPage'
import { DocumentEditorPage } from './pages/DocumentEditorPage'
import { DocumentsPage } from './pages/DocumentsPage'
import { GoalsPage } from './pages/GoalsPage'
import { InboxPage } from './pages/InboxPage'
import { IntegrationsPage } from './pages/IntegrationsPage'
import { LeadsPage } from './pages/LeadsPage'
import { MarketingPage } from './pages/MarketingPage'
import { ProductsPage } from './pages/ProductsPage'
import { ReportsPage } from './pages/ReportsPage'
import { SettingsPage } from './pages/SettingsPage'
import { SupportPage } from './pages/SupportPage'
import { TasksPage } from './pages/TasksPage'

export default function App() {
  return (
    <ToastProvider>
      <CrmProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/invite/:token" element={<InviteAcceptPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="contacts" element={<ContactsPage />} />
              <Route path="leads" element={<LeadsPage />} />
              <Route path="companies" element={<CompaniesPage />} />
              <Route path="deals" element={<DealsPage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="tasks" element={<TasksPage />} />
              <Route path="boards" element={<BoardsPage />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="goals" element={<GoalsPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="automations" element={<AutomationsPage />} />
              <Route path="integrations" element={<IntegrationsPage />} />
              <Route path="marketing" element={<MarketingPage />} />
              <Route path="support" element={<SupportPage />} />
              <Route path="inbox" element={<InboxPage />} />
              <Route path="docs" element={<DocumentsPage />} />
              <Route path="docs/new" element={<DocumentEditorPage />} />
              <Route path="docs/:docId" element={<DocumentEditorPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
      </CrmProvider>
    </ToastProvider>
  )
}
