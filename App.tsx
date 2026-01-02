import React, { useState, useCallback, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CountryProvider } from './contexts/CountryContext';
import { Navigation } from './components/Navigation';
import { LandingPage } from './pages/LandingPage';
import { Dashboard } from './pages/Dashboard';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Invoice } from './types';

const AppContent: React.FC = () => {
    const [excelInvoices, setExcelInvoices] = useState<Invoice[]>([]);
    const [excelError, setExcelError] = useState<string | null>(null);
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    const handleExcelInvoicesParsed = useCallback((invoices: Invoice[]) => {
        setExcelInvoices(invoices);
        setExcelError(null);
    }, []);

    const handleExcelError = useCallback((error: string) => {
        setExcelError(error);
    }, []);

    // Show navigation only on authenticated routes
    const showNavigation = isAuthenticated && (location.pathname === '/dashboard' || location.pathname.startsWith('/dashboard'));

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
            {showNavigation && (
            <Navigation 
                onExcelInvoicesParsed={handleExcelInvoicesParsed}
                onExcelError={handleExcelError}
            />
            )}
            {showNavigation && excelError && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-sm">
                        <div className="flex items-center justify-between">
                            <p className="text-red-700 font-medium">{excelError}</p>
                            <button 
                                onClick={() => setExcelError(null)}
                                className="text-red-600 text-sm hover:underline ml-4"
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <Routes>
                <Route 
                    path="/" 
                    element={
                        isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />
                    } 
                />
                <Route 
                    path="/dashboard" 
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    } 
                />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </div>
    );
};

const App: React.FC = () => {
    return (
        <AuthProvider>
            <CountryProvider>
                <AppContent />
            </CountryProvider>
        </AuthProvider>
    );
};

export default App;
