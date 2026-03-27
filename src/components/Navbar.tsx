import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { UserProfile } from '../types';
import { Book, LogOut, User, LayoutDashboard, Heart, FileText } from 'lucide-react';

interface NavbarProps {
  profile: UserProfile | null;
}

export default function Navbar({ profile }: NavbarProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.signOut();
    localStorage.removeItem('mockUser');
    window.location.href = '/login';
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-2">
            <Link to="/" className="flex items-center space-x-2 text-indigo-600 font-bold text-xl">
              <Book className="w-8 h-8" />
              <span className="hidden sm:inline">OldBooks</span>
            </Link>
          </div>

          <div className="flex items-center space-x-2 md:space-x-4">
            <Link to="/free-resources" className="text-gray-600 hover:text-indigo-600 flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium">
              <FileText className="w-4 h-4" />
              <span className="hidden md:inline">Free Resources</span>
            </Link>
            <Link to="/donate" className="text-gray-600 hover:text-indigo-600 flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium">
              <Heart className="w-4 h-4" />
              <span className="hidden md:inline">Donate</span>
            </Link>

            {profile ? (
              <div className="flex items-center space-x-2 md:space-x-4">
                <div className="hidden sm:flex items-center space-x-2 px-3 py-2 rounded-md bg-gray-50 border border-gray-100">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">{profile.displayName}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 uppercase font-black">
                    {profile.role}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
