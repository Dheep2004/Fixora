import { createContext, useContext, useState } from 'react';

// Keeps the logged-in user available to every page.
// The user (and later the JWT token) is saved in localStorage so a refresh keeps you logged in.
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('fixoraUser')));

  function login(userData) {
    localStorage.setItem('fixoraUser', JSON.stringify(userData));
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem('fixoraUser');
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
