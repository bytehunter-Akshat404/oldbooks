import { useState, FormEvent } from 'react';
import { auth, db } from '../firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInAnonymously, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { UserRole, UserProfile } from '../types';
import { Book, ShieldCheck, ShoppingCart, Mail, Lock, User as UserIcon, ArrowRight } from 'lucide-react';

export default function Login() {
  const [role, setRole] = useState<UserRole>('buyer');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [showDemoButton, setShowDemoButton] = useState(false);
  const navigate = useNavigate();

  const enterDemoMode = (customProfile?: any) => {
    const mockProfile = customProfile || {
      uid: `mock-${role}-${Date.now()}`,
      email: email || 'demo@example.com',
      displayName: name || (email ? email.split('@')[0] : 'Demo User'),
      role: role,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem('mockUser', JSON.stringify(mockProfile));
    window.location.href = '/';
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        const profile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || 'User',
          role: role,
          createdAt: new Date().toISOString(),
        };
        await setDoc(docRef, profile);
      }
      navigate('/');
    } catch (error: any) {
      console.error("Login failed:", error);
      if (error.code === 'auth/operation-not-allowed' || error.code === 'auth/admin-restricted-operation') {
        setError("Google login is not enabled in the Firebase Console.");
        setShowDemoButton(true);
      } else if (error.code === 'auth/network-request-failed') {
        setError("Network request failed. This often happens if the current domain is not authorized in the Firebase Console (Authentication > Settings > Authorized domains).");
        setShowDemoButton(true);
      } else {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    if (isSignUp && password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        const user = result.user;
        const profile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: name || email.split('@')[0],
          role: role,
          createdAt: new Date().toISOString(),
        };
        try {
          await setDoc(doc(db, 'users', user.uid), profile);
        } catch (fsError: any) {
          console.error("Firestore profile creation failed:", fsError);
          setError("Account created, but profile setup failed. Please try logging in again.");
          return;
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      setTimeout(() => navigate('/'), 500);
    } catch (error: any) {
      console.error("Email auth failed:", error);
      if (error.code === 'auth/admin-restricted-operation' || error.code === 'auth/operation-not-allowed') {
        setError("Email/Password authentication is not enabled in the Firebase Console.");
        setShowDemoButton(true);
      } else if (error.code === 'auth/network-request-failed') {
        setError("Network request failed. Please check your internet connection or ensure the current domain is authorized in the Firebase Console.");
        setShowDemoButton(true);
      } else if (error.code === 'auth/weak-password') {
        setError("Password should be at least 6 characters.");
      } else if (error.code === 'auth/email-already-in-use') {
        setError("This email is already registered. Please sign in instead.");
      } else {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await signInAnonymously(auth);
      navigate('/');
    } catch (error: any) {
      console.error("Guest login failed:", error);
      if (error.code === 'auth/admin-restricted-operation' || error.code === 'auth/operation-not-allowed') {
        setError("Guest login is not enabled in the Firebase Console.");
        setShowDemoButton(true);
      } else if (error.code === 'auth/network-request-failed') {
        setError("Network request failed. Please check your internet connection or ensure the current domain is authorized in the Firebase Console.");
        setShowDemoButton(true);
      } else {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-gray-100 transition-all">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mb-4">
            <Book className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">OldBooks</h1>
          <p className="text-gray-500 text-center text-sm">
            The marketplace for your next academic journey.
          </p>
        </div>

        {error && (
          <div className="mb-6 space-y-3">
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-medium">
              {error}
            </div>
            {showDemoButton && (
              <button
                onClick={() => enterDemoMode()}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black text-sm shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center space-x-2"
              >
                <span>Enter in Demo Mode</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        <div className="mb-8">
          <label className="block text-xs font-black text-gray-400 uppercase mb-4 text-center tracking-widest">
            Select Your Role
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setRole('buyer')}
              className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                role === 'buyer'
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                  : 'border-gray-100 hover:border-gray-200 text-gray-400'
              }`}
            >
              <ShoppingCart className="w-6 h-6 mb-2" />
              <span className="font-bold text-sm">Buyer</span>
            </button>
            <button
              onClick={() => setRole('seller')}
              className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                role === 'seller'
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                  : 'border-gray-100 hover:border-gray-200 text-gray-400'
              }`}
            >
              <ShieldCheck className="w-6 h-6 mb-2" />
              <span className="font-bold text-sm">Seller</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
          {isSignUp && (
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                required
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-transparent focus:border-indigo-600 rounded-xl outline-none text-sm transition-all"
              />
            </div>
          )}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              required
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-transparent focus:border-indigo-600 rounded-xl outline-none text-sm transition-all"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              required
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-transparent focus:border-indigo-600 rounded-xl outline-none text-sm transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white font-black py-3 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center space-x-2"
          >
            <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="flex items-center justify-between mb-6 text-xs font-bold text-gray-400">
          <button onClick={() => setIsSignUp(!isSignUp)} className="hover:text-indigo-600 transition-colors">
            {isSignUp ? 'Already have an account? Login' : 'Need an account? Sign Up'}
          </button>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-100"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-400 font-bold">Or continue with</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="flex items-center justify-center space-x-2 bg-white border-2 border-gray-100 text-gray-700 font-bold py-3 px-4 rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50 text-sm"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
            <span>Google</span>
          </button>
          <button
            onClick={handleGuestLogin}
            disabled={loading}
            className="flex items-center justify-center space-x-2 bg-gray-900 text-white font-bold py-3 px-4 rounded-xl hover:bg-gray-800 transition-all disabled:opacity-50 text-sm"
          >
            <UserIcon className="w-4 h-4" />
            <span>Guest</span>
          </button>
        </div>

        <p className="text-[10px] text-center text-gray-400 font-medium">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
