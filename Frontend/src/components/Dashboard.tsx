import { FC, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import axios from 'axios';
import {
  BarChart3,
  BookOpenCheck,
  Zap,
  Trophy,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import RecentTerms from './dashboard/RecentTerms';
import ProgressTracker from './dashboard/ProgressTracker';
import CategoryFilter from './dashboard/CategoryFilter';

interface UserData {
  email: string;
  username: string;
}

const Dashboard: FC = () => {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [field, setField] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user?.email) {
        setUserEmail(user.email);

        try {
          await axios.post('http://localhost:5000/api/user/save-user', {
            email: user.email,
          });

          const res = await axios.get<UserData>(
            `http://localhost:5000/api/user/${encodeURIComponent(user.email)}`
          );

          if (res.data.username) {
            setUsername(res.data.username);
          } else {
            setShowModal(true); // Show modal for new users
          }
        } catch (err) {
          console.error('Error during user check/save:', err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSubmitProfile = async () => {
    if (!firstName || !lastName || !field || !userEmail) return;

    try {
      await axios.post('http://localhost:5000/api/user/update-profile', {
        email: userEmail,
        firstName,
        lastName,
        fieldOfInterest: field,
      });

      setUsername(`${firstName} ${lastName}`);
      setShowModal(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
    }
  };

  return (
    <div className="space-y-6 py-4">
      {/* 🔵 New User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Complete Your Profile</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full p-2 border rounded"
              />
              <input
                type="text"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full p-2 border rounded"
              />
              <select
                value={field}
                onChange={(e) => setField(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="">Select Field of Interest</option>
                <option value="AI & ML">AI & ML</option>
                <option value="Cloud Computing">Cloud Computing</option>
                <option value="Cybersecurity">Cybersecurity</option>
                <option value="Blockchain">Blockchain</option>
                <option value="Web Development">Web Development</option>
              </select>
              <button
                onClick={handleSubmitProfile}
                className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700"
              >
                Save & Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {username
              ? `Welcome back, ${username} 👋`
              : userEmail
              ? `Welcome back, ${userEmail} 👋`
              : 'Welcome Guest 👋'}
          </h1>
          <p className="text-gray-600 mt-1">
            You've learned 7 new terms this week. Keep it up!
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-2">
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <Filter size={16} className="mr-2" />
            Filter
          </button>
          <button className="inline-flex items-center px-3 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-purple-600 hover:bg-purple-700">
            <Zap size={16} className="mr-2" />
            Quick Learn
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Terms Learned"
          value="127"
          change="+12 this week"
          icon={<BookOpenCheck className="text-green-500" />}
          color="bg-green-100"
        />
        <StatCard
          title="Mastery Level"
          value="Intermediate"
          change="42% to Advanced"
          icon={<Trophy className="text-yellow-500" />}
          color="bg-yellow-100"
        />
        <StatCard
          title="Daily Streak"
          value="7 days"
          change="Personal best: 14"
          icon={<Zap className="text-purple-500" />}
          color="bg-purple-100"
        />
        <StatCard
          title="Categories"
          value="5 explored"
          change="Try Cloud Computing"
          icon={<BarChart3 className="text-blue-500" />}
          color="bg-blue-100"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">My Recent Terms</h2>
              <button className="text-purple-600 hover:text-purple-700 text-sm font-medium inline-flex items-center">
                View all <ArrowUpRight size={16} className="ml-1" />
              </button>
            </div>
            <RecentTerms />
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <ProgressTracker />
          <CategoryFilter />
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
  color: string;
}

const StatCard: FC<StatCardProps> = ({ title, value, change, icon, color }) => (
  <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
    <div className="flex justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-semibold text-gray-800 mt-1">{value}</p>
        <p className="text-xs text-gray-500 mt-1">{change}</p>
      </div>
      <div className={`h-12 w-12 rounded-lg ${color} flex items-center justify-center`}>
        {icon}
      </div>
    </div>
  </div>
);

export default Dashboard;
