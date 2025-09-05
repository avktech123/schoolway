import Home from './pages/Home';
import Login from './pages/Login';
// import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';

export const routes = [
  { path: '/', component: Home, exact: true, type: 'public' },
  { path: '/login', component: Login, type: 'public' },
  // { path: '/signup', component: Signup, type: 'public' },
  { path: '/dashboard', component: Dashboard, type: 'protected' },
  { path: '/profile', component: Profile, type: 'protected' }
];