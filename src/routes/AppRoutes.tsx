import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminLayout } from '../components/layout/AdminLayout.tsx'
import { ProtectedRoute } from '../components/layout/ProtectedRoute.tsx'
import { PublicLayout } from '../components/layout/PublicLayout.tsx'
import { DashboardPage } from '../pages/admin/Dashboard/DashboardPage.tsx'
import { LoginPage } from '../pages/admin/Login/LoginPage.tsx'
import { EditThemePage } from '../pages/admin/Themes/EditThemePage.tsx'
import { NewThemePage } from '../pages/admin/Themes/NewThemePage.tsx'
import { AdminThemesPage } from '../pages/admin/Themes/AdminThemesPage.tsx'
import { HomePage } from '../pages/public/Home/HomePage.tsx'
import { ThemeDetailsPage } from '../pages/public/ThemeDetails/ThemeDetailsPage.tsx'
import { ThemesPage } from '../pages/public/Themes/ThemesPage.tsx'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/temas" element={<ThemesPage />} />
        <Route path="/tema/:slug" element={<ThemeDetailsPage />} />
      </Route>
      <Route path="/admin/login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/admin" element={<DashboardPage />} />
        <Route path="/admin/themes" element={<AdminThemesPage />} />
        <Route path="/admin/themes/new" element={<NewThemePage />} />
        <Route path="/admin/themes/:id/edit" element={<EditThemePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
