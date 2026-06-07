import { createBrowserRouter } from 'react-router-dom'
import MainLayout from '../components/layout/MainLayout'
import Home from '../pages/Home'
import Dashboard from '../pages/Dashboard'
import Verify from '../pages/Verify'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        path: 'verify/:id',
        element: <Verify />,
      },
      {
        path: 'verify', // Fallback verify page with search input
        element: <Verify />,
      }
    ],
  },
])
