import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDocs,
  Timestamp 
} from 'firebase/firestore';
import { Calendar, Plus, FileText, Edit2, X, Filter, Download, Trash2 } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Firebase Configuration - REPLACE WITH YOUR CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyBu6xMfJ60dlNupF8wMPHPY1FDyi78ZpBw",
  authDomain: "marzukcalendar.firebaseapp.com",
  projectId: "marzukcalendar",
  storageBucket: "marzukcalendar.firebasestorage.app",
  messagingSenderId: "226351050455",
  appId: "1:226351050455:web:60da34e1cb7e41fab4ca92",
  measurementId: "G-CW2C7HXBNG"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const PhotoBookingSystem = () => {
  // ... existing state and useEffect hooks

  // Add photographer email to form state
  const [bookingForm, setBookingForm] = useState({
    photographerName: '',
    photographerEmail: '',
    date: new Date().toISOString().split('T')[0],
    fromTime: '',
    toTime: '',
    packageType: 'photography',
    company: '',
    contactPerson: '',
    reference: '',
    contactNumber: '',
    packageAmount: '',
    bookingStatus: 'booked',
    handoverStatus: 'pending',
    handoverDate: '',
    handoverUrl: '',
    paymentStatus: 'not paid',
    partPaidAmount: '0.000',
    balanceAmount: '0.000',
    fullPaidDate: ''
  });

  // Function to cancel booking
  const cancelBooking = async (booking) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      const bookingRef = doc(db, 'bookings', booking.id);
      await updateDoc(bookingRef, { bookingStatus: 'cancelled', updatedAt: Timestamp.now() });
      fetchBookings();
      alert('Booking cancelled successfully!');
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Error cancelling booking.');
    }
  };

  // Function to export PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    const tableColumn = ['Photographer', 'Email', 'Date', 'From', 'To', 'Package', 'Company', 'Contact', 'Reference', 'Phone', 'Amount', 'Status', 'Handover', 'Payment'];
    const tableRows = [];

    filteredBookings.forEach(b => {
      const bookingData = [
        b.photographerName,
        b.photographerEmail || '',
        b.date instanceof Date ? b.date.toLocaleDateString() : new Date(b.date).toLocaleDateString(),
        b.fromTime,
        b.toTime,
        b.packageType,
        b.company,
        b.contactPerson,
        b.reference,
        b.contactNumber,
        b.packageAmount.toFixed(3),
        b.bookingStatus,
        b.handoverStatus,
        b.paymentStatus
      ];
      tableRows.push(bookingData);
    });

    doc.autoTable({ head: [tableColumn], body: tableRows });
    doc.save(`booking-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // ... rest of the existing component JSX

  return (
    <div>
      {/* existing header, calendar, booking modal */}

      {selectedDate && (
        <div>
          {getBookingsForDate(selectedDate).map(booking => (
            <div key={booking.id}>
              {/* existing booking display */}
              <button onClick={() => cancelBooking(booking)} style={{ marginLeft: '0.5rem', background: '#ef4444', color: 'white', padding: '0.4rem', borderRadius: '6px', cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center' }}>
                <Trash2 size={16} /> Cancel
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Report modal with export to PDF button */}
      <button onClick={exportToPDF} style={{ padding: '0.7rem 1.3rem', background: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Download size={16} /> Export PDF
      </button>

      {/* Remember to include photographerEmail input in booking modal */}
      {/* <input type="email" value={bookingForm.photographerEmail} onChange={e => setBookingForm({...bookingForm, photographerEmail: e.target.value})} required /> */}
    </div>
  );
};

export default PhotoBookingSystem;
