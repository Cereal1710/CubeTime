import { createBrowserRouter, Navigate } from 'react-router-dom';
import { App } from './App';
import { TimerPage } from '../pages/TimerPage';
import { SmartCubePage } from '../pages/SmartCubePage';
import { StatisticsPage } from '../pages/StatisticsPage';
import { HistoryPage } from '../pages/HistoryPage';
import { TrainingPage } from '../pages/TrainingPage';
import { SettingsPage } from '../pages/SettingsPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <TimerPage />
      },
      {
        path: 'smart-cube',
        element: <SmartCubePage />
      },
      {
        path: 'statistics',
        element: <StatisticsPage />
      },
      {
        path: 'history',
        element: <HistoryPage />
      },
      {
        path: 'training',
        element: <TrainingPage />
      },
      {
        path: 'settings',
        element: <SettingsPage />
      },
      {
        path: '*',
        element: <Navigate to="/" replace />
      }
    ]
  }
]);

