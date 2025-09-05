import React, { createContext, useContext, useReducer, useEffect } from 'react';
import Cookies from 'js-cookie';

const AppContext = createContext();

const initialState = {
  user: null,
  token: null,
  loading: true,
};

const appReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_USER':
      const { user, token } = action.payload;
      console.log('Setting user:', action);
      if (token) {
        Cookies.set('token', token, { expires: 7 });
        Cookies.set('user', JSON.stringify(user), { expires: 7 });
      }
      return { ...state, user, token, loading: false };
    case 'LOGOUT':
      Cookies.remove('token');
      Cookies.remove('user');
      return { ...state, user: null, token: null };
    case 'RESTORE_SESSION':
      return { ...state, user: action.payload.user, token: action.payload.token, loading: false };
    default:
      return state;
  }
};

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    const token = Cookies.get('token');
    const userData = Cookies.get('user');
    console.log('Restoring session with token:', token, 'and userData:=======>', userData);
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        dispatch({ type: 'RESTORE_SESSION', payload: { user, token } });
      } catch (error) {
        Cookies.remove('token');
        Cookies.remove('user');
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};