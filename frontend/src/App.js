import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { routes } from './routes';
import ProtectedRoute, { PublicRoute } from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      {routes.map((route, index) => (
        <Route
          key={index}
          path={route.path}
          element={
            route.type === 'public' ? (
              route.path === '/' ? (
                <route.component />
              ) : (
                <PublicRoute>
                  <route.component />
                </PublicRoute>
              )
            ) : (
              <ProtectedRoute>
                <route.component />
              </ProtectedRoute>
            )
          }
        />
      ))}
    </Routes>
  );
}

export default App;