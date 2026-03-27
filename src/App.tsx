/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useState, useEffect, createContext, useContext } from 'react';
import { UserProfile } from './types';

// Components
import Login from './components/Login';
import SellerDashboard from './components/SellerDashboard';
import BuyerDashboard from './components/BuyerDashboard';
import Navbar from './components/Navbar';
import FreeResources from './components/FreeResources';
import Donate from './components/Donate';

export default function App() {
  const [user, loading] = useAuthState(auth);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isMockUser, setIsMockUser] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('mockUser') !== null;
    }
    return false;
  });

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    async function setupProfileListener() {
      if (user || isMockUser) {
        if (isMockUser || user?.isAnonymous) {
          const mockData = JSON.parse(localStorage.getItem('mockUser') || '{}');
          setProfile({
            uid: user?.uid || mockData.uid || 'mock-user-id',
            email: user?.email || mockData.email || 'guest@example.com',
            displayName: user?.displayName || mockData.displayName || 'Guest User',
            role: mockData.role || 'buyer',
            createdAt: mockData.createdAt || new Date().toISOString(),
          });
          setProfileLoading(false);
          return;
        }

        setProfileLoading(true);
        const { onSnapshot } = await import('firebase/firestore');
        const docRef = doc(db, 'users', user.uid);
        
        unsubscribe = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
            setProfileLoading(false);
          } else {
            setProfile(null);
            setTimeout(() => setProfileLoading(false), 2000);
          }
        }, (error) => {
          console.error("Error listening to profile:", error);
          setProfileLoading(false);
        });
      } else {
        setProfile(null);
        setProfileLoading(false);
      }
    }

    setupProfileListener();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user, isMockUser]);

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-white text-gray-900">
        <Navbar profile={profile} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/login" element={(!user && !isMockUser) ? <Login /> : <Navigate to="/" />} />
            <Route 
              path="/" 
              element={
                (user || isMockUser) ? (
                  profile ? (
                    profile.role === 'seller' ? <SellerDashboard /> : <BuyerDashboard />
                  ) : (
                    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                      <p className="text-gray-500 font-medium animate-pulse">Setting up your dashboard...</p>
                    </div>
                  )
                ) : (
                  <Navigate to="/login" />
                )
              } 
            />
            <Route path="/free-resources" element={<FreeResources />} />
            <Route path="/donate" element={<Donate />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

