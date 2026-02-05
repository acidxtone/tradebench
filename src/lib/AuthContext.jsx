import React, { createContext, useState, useContext, useEffect } from 'react';
import { api } from '@/api/supabaseClient';
import { createPageUrl } from '@/utils';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  useEffect(() => {
    checkAppState();
    
    // Set up auth state listener
    const { data: { subscription } } = api.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          try {
            const currentUser = await api.auth.me();
            setUser(currentUser);
            setIsAuthenticated(true);
            setAuthError(null);
          } catch (error) {
            console.error('Auth state change error:', error);
            setAuthError({ type: 'unknown', message: error.message || 'Authentication error' });
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsAuthenticated(false);
          setAuthError(null);
        }
        setIsLoadingAuth(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkAppState = async () => {
    try {
      setIsLoadingPublicSettings(true);
      setIsLoadingAuth(true);
      setAuthError(null);
      
      // Check if user is authenticated
      try {
        const currentUser = await api.auth.me();
        setUser(currentUser);
        setIsAuthenticated(true);
        setAppPublicSettings({ id: 'supabase', public_settings: {} });
        
        // Log user activity
        await api.appLogs.logUserInApp();
      } catch (authError) {
        // User is not authenticated - this is normal for Login page
        console.log('User not authenticated - redirecting to login');
        setUser(null);
        setIsAuthenticated(false);
        setAuthError(null);
        setAppPublicSettings({ id: 'supabase', public_settings: {} });
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      
      // Check if it's an authentication error
      if (error.message?.includes('User not authenticated') || error.message?.includes('Invalid token')) {
        // User is not logged in - this is normal for Login page
        // Don't show error, just set unauthenticated state
        setUser(null);
        setIsAuthenticated(false);
        setAuthError(null);
      } else {
        // Other error - show to user
        setAuthError({ type: 'unknown', message: error.message || 'An unexpected error occurred' });
      }
    } finally {
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
    }
  };

  const signIn = async (email, password) => {
    try {
      setAuthError(null);
      const result = await api.auth.signIn(email, password);
      
      if (result.user) {
        const currentUser = await api.auth.me();
        setUser(currentUser);
        setIsAuthenticated(true);
        return { success: true };
      }
      
      return { success: false, message: 'Sign in failed' };
    } catch (error) {
      const message = error.message || 'Sign in failed';
      setAuthError({ type: 'auth_failed', message });
      return { success: false, message };
    }
  };

  const signInWithGoogle = async () => {
    try {
      setAuthError(null);
      const { data, error } = await api.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      
      if (error) {
        setAuthError({ type: 'auth_failed', message: error.message });
        return { success: false, message: error.message };
      }
      
      return { success: true };
    } catch (error) {
      const message = error.message || 'Google sign in failed';
      setAuthError({ type: 'auth_failed', message });
      return { success: false, message };
    }
  };

  const signUp = async (email, password, fullName) => {
    try {
      setAuthError(null);
      const result = await api.auth.signUp(email, password, fullName);
      
      if (result.user) {
        return { success: true, message: 'Account created successfully! Please check your email to verify.' };
      }
      
      return { success: false, message: 'Sign up failed' };
    } catch (error) {
      const message = error.message || 'Sign up failed';
      setAuthError({ type: 'auth_failed', message });
      return { success: false, message };
    }
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    api.auth.logout();
    if (shouldRedirect) {
      window.location.reload();
    }
  };

  const navigateToLogin = () => {
    window.location.href = createPageUrl('Login');
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      logout,
      navigateToLogin,
      checkAppState,
      signIn,
      signInWithGoogle,
      signUp
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
