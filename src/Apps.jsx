import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './page.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { supabase } from '@/lib/supabase';
import React from 'react';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

// Debug component to check environment and database status
const DebugInfo = () => {
  const [envStatus, setEnvStatus] = React.useState({});
  const [dbStatus, setDbStatus] = React.useState({});

  React.useEffect(() => {
    // Check environment variables
    const envCheck = {
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL ? 'SET' : 'NOT SET',
      supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET',
      googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET',
    };
    setEnvStatus(envCheck);

    // Check database connection
    const checkDatabase = async () => {
      try {
        const { data, error } = await supabase.from('questions').select('count');
        const { data: guideData, error: guideError } = await supabase.from('study_guides').select('count');
        
        setDbStatus({
          questions: error ? 'ERROR' : `${data?.length || 0} questions`,
          studyGuides: guideError ? 'ERROR' : `${guideData?.length || 0} study guides`,
          connection: error || guideError ? 'FAILED' : 'SUCCESS'
        });
      } catch (err) {
        setDbStatus({
          connection: 'FAILED',
          error: err.message
        });
      }
    };

    checkDatabase();
  }, []);

  return (
    <div className="fixed top-4 right-4 bg-black text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h3 className="font-bold mb-2">Debug Info</h3>
      
      <div className="mb-3">
        <h4 className="font-semibold">Environment Variables:</h4>
        <div className="text-green-400">{envStatus.supabaseUrl}</div>
        <div className="text-green-400">{envStatus.supabaseKey}</div>
        <div className="text-green-400">{envStatus.googleClientId}</div>
      </div>
      
      <div>
        <h4 className="font-semibold">Database Status:</h4>
        <div className={dbStatus.connection === 'SUCCESS' ? 'text-green-400' : 'text-red-400'}>
          {dbStatus.connection}
        </div>
        <div className="text-blue-400">{dbStatus.questions}</div>
        <div className="text-blue-400">{dbStatus.studyGuides}</div>
        {dbStatus.error && <div className="text-red-400">{dbStatus.error}</div>}
      </div>
    </div>
  );
};

const AuthenticatedApp = () => {
  const { user, isAuthenticated, isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // If user is not authenticated, redirect to login
  if (!isAuthenticated || !user) {
    navigateToLogin();
    return null;
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


// Error boundary component
const ErrorBoundary = ({ children }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center p-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Something went wrong</h1>
        <p className="text-slate-600 mb-4">The application encountered an error.</p>
        <p className="text-slate-500 text-sm mb-4">Check browser console (F12) for details.</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-slate-900 text-white rounded hover:bg-slate-800"
        >
          Reload Page
        </button>
      </div>
    </div>
  );
};

function App() {
  console.log('App component rendering...');

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <ErrorBoundary>
            <AuthenticatedApp />
          </ErrorBoundary>
        </Router>
        <Toaster />
        <DebugInfo />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
