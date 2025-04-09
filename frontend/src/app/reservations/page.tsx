'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import { FiCalendar, FiMapPin, FiClock, FiX, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

interface Reservation {
  _id: string;
  coworkingSpace: {
    _id: string;
    name: string;
    location: string;
  };
  date: string;
  timeSlot: string;
  status: string;
}

const ReservationsPage = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelSuccess, setCancelSuccess] = useState('');
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newTimeSlot, setNewTimeSlot] = useState('');
  const [updateError, setUpdateError] = useState('');
  const router = useRouter();

  const timeSlots = [
    "09:00 - 12:00",
    "12:00 - 15:00",
    "15:00 - 18:00",
    "18:00 - 21:00"
  ];

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (isAuthenticated) {
      fetchReservations();
    }
  }, [isAuthenticated, isLoading, router]);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/reservations/my');
      setReservations(response.data.data);
      setError('');
    } catch (err) {
      console.error('Error fetching reservations:', err);
      setError('Failed to load your reservations. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const cancelReservation = async (id: string) => {
    try {
      await api.delete(`/reservations/${id}`);
      setCancelSuccess('Reservation deleted successfully');
      // Remove the reservation from local state
      setReservations(reservations.filter(res => res._id !== id));
      setTimeout(() => setCancelSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting reservation:', err);
      setError('Failed to delete reservation. Please try again.');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleEdit = (reservation: Reservation) => {
    setEditingReservation(reservation);
    setNewDate(reservation.date.split('T')[0]); // Format date for input
    setNewTimeSlot(reservation.timeSlot);
  };

  const handleUpdate = async () => {
    if (!editingReservation) return;

    try {
      await api.put(`/reservations/${editingReservation._id}`, {
        date: newDate,
        timeSlot: newTimeSlot
      });

      // Update local state
      setReservations(reservations.map(res =>
        res._id === editingReservation._id
          ? { ...res, date: newDate, timeSlot: newTimeSlot }
          : res
      ));

      setEditingReservation(null);
      setCancelSuccess('Reservation updated successfully');
      setTimeout(() => setCancelSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating reservation:', err);
      setUpdateError('Failed to update reservation. Please try again.');
      setTimeout(() => setUpdateError(''), 3000);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isUpcoming = (dateString: string, timeSlot: string) => {
    const now = new Date();
    const date = new Date(dateString);
    date.setHours(0, 0, 0, 0);
    
    if (date < now) return false;
    if (date > now) return true;
    
    // Check if time slot is in the future today
    const currentHour = now.getHours();
    const slotEndHour = parseInt(timeSlot.split(' - ')[1].split(':')[0]);
    
    return currentHour < slotEndHour;
  };

  if (isLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (editingReservation) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div className="mt-3 text-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Edit Reservation</h3>
            <div className="mt-2 px-7 py-3">
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Date</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Time Slot</label>
                <select
                  value={newTimeSlot}
                  onChange={(e) => setNewTimeSlot(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                  {timeSlots.map(slot => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>
              {updateError && (
                <div className="mb-4 text-red-500 text-sm">{updateError}</div>
              )}
            </div>
            <div className="flex justify-center gap-4">
              <button
                onClick={handleUpdate}
                className="px-4 py-2 bg-indigo-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Update
              </button>
              <button
                onClick={() => setEditingReservation(null)}
                className="px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:flex lg:items-center lg:justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-semibold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              My Reservations
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              View and manage your co-working space reservations
            </p>
          </div>
          {reservations.length > 0 && (
            <div className="mt-5 flex lg:mt-0 lg:ml-4">
              <Link
                href="/coworking-spaces"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <FiCalendar className="-ml-1 mr-2 h-5 w-5" />
                Book New Space
              </Link>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4 flex items-center">
            <FiAlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <div className="text-sm text-red-600">{error}</div>
          </div>
        )}

        {cancelSuccess && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-md p-4 flex items-center">
            <FiCheckCircle className="h-5 w-5 text-green-500 mr-2" />
            <div className="text-sm text-green-600">{cancelSuccess}</div>
          </div>
        )}

        <div className="mt-8">
          {reservations.length === 0 ? (
            <div className="text-center py-12 bg-white shadow overflow-hidden sm:rounded-lg">
              <p className="text-gray-500">You do not have any reservations yet.</p>
              <Link
                href="/coworking-spaces"
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <FiCalendar className="-ml-1 mr-2 h-5 w-5" />
                Book a Space Now
              </Link>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <ul className="divide-y divide-gray-200">
                {reservations.map((reservation) => {
                  const isActive = reservation.status === 'active';
                  const isPast = !isUpcoming(reservation.date, reservation.timeSlot);
                  
                  return (
                    <li key={reservation._id} className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 bg-indigo-100 rounded-md p-2">
                            <FiMapPin className="h-6 w-6 text-indigo-600" />
                          </div>
                          <div className="ml-4">
                            <h4 className="text-lg font-medium text-gray-900">
                              {reservation.coworkingSpace.name}
                            </h4>
                            <div className="mt-1 flex items-center text-sm text-gray-500">
                              <FiMapPin className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                              <p>{reservation.coworkingSpace.location}</p>
                            </div>
                            <div className="mt-1 flex items-center text-sm text-gray-500">
                              <FiCalendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                              <p>{formatDate(reservation.date)}</p>
                            </div>
                            <div className="mt-1 flex items-center text-sm text-gray-500">
                              <FiClock className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                              <p>{reservation.timeSlot}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <div className={`flex items-center ${isActive ? 'text-green-500' : 'text-red-500'}`}>
                            {isActive ? (
                              <>
                                <FiCheckCircle className="h-5 w-5 mr-1" />
                                <span className="text-sm font-medium">Active</span>
                              </>
                            ) : (
                              <>
                                <FiX className="h-5 w-5 mr-1" />
                                <span className="text-sm font-medium">Cancelled</span>
                              </>
                            )}
                          </div>
                          
                          {isActive && !isPast && (
                            <div className="space-x-2">
                              <button
                                onClick={() => handleEdit(reservation)}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => cancelReservation(reservation._id)}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                          
                          {isPast && isActive && (
                            <span className="text-xs text-gray-500">Past reservation</span>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReservationsPage;