import { createBrowserRouter } from 'react-router-dom';
import RootLayout from '@/layouts/RootLayout';
import PublicLayout from '@/layouts/PublicLayout';
import ProtectedLayout from '@/layouts/ProtectedLayout';
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        element: <PublicLayout />,
        children: [
          {
            index: true,
            element: <HomePage />,
          },
          {
            path: 'login',
            element: <LoginPage />,
          },
        ],
      },
      {
        element: <ProtectedLayout />,
        children: [
          {
            path: 'dashboard',
            element: <DashboardPage />,
          },
        ],
      },
    ],
  },
]);

