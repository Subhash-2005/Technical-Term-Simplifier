// src/components/dashboard/UserInfoModal.tsx

import { FC, useState } from 'react';
import axios from 'axios';

interface UserInfoModalProps {
  email: string;
  onComplete: () => void;
}

const UserInfoModal: FC<UserInfoModalProps> = ({ email, onComplete }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [fieldOfInterest, setFieldOfInterest] = useState('');
  const [loading, setLoading] = useState(false);

  const isFormValid = firstName && lastName && fieldOfInterest;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    setLoading(true);

    try {
      await axios.post('http://localhost:5000/api/user/update-profile', {
        email,
        firstName,
        lastName,
        fieldOfInterest,
      });

      // Optional: Reset fields
      setFirstName('');
      setLastName('');
      setFieldOfInterest('');

      onComplete(); // Close modal in Dashboard
    } catch (error) {
      console.error('❌ Error saving profile:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4 text-center">Tell us about you!</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            className="w-full border p-2 rounded"
          />
          <input
            type="text"
            placeholder="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            className="w-full border p-2 rounded"
          />
          <select
            value={fieldOfInterest}
            onChange={(e) => setFieldOfInterest(e.target.value)}
            required
            className="w-full border p-2 rounded"
          >
            <option value="">Select Field of Interest</option>
            <option value="Web Development">Web Development</option>
            <option value="Cloud Computing">Cloud Computing</option>
            <option value="AI & ML">AI & ML</option>
            <option value="Cybersecurity">Cybersecurity</option>
            <option value="Blockchain">Blockchain</option>
          </select>

          <button
            type="submit"
            disabled={!isFormValid || loading}
            className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Info'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UserInfoModal;
