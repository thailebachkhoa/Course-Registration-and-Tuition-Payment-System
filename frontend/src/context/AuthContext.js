import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [stage, setStage] = useState('create_class');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    const stageData = localStorage.getItem('stage');
    if (token && userData) {
      setUser(JSON.parse(userData));
      setStage(stageData || 'create_class');
    }
    setLoading(false);
  }, []);

  const login = (userData, token, currentStage) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('stage', currentStage);
    setUser(userData);
    setStage(currentStage);
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    setStage('create_class');
  };

  const updateStage = (newStage) => {
    localStorage.setItem('stage', newStage);
    setStage(newStage);
  };

  return (
    <AuthContext.Provider value={{ user, stage, loading, login, logout, updateStage }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);