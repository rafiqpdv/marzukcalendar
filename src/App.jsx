import React, { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from './firebase'; // your firebase config
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const PhotoBookingSystem = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    const snapshot = await getDocs(collection(db, 'bookings'));
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setBookings(data);
    setLoading(false);
  };

  // ---------------- PDF Export ----------------
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text('Photography Booking Report', 14, 15);

    const rows = bookings.map(b => [
      b.photographerName,
      b.date instanceof Date ? b.date.toLocaleDateString() : new Date(b.date.seconds * 1000).toLocaleDateString(),
      b.fromTime,
      b.toTime,
      b.packageType,
      b.company,
      b.contactPerson,
      b.reference,
      b.contactNumber,
      b.packageAmount?.toFixed(3),
      b.bookingStatus,
      b.handoverStatus,
      b.paymentStatus,
      b.photographerEmail || '-'
    ]);

    doc.autoTable({
      head: [['Photographer','Date','From','To','Package','Company','Contact','Ref','Phone','Amount','Status','Handover','Payment','Email']],
      body: rows,
      startY: 20,
      theme: 'grid',
      headStyles: { fillColor: [99,102,241] },
      styles: { fontSize: 8 }
    });

    doc.save(`booking-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // ---------------- Cancel Booking ----------------
  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;

    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, {
        bookingStatus: 'cancelled',
        updatedAt: Timestamp.now()
      });

      setBookings(prev => prev.map(b => b.id === bookingId ? {...b, bookingStatus: 'cancelled'} : b));
      alert('Booking cancelled successfully!');
    } catch (error) {
      console.error("Error cancelling booking:", error);
      alert('Failed to cancel booking. Try again.');
    }
  };

  // ---------------- Booking Form (Add / Edit) ----------------
  const [bookingForm, setBookingForm] = useState({
    photographerName: '',
    date: '',
    fromTime: '',
    toTime: '',
    packageType: '',
    company: '',
    contactPerson: '',
    reference: '',
    contactNumber: '',
    packageAmount: '',
    bookingStatus: 'confirmed',
    handoverStatus: '',
    paymentStatus: '',
    photographerEmail: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBookingForm(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div>
      <h2>Photography Booking System</h2>

      <button onClick={exportToPDF}>Export PDF</button>
      <button onClick={() => console.log('CSV export logic here')}>Export CSV</button>

      {loading ? <p>Loading bookings...</p> : (
        <table border={1} cellPadding={5}>
          <thead>
            <tr>
              <th>Photographer</th>
              <th>Date</th>
              <th>From</th>
              <th>To</th>
              <th>Package</th>
              <th>Company</th>
              <th>Contact</th>
              <th>Ref</th>
              <th>Phone</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Handover</th>
              <th>Payment</th>
              <th>Email</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map(b => (
              <tr key={b.id} style={{ textDecoration: b.bookingStatus === 'cancelled' ? 'line-through' : 'none' }}>
                <td>{b.photographerName}</td>
                <td>{b.date instanceof Date ? b.date.toLocaleDateString() : new Date(b.date.seconds * 1000).toLocaleDateString()}</td>
                <td>{b.fromTime}</td>
                <td>{b.toTime}</td>
                <td>{b.packageType}</td>
                <td>{b.company}</td>
                <td>{b.contactPerson}</td>
                <td>{b.reference}</td>
                <td>{b.contactNumber}</td>
                <td>{b.packageAmount?.toFixed(3)}</td>
                <td>{b.bookingStatus}</td>
                <td>{b.handoverStatus}</td>
                <td>{b.paymentStatus}</td>
                <td>{b.photographerEmail || '-'}</td>
                <td>
                  {b.bookingStatus !== 'cancelled' && <button onClick={() => handleCancelBooking(b.id)}>Cancel</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Example Booking Form */}
      <h3>Add / Edit Booking</h3>
      <form>
        <input type="text" name="photographerName" placeholder="Photographer Name" value={bookingForm.photographerName} onChange={handleInputChange} required />
        <input type="date" name="date" value={bookingForm.date} onChange={handleInputChange} required />
        <input type="time" name="fromTime" value={bookingForm.fromTime} onChange={handleInputChange} required />
        <input type="time" name="toTime" value={bookingForm.toTime} onChange={handleInputChange} required />
        <input type="text" name="packageType" placeholder="Package Type" value={bookingForm.packageType} onChange={handleInputChange} required />
        <input type="email" name="photographerEmail" placeholder="Photographer Email" value={bookingForm.photographerEmail} onChange={handleInputChange} required />
        {/* Add other fields as needed */}
        <button type="submit">Save Booking</button>
      </form>
    </div>
  );
};

export default PhotoBookingSystem;
