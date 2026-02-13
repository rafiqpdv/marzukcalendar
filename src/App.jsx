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
import { Calendar, Plus, FileText, Edit2, X, Filter, Download, XCircle } from 'lucide-react';
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

const MarzukCalendar = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [modifyingBooking, setModifyingBooking] = useState(null);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [uniqueCompanies, setUniqueCompanies] = useState([]);

  const [bookingForm, setBookingForm] = useState({
    photographerName: 'Marzuk',
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
    fullPaidDate: '',
    expenses: 'taxi',
    expensesAmount: '0.000'
  });

  const [modifyForm, setModifyForm] = useState({
    date: '',
    fromTime: '',
    toTime: ''
  });

  const [reportFilters, setReportFilters] = useState({
    photographerName: '',
    startDate: '',
    endDate: '',
    packageType: '',
    company: '',
    contactPerson: '',
    reference: '',
    contactNumber: '',
    bookingStatus: '',
    handoverStatus: '',
    paymentStatus: ''
  });

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    if (bookingForm.packageAmount) {
      const pkg = parseFloat(bookingForm.packageAmount) || 0;
      const paid = parseFloat(bookingForm.partPaidAmount) || 0;
      const balance = (pkg - paid).toFixed(3);
      setBookingForm(prev => ({ ...prev, balanceAmount: balance }));
    }
  }, [bookingForm.packageAmount, bookingForm.partPaidAmount]);

  const fetchBookings = async () => {
    try {
      console.log('Fetching bookings from Firebase...');
      const querySnapshot = await getDocs(collection(db, 'bookings'));
      console.log('Query snapshot received, docs count:', querySnapshot.docs.length);
      
      const bookingsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Processing booking:', doc.id, data);
        return {
          id: doc.id,
          ...data,
          date: data.date?.toDate ? data.date.toDate() : new Date(data.date)
        };
      });
      
      console.log('Total bookings loaded:', bookingsData.length);
      setBookings(bookingsData);
      setFilteredBookings(bookingsData);

      // Extract unique companies with their contact numbers
      const companiesMap = new Map();
      bookingsData.forEach(booking => {
        if (booking.company && booking.contactNumber && booking.bookingStatus !== 'cancelled') {
          if (!companiesMap.has(booking.company)) {
            companiesMap.set(booking.company, {
              company: booking.company,
              contactNumber: booking.contactNumber,
              contactPerson: booking.contactPerson
            });
          }
        }
      });
      setUniqueCompanies(Array.from(companiesMap.values()));
      
    } catch (error) {
      console.error("Error fetching bookings:", error);
      alert(`❌ Error loading bookings: ${error.message}\n\nPlease check:\n1. Firebase config is correct\n2. Firestore is enabled\n3. Collection name is "bookings"`);
    }
  };

  const checkTimeClash = (date, fromTime, toTime, excludeBookingId = null) => {
    const dateBookings = bookings.filter(b => {
      if (excludeBookingId && b.id === excludeBookingId) return false;
      if (b.bookingStatus === 'cancelled') return false;
      
      const bDate = b.date instanceof Date ? b.date : new Date(b.date);
      return bDate.toDateString() === new Date(date).toDateString();
    });

    const conflictingBookings = dateBookings.filter(b => {
      const existingFrom = b.fromTime;
      const existingTo = b.toTime;

      // Check if times overlap
      return (fromTime >= existingFrom && fromTime < existingTo) ||
             (toTime > existingFrom && toTime <= existingTo) ||
             (fromTime <= existingFrom && toTime >= existingTo);
    });

    return {
      hasClash: conflictingBookings.length >= 2,
      count: conflictingBookings.length
    };
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    
    console.log('=== FORM SUBMIT STARTED ===');
    console.log('Form data:', bookingForm);

    // Detailed validation
    if (!bookingForm.photographerName) {
      alert('❌ Please select a photographer');
      return;
    }
    
    if (!bookingForm.date) {
      alert('❌ Please select a date');
      return;
    }
    
    if (!bookingForm.fromTime) {
      alert('❌ Please select from time');
      return;
    }
    
    if (!bookingForm.toTime) {
      alert('❌ Please select to time');
      return;
    }

    if (bookingForm.fromTime >= bookingForm.toTime) {
      alert('❌ "To Time" must be after "From Time"');
      return;
    }

    if (!bookingForm.company || bookingForm.company.trim() === '') {
      alert('❌ Please enter company name');
      return;
    }

    if (!bookingForm.contactPerson || bookingForm.contactPerson.trim() === '') {
      alert('❌ Please enter contact person');
      return;
    }

    if (!bookingForm.contactNumber || bookingForm.contactNumber.trim() === '') {
      alert('❌ Please enter contact number');
      return;
    }

    if (!bookingForm.packageAmount || parseFloat(bookingForm.packageAmount) <= 0) {
      alert('❌ Please enter a valid package amount');
      return;
    }

    console.log('All validations passed');

    // Check time clash
    const clashCheck = checkTimeClash(
      bookingForm.date, 
      bookingForm.fromTime, 
      bookingForm.toTime,
      editingBooking?.id
    );

    console.log('Clash check result:', clashCheck);

    if (clashCheck.hasClash) {
      alert('⚠️ Time Clash! Maximum 2 bookings allowed for this time slot. Please select another time.');
      return;
    }

    console.log('No time clash, proceeding to save...');

    try {
      const bookingData = {
        photographerName: bookingForm.photographerName,
        date: Timestamp.fromDate(new Date(bookingForm.date)),
        fromTime: bookingForm.fromTime,
        toTime: bookingForm.toTime,
        packageType: bookingForm.packageType,
        company: bookingForm.company,
        contactPerson: bookingForm.contactPerson,
        reference: bookingForm.reference || '',
        contactNumber: bookingForm.contactNumber,
        packageAmount: parseFloat(bookingForm.packageAmount),
        bookingStatus: bookingForm.bookingStatus,
        handoverStatus: bookingForm.handoverStatus,
        handoverDate: bookingForm.handoverDate ? Timestamp.fromDate(new Date(bookingForm.handoverDate)) : null,
        handoverUrl: bookingForm.handoverUrl || '',
        paymentStatus: bookingForm.paymentStatus,
        partPaidAmount: parseFloat(bookingForm.partPaidAmount || '0'),
        balanceAmount: parseFloat(bookingForm.balanceAmount || '0'),
        fullPaidDate: bookingForm.fullPaidDate ? Timestamp.fromDate(new Date(bookingForm.fullPaidDate)) : null,
        expenses: bookingForm.expenses,
        expensesAmount: parseFloat(bookingForm.expensesAmount || '0'),
        createdAt: Timestamp.now()
      };

      console.log('Booking data prepared:', bookingData);

      if (editingBooking) {
        console.log('Updating existing booking:', editingBooking.id);
        const bookingRef = doc(db, 'bookings', editingBooking.id);
        await updateDoc(bookingRef, { ...bookingData, updatedAt: Timestamp.now() });
        console.log('✅ Booking updated');
        alert('✅ Booking updated successfully!');
      } else {
        console.log('Creating new booking...');
        const docRef = await addDoc(collection(db, 'bookings'), bookingData);
        console.log('✅ Booking created with ID:', docRef.id);
        alert('✅ Booking created successfully!');
      }

      resetForm();
      setShowBookingModal(false);
      await fetchBookings();
      console.log('=== FORM SUBMIT COMPLETED ===');
    } catch (error) {
      console.error("❌ Error saving booking:", error);
      console.error("Error details:", error.message, error.code);
      alert(`❌ Error saving booking: ${error.message}\n\nPlease check:\n1. Firebase config is set\n2. Firestore is enabled\n3. Browser console for details`);
    }
  };

  const handleCancelBooking = async (booking) => {
    if (!confirm(`Are you sure you want to CANCEL this booking for ${booking.company}?`)) {
      return;
    }

    try {
      const bookingRef = doc(db, 'bookings', booking.id);
      await updateDoc(bookingRef, {
        bookingStatus: 'cancelled',
        packageAmount: 0,
        partPaidAmount: 0,
        balanceAmount: 0,
        updatedAt: Timestamp.now()
      });
      alert('✅ Booking cancelled successfully!\n\nAmounts set to zero to avoid financial errors.');
      fetchBookings();
    } catch (error) {
      console.error("Error cancelling booking:", error);
      alert("❌ Error cancelling booking. Please try again.");
    }
  };

  const openModifyModal = (booking) => {
    if (booking.bookingStatus === 'completed') {
      alert('❌ Cannot modify a completed booking!');
      return;
    }

    setModifyingBooking(booking);
    setModifyForm({
      date: booking.date instanceof Date 
        ? booking.date.toISOString().split('T')[0] 
        : new Date(booking.date).toISOString().split('T')[0],
      fromTime: booking.fromTime,
      toTime: booking.toTime
    });
    setShowModifyModal(true);
  };

  const handleModifySubmit = async (e) => {
    e.preventDefault();

    // Check time clash for new time
    const clashCheck = checkTimeClash(
      modifyForm.date,
      modifyForm.fromTime,
      modifyForm.toTime,
      modifyingBooking.id
    );

    if (clashCheck.hasClash) {
      alert('⚠️ Time Clash! Maximum 2 bookings allowed for this time slot. Please select another time.');
      return;
    }

    try {
      const bookingRef = doc(db, 'bookings', modifyingBooking.id);
      await updateDoc(bookingRef, {
        date: Timestamp.fromDate(new Date(modifyForm.date)),
        fromTime: modifyForm.fromTime,
        toTime: modifyForm.toTime,
        bookingStatus: 'postponed', // Auto-update to postponed
        updatedAt: Timestamp.now()
      });
      
      alert('✅ Booking modified and status updated to POSTPONED!');
      setShowModifyModal(false);
      setModifyingBooking(null);
      fetchBookings();
    } catch (error) {
      console.error("Error modifying booking:", error);
      alert("❌ Error modifying booking. Please try again.");
    }
  };

  const handleCompanyChange = (companyValue) => {
    setBookingForm(prev => ({ ...prev, company: companyValue }));
    
    // Auto-fill contact number if company matches
    const matchedCompany = uniqueCompanies.find(c => c.company === companyValue);
    if (matchedCompany) {
      setBookingForm(prev => ({ 
        ...prev, 
        company: companyValue,
        contactNumber: matchedCompany.contactNumber,
        contactPerson: matchedCompany.contactPerson
      }));
    }
  };

  const resetForm = () => {
    setBookingForm({
      photographerName: 'Marzuk',
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
      fullPaidDate: '',
      expenses: 'taxi',
      expensesAmount: '0.000'
    });
    setEditingBooking(null);
  };

  const handleEditBooking = (booking) => {
    // Block editing completed bookings
    if (booking.bookingStatus === 'completed') {
      alert('❌ Booking Session already completed\n\nCompleted bookings cannot be edited.');
      return;
    }

    setEditingBooking(booking);
    setBookingForm({
      photographerName: booking.photographerName,
      date: booking.date instanceof Date 
        ? booking.date.toISOString().split('T')[0] 
        : new Date(booking.date).toISOString().split('T')[0],
      fromTime: booking.fromTime,
      toTime: booking.toTime,
      packageType: booking.packageType,
      company: booking.company,
      contactPerson: booking.contactPerson,
      reference: booking.reference,
      contactNumber: booking.contactNumber,
      packageAmount: booking.packageAmount.toString(),
      bookingStatus: booking.bookingStatus,
      handoverStatus: booking.handoverStatus,
      handoverDate: booking.handoverDate ? 
        (booking.handoverDate.toDate ? booking.handoverDate.toDate().toISOString().split('T')[0] : '') : '',
      handoverUrl: booking.handoverUrl || '',
      paymentStatus: booking.paymentStatus,
      partPaidAmount: booking.partPaidAmount.toString(),
      balanceAmount: booking.balanceAmount.toString(),
      fullPaidDate: booking.fullPaidDate ? 
        (booking.fullPaidDate.toDate ? booking.fullPaidDate.toDate().toISOString().split('T')[0] : '') : '',
      expenses: booking.expenses || 'taxi',
      expensesAmount: booking.expensesAmount ? booking.expensesAmount.toString() : '0.000'
    });
    setShowBookingModal(true);
  };

  const applyReportFilters = () => {
    let filtered = [...bookings];

    if (reportFilters.photographerName) filtered = filtered.filter(b => b.photographerName.toLowerCase().includes(reportFilters.photographerName.toLowerCase()));
    if (reportFilters.startDate) filtered = filtered.filter(b => new Date(b.date) >= new Date(reportFilters.startDate));
    if (reportFilters.endDate) filtered = filtered.filter(b => new Date(b.date) <= new Date(reportFilters.endDate));
    if (reportFilters.packageType) filtered = filtered.filter(b => b.packageType === reportFilters.packageType);
    if (reportFilters.company) filtered = filtered.filter(b => b.company.toLowerCase().includes(reportFilters.company.toLowerCase()));
    if (reportFilters.contactPerson) filtered = filtered.filter(b => b.contactPerson.toLowerCase().includes(reportFilters.contactPerson.toLowerCase()));
    if (reportFilters.reference) filtered = filtered.filter(b => b.reference.toLowerCase().includes(reportFilters.reference.toLowerCase()));
    if (reportFilters.contactNumber) filtered = filtered.filter(b => b.contactNumber.includes(reportFilters.contactNumber));
    if (reportFilters.bookingStatus) filtered = filtered.filter(b => b.bookingStatus === reportFilters.bookingStatus);
    if (reportFilters.handoverStatus) filtered = filtered.filter(b => b.handoverStatus === reportFilters.handoverStatus);
    if (reportFilters.paymentStatus) filtered = filtered.filter(b => b.paymentStatus === reportFilters.paymentStatus);

    setFilteredBookings(filtered);
  };

  const exportToCSV = () => {
    const headers = [
      'Photographer', 'Date', 'From Time', 'To Time', 'Package Type', 'Company', 
      'Contact Person', 'Reference', 'Contact Number', 'Package Amount (KWD)', 
      'Booking Status', 'Handover Status', 'Handover Date', 'Handover URL',
      'Payment Status', 'Part Paid (KWD)', 'Balance (KWD)', 'Full Paid Date',
      'Expenses', 'Expenses Amount (KWD)'
    ];
    
    const rows = filteredBookings.map(b => [
      b.photographerName,
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
      b.handoverDate ? (b.handoverDate.toDate ? b.handoverDate.toDate().toLocaleDateString() : '') : '',
      b.handoverUrl || '',
      b.paymentStatus,
      b.partPaidAmount.toFixed(3),
      b.balanceAmount.toFixed(3),
      b.fullPaidDate ? (b.fullPaidDate.toDate ? b.fullPaidDate.toDate().toLocaleDateString() : '') : '',
      b.expenses || '',
      b.expensesAmount ? b.expensesAmount.toFixed(3) : '0.000'
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `marzuk-booking-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(18);
    doc.setTextColor(99, 102, 241);
    doc.text('Marzuk Calendar - Booking Report', 14, 20);
    
    // Date
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 28);
    
    // Summary Statistics
    const totalBookings = filteredBookings.length;
    const totalRevenue = filteredBookings.reduce((sum, b) => sum + b.packageAmount, 0);
    const totalBalance = filteredBookings.reduce((sum, b) => sum + b.balanceAmount, 0);
    const totalPaid = filteredBookings.reduce((sum, b) => sum + b.partPaidAmount, 0);
    const totalExpenses = filteredBookings.reduce((sum, b) => sum + (b.expensesAmount || 0), 0);
    
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`Total Bookings: ${totalBookings}`, 14, 38);
    doc.text(`Total Revenue: ${totalRevenue.toFixed(3)} KWD`, 14, 44);
    doc.text(`Total Paid: ${totalPaid.toFixed(3)} KWD`, 14, 50);
    doc.text(`Balance Due: ${totalBalance.toFixed(3)} KWD`, 14, 56);
    doc.text(`Total Expenses: ${totalExpenses.toFixed(3)} KWD`, 14, 62);
    
    // Table
    const tableData = filteredBookings.map(b => [
      b.photographerName,
      b.date instanceof Date ? b.date.toLocaleDateString() : new Date(b.date).toLocaleDateString(),
      `${b.fromTime}-${b.toTime}`,
      b.company,
      b.contactNumber,
      `${b.packageAmount.toFixed(3)}`,
      `${b.balanceAmount.toFixed(3)}`,
      b.expenses || 'N/A',
      `${b.expensesAmount ? b.expensesAmount.toFixed(3) : '0.000'}`,
      b.bookingStatus,
      b.paymentStatus
    ]);
    
    doc.autoTable({
      startY: 70,
      head: [['Photographer', 'Date', 'Time', 'Company', 'Contact', 'Amount', 'Balance', 'Expenses', 'Exp. Amt', 'Status', 'Payment']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241] },
      styles: { fontSize: 7 },
      columnStyles: {
        5: { halign: 'right' },
        6: { halign: 'right' },
        8: { halign: 'right' }
      }
    });
    
    doc.save(`marzuk-booking-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  };

  const getBookingsForDate = (date) => {
    if (!date) return [];
    return bookings.filter(booking => {
      const bookingDate = booking.date instanceof Date ? booking.date : new Date(booking.date);
      return bookingDate.toDateString() === date.toDateString();
    });
  };

  const changeMonth = (delta) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + delta, 1));
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];

  const inputStyle = {
    width: '100%',
    padding: '0.65rem',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '8px',
    color: '#e8e8e8',
    fontSize: '0.9rem',
    fontFamily: 'inherit'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '0.4rem',
    color: '#a0a0a0',
    fontSize: '0.85rem',
    fontWeight: 500
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom right, #0a0e27 0%, #1a1f3a 50%, #0f1419 100%)',
      fontFamily: '"IBM Plex Sans", -apple-system, sans-serif',
      color: '#e8e8e8'
    }}>
      <header style={{
        background: 'rgba(20, 25, 45, 0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '1.2rem 2rem',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <Calendar size={28} color="#6366f1" />
            <h1 style={{
              margin: 0,
              fontSize: '1.5rem',
              fontWeight: 600,
              color: '#f0f0f0',
              letterSpacing: '-0.02em'
            }}>
              Marzuk Calendar
            </h1>
          </div>
          <button
            onClick={() => setShowReportModal(true)}
            style={{
              padding: '0.7rem 1.3rem',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.9rem',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
            }}
          >
            <FileText size={18} />
            Report View
          </button>
        </div>
      </header>

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
        <div style={{
          background: 'rgba(30, 35, 55, 0.4)',
          borderRadius: '16px',
          padding: '1.8rem',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          marginBottom: '2rem',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}>
            <button onClick={() => changeMonth(-1)} style={{
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '8px',
              color: '#6366f1',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 600
            }}>←</button>
            <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 600, color: '#f0f0f0' }}>
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h2>
            <button onClick={() => changeMonth(1)} style={{
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '8px',
              color: '#6366f1',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 600
            }}>→</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.8rem' }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} style={{
                textAlign: 'center',
                fontWeight: 600,
                color: '#6366f1',
                padding: '0.5rem',
                fontSize: '0.85rem'
              }}>{day}</div>
            ))}
            {getDaysInMonth(currentMonth).map((date, index) => {
              const dayBookings = date ? getBookingsForDate(date).filter(b => b.bookingStatus !== 'cancelled') : [];
              const isSelected = date && selectedDate && date.toDateString() === selectedDate.toDateString();
              const isToday = date && date.toDateString() === new Date().toDateString();

              return (
                <div
                  key={index}
                  onClick={() => date && setSelectedDate(date)}
                  style={{
                    minHeight: '90px',
                    padding: '0.6rem',
                    background: date ? isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.02)' : 'transparent',
                    border: date ? isToday ? '2px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.08)' : 'none',
                    borderRadius: '10px',
                    cursor: date ? 'pointer' : 'default',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {date && (
                    <>
                      <div style={{ fontWeight: 600, marginBottom: '0.4rem', color: isToday ? '#6366f1' : '#e8e8e8', fontSize: '0.95rem' }}>
                        {date.getDate()}
                      </div>
                      {dayBookings.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                          {dayBookings.slice(0, 2).map((booking, i) => (
                            <div key={i} style={{
                              fontSize: '0.7rem',
                              padding: '0.2rem 0.4rem',
                              borderRadius: '4px',
                              background: booking.bookingStatus === 'completed' ? 'rgba(34, 197, 94, 0.2)' : booking.bookingStatus === 'postponed' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                              color: booking.bookingStatus === 'completed' ? '#4ade80' : booking.bookingStatus === 'postponed' ? '#f87171' : '#a5b4fc',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {booking.photographerName}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {selectedDate && (
          <div style={{
            background: 'rgba(30, 35, 55, 0.4)',
            borderRadius: '16px',
            padding: '1.8rem',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#f0f0f0' }}>
                {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </h3>
              <button
                onClick={() => {
                  resetForm();
                  // Fix timezone issue - use local date string
                  const year = selectedDate.getFullYear();
                  const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                  const day = String(selectedDate.getDate()).padStart(2, '0');
                  const localDateString = `${year}-${month}-${day}`;
                  setBookingForm(prev => ({ ...prev, date: localDateString }));
                  setShowBookingModal(true);
                }}
                style={{
                  padding: '0.6rem 1.2rem',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.9rem'
                }}
              >
                <Plus size={18} />
                Book
              </button>
            </div>

            {getBookingsForDate(selectedDate).length === 0 ? (
              <p style={{ color: '#888', textAlign: 'center', padding: '2rem' }}>
                No bookings for this date
              </p>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {getBookingsForDate(selectedDate).map(booking => (
                  <div key={booking.id} style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '1.2rem',
                    position: 'relative',
                    opacity: booking.bookingStatus === 'cancelled' ? 0.5 : 1
                  }}>
                    {/* Action Buttons */}
                    <div style={{
                      position: 'absolute',
                      top: '1rem',
                      right: '1rem',
                      display: 'flex',
                      gap: '0.5rem'
                    }}>
                      <button
                        onClick={() => handleEditBooking(booking)}
                        disabled={booking.bookingStatus === 'cancelled' || booking.bookingStatus === 'completed'}
                        style={{
                          background: 'rgba(99, 102, 241, 0.15)',
                          border: '1px solid rgba(99, 102, 241, 0.3)',
                          borderRadius: '6px',
                          color: '#6366f1',
                          padding: '0.4rem',
                          cursor: (booking.bookingStatus === 'cancelled' || booking.bookingStatus === 'completed') ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          opacity: (booking.bookingStatus === 'cancelled' || booking.bookingStatus === 'completed') ? 0.5 : 1
                        }}
                        title={booking.bookingStatus === 'completed' ? 'Cannot edit completed booking' : 'Edit Details'}
                      >
                        <Edit2 size={16} />
                      </button>
                      
                      <button
                        onClick={() => openModifyModal(booking)}
                        disabled={booking.bookingStatus === 'completed' || booking.bookingStatus === 'cancelled'}
                        style={{
                          background: 'rgba(245, 158, 11, 0.15)',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                          borderRadius: '6px',
                          color: '#f59e0b',
                          padding: '0.4rem',
                          cursor: (booking.bookingStatus === 'completed' || booking.bookingStatus === 'cancelled') ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          opacity: (booking.bookingStatus === 'completed' || booking.bookingStatus === 'cancelled') ? 0.5 : 1
                        }}
                        title="Modify Date/Time"
                      >
                        <Calendar size={16} />
                      </button>

                      <button
                        onClick={() => handleCancelBooking(booking)}
                        disabled={booking.bookingStatus === 'cancelled'}
                        style={{
                          background: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: '6px',
                          color: '#ef4444',
                          padding: '0.4rem',
                          cursor: booking.bookingStatus === 'cancelled' ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          opacity: booking.bookingStatus === 'cancelled' ? 0.5 : 1
                        }}
                        title="Cancel Booking"
                      >
                        <XCircle size={16} />
                      </button>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: '1rem',
                      marginTop: '0.5rem'
                    }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.2rem' }}>Photographer</div>
                        <div style={{ fontWeight: 600, color: '#6366f1' }}>{booking.photographerName}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.2rem' }}>Time</div>
                        <div style={{ fontWeight: 600 }}>{booking.fromTime} - {booking.toTime}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.2rem' }}>Package</div>
                        <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{booking.packageType}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.2rem' }}>Company</div>
                        <div style={{ fontWeight: 600 }}>{booking.company}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.2rem' }}>Contact</div>
                        <div style={{ fontWeight: 600 }}>{booking.contactPerson}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.2rem' }}>Phone</div>
                        <div style={{ fontWeight: 600 }}>{booking.contactNumber}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.2rem' }}>Amount</div>
                        <div style={{ fontWeight: 600, color: '#10b981' }}>{booking.packageAmount.toFixed(3)} KWD</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.2rem' }}>Balance</div>
                        <div style={{ fontWeight: 600, color: booking.balanceAmount > 0 ? '#ef4444' : '#10b981' }}>
                          {booking.balanceAmount.toFixed(3)} KWD
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.2rem' }}>Status</div>
                        <span style={{
                          display: 'inline-block',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '12px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          background: booking.bookingStatus === 'completed' ? 'rgba(34, 197, 94, 0.2)' : booking.bookingStatus === 'postponed' ? 'rgba(239, 68, 68, 0.2)' : booking.bookingStatus === 'cancelled' ? 'rgba(107, 114, 128, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                          color: booking.bookingStatus === 'completed' ? '#4ade80' : booking.bookingStatus === 'postponed' ? '#f87171' : booking.bookingStatus === 'cancelled' ? '#9ca3af' : '#a5b4fc',
                          textTransform: 'capitalize'
                        }}>
                          {booking.bookingStatus}
                        </span>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.2rem' }}>Payment</div>
                        <span style={{
                          display: 'inline-block',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '12px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          background: booking.paymentStatus === 'full paid' ? 'rgba(34, 197, 94, 0.2)' : booking.paymentStatus === 'not paid' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                          color: booking.paymentStatus === 'full paid' ? '#4ade80' : booking.paymentStatus === 'not paid' ? '#f87171' : '#fbbf24',
                          textTransform: 'capitalize'
                        }}>
                          {booking.paymentStatus}
                        </span>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.2rem' }}>Handover</div>
                        <span style={{
                          display: 'inline-block',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '12px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          background: booking.handoverStatus === 'done' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(148, 163, 184, 0.2)',
                          color: booking.handoverStatus === 'done' ? '#4ade80' : '#94a3b8',
                          textTransform: 'capitalize'
                        }}>
                          {booking.handoverStatus}
                        </span>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.2rem' }}>Expenses</div>
                        <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>
                          {booking.expenses || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.2rem' }}>Expenses Amount</div>
                        <div style={{ fontWeight: 600, color: '#f59e0b' }}>
                          {booking.expensesAmount ? booking.expensesAmount.toFixed(3) : '0.000'} KWD
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Booking Modal - continuing in next part due to length */}
      {showBookingModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '2rem',
          overflow: 'auto'
        }}>
          <div style={{
            background: 'linear-gradient(to bottom right, #1a1f3a 0%, #0f1419 100%)',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '900px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            position: 'relative'
          }}>
            <button
              onClick={() => {
                setShowBookingModal(false);
                resetForm();
              }}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '6px',
                color: 'white',
                padding: '0.4rem',
                cursor: 'pointer',
                display: 'flex'
              }}
            >
              <X size={20} />
            </button>

            <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.4rem', color: '#f0f0f0' }}>
              {editingBooking ? 'Edit Booking' : 'New Booking'}
            </h2>

            <form onSubmit={handleBookingSubmit}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '1.2rem'
              }}>
                <div>
                  <label style={labelStyle}>Photographer Name *</label>
                  <select
                    value={bookingForm.photographerName}
                    onChange={(e) => setBookingForm({...bookingForm, photographerName: e.target.value})}
                    required
                    style={{...inputStyle, cursor: 'pointer'}}
                  >
                    <option value="Marzuk">Marzuk</option>
                    <option value="Ajmal">Ajmal</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Date *</label>
                  <input type="date" value={bookingForm.date}
                    onChange={(e) => setBookingForm({...bookingForm, date: e.target.value})}
                    required style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>From Time *</label>
                  <input type="time" value={bookingForm.fromTime}
                    onChange={(e) => setBookingForm({...bookingForm, fromTime: e.target.value})}
                    required style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>To Time *</label>
                  <input type="time" value={bookingForm.toTime}
                    onChange={(e) => setBookingForm({...bookingForm, toTime: e.target.value})}
                    required style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Package Type *</label>
                  <select value={bookingForm.packageType}
                    onChange={(e) => setBookingForm({...bookingForm, packageType: e.target.value})}
                    required style={{...inputStyle, cursor: 'pointer'}}>
                    <option value="photography">Photography</option>
                    <option value="videography">Videography</option>
                    <option value="both">Both</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Company *</label>
                  <input 
                    type="text" 
                    maxLength="15" 
                    value={bookingForm.company}
                    onChange={(e) => handleCompanyChange(e.target.value)}
                    list="companies-list"
                    required 
                    style={inputStyle} 
                    placeholder="Type or select..."
                  />
                  <datalist id="companies-list">
                    {uniqueCompanies.map((comp, idx) => (
                      <option key={idx} value={comp.company} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label style={labelStyle}>Contact Person *</label>
                  <input type="text" maxLength="20" value={bookingForm.contactPerson}
                    onChange={(e) => setBookingForm({...bookingForm, contactPerson: e.target.value})}
                    required style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Reference</label>
                  <input type="text" maxLength="20" value={bookingForm.reference}
                    onChange={(e) => setBookingForm({...bookingForm, reference: e.target.value})}
                    style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Contact Number *</label>
                  <input type="text" maxLength="10" pattern="[0-9]*" value={bookingForm.contactNumber}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setBookingForm({...bookingForm, contactNumber: val});
                    }}
                    required style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Package Amount (KWD) *</label>
                  <input type="text" value={bookingForm.packageAmount}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^\d.]/g, '');
                      setBookingForm({...bookingForm, packageAmount: val});
                    }}
                    placeholder="0000.000" required style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Booking Status *</label>
                  <select value={bookingForm.bookingStatus}
                    onChange={(e) => setBookingForm({...bookingForm, bookingStatus: e.target.value})}
                    required style={{...inputStyle, cursor: 'pointer'}}>
                    <option value="booked">Booked</option>
                    <option value="postponed">Postponed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Handover Status *</label>
                  <select value={bookingForm.handoverStatus}
                    onChange={(e) => setBookingForm({...bookingForm, handoverStatus: e.target.value})}
                    required style={{...inputStyle, cursor: 'pointer'}}>
                    <option value="pending">Pending</option>
                    <option value="done">Done</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Handover Date</label>
                  <input type="date" value={bookingForm.handoverDate}
                    onChange={(e) => setBookingForm({...bookingForm, handoverDate: e.target.value})}
                    style={inputStyle} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={labelStyle}>Handover URL</label>
                  <input type="text" maxLength="500" value={bookingForm.handoverUrl}
                    onChange={(e) => setBookingForm({...bookingForm, handoverUrl: e.target.value})}
                    placeholder="https://..." style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Payment Status *</label>
                  <select value={bookingForm.paymentStatus}
                    onChange={(e) => setBookingForm({...bookingForm, paymentStatus: e.target.value})}
                    required style={{...inputStyle, cursor: 'pointer'}}>
                    <option value="not paid">Not Paid</option>
                    <option value="part paid">Part Paid</option>
                    <option value="full paid">Full Paid</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Part Paid Amount (KWD)</label>
                  <input type="text" value={bookingForm.partPaidAmount}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^\d.]/g, '');
                      setBookingForm({...bookingForm, partPaidAmount: val});
                    }}
                    placeholder="0000.000" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Balance Amount (KWD)</label>
                  <input type="text" value={bookingForm.balanceAmount} disabled
                    style={{...inputStyle, background: 'rgba(255, 255, 255, 0.02)', cursor: 'not-allowed'}} />
                </div>
                <div>
                  <label style={labelStyle}>Full Paid Date</label>
                  <input type="date" value={bookingForm.fullPaidDate}
                    onChange={(e) => setBookingForm({...bookingForm, fullPaidDate: e.target.value})}
                    style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Expenses</label>
                  <select
                    value={bookingForm.expenses}
                    onChange={(e) => setBookingForm({...bookingForm, expenses: e.target.value})}
                    style={{...inputStyle, cursor: 'pointer'}}
                  >
                    <option value="taxi">Taxi</option>
                    <option value="rent">Rent</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Expenses Amount (KWD)</label>
                  <input 
                    type="text" 
                    value={bookingForm.expensesAmount}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^\d.]/g, '');
                      setBookingForm({...bookingForm, expensesAmount: val});
                    }}
                    placeholder="000.000" 
                    style={inputStyle} 
                  />
                </div>
              </div>

              <div style={{
                marginTop: '2rem',
                display: 'flex',
                gap: '1rem',
                justifyContent: 'flex-end'
              }}>
                <button type="button"
                  onClick={() => {
                    setShowBookingModal(false);
                    resetForm();
                  }}
                  style={{
                    padding: '0.7rem 1.3rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '8px',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 600
                  }}>
                  Cancel
                </button>
                <button type="submit"
                  style={{
                    padding: '0.7rem 1.3rem',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 600
                  }}>
                  {editingBooking ? 'Update' : 'Create'} Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modify Modal - NEW */}
      {showModifyModal && modifyingBooking && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001,
          padding: '2rem'
        }}>
          <div style={{
            background: 'linear-gradient(to bottom right, #1a1f3a 0%, #0f1419 100%)',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '500px',
            width: '100%',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            position: 'relative'
          }}>
            <button onClick={() => setShowModifyModal(false)} style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '6px',
              color: 'white',
              padding: '0.4rem',
              cursor: 'pointer',
              display: 'flex'
            }}>
              <X size={20} />
            </button>

            <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.4rem', color: '#f0f0f0' }}>
              Modify Date & Time
            </h2>
            
            <p style={{
              padding: '0.8rem',
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '8px',
              fontSize: '0.85rem',
              color: '#f59e0b',
              marginBottom: '1.5rem'
            }}>
              ⚠️ Modifying will automatically change status to <strong>POSTPONED</strong>
            </p>

            <form onSubmit={handleModifySubmit}>
              <div style={{ display: 'grid', gap: '1.2rem' }}>
                <div>
                  <label style={labelStyle}>New Date *</label>
                  <input type="date" value={modifyForm.date}
                    onChange={(e) => setModifyForm({...modifyForm, date: e.target.value})}
                    required style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>New From Time *</label>
                  <input type="time" value={modifyForm.fromTime}
                    onChange={(e) => setModifyForm({...modifyForm, fromTime: e.target.value})}
                    required style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>New To Time *</label>
                  <input type="time" value={modifyForm.toTime}
                    onChange={(e) => setModifyForm({...modifyForm, toTime: e.target.value})}
                    required style={inputStyle} />
                </div>
              </div>

              <div style={{
                marginTop: '2rem',
                display: 'flex',
                gap: '1rem',
                justifyContent: 'flex-end'
              }}>
                <button type="button"
                  onClick={() => setShowModifyModal(false)}
                  style={{
                    padding: '0.7rem 1.3rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '8px',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 600
                  }}>
                  Cancel
                </button>
                <button type="submit"
                  style={{
                    padding: '0.7rem 1.3rem',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 600
                  }}>
                  Modify & Postpone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Modal - keeping minimal for space, includes PDF button */}
      {showReportModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '2rem',
          overflow: 'auto'
        }}>
          <div style={{
            background: 'linear-gradient(to bottom right, #1a1f3a 0%, #0f1419 100%)',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '1200px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            position: 'relative'
          }}>
            <button onClick={() => setShowReportModal(false)} style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '6px',
              color: 'white',
              padding: '0.4rem',
              cursor: 'pointer',
              display: 'flex'
            }}>
              <X size={20} />
            </button>

            <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.4rem', color: '#f0f0f0' }}>Report View</h2>

            {/* Filters */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div>
                <label style={labelStyle}>Photographer</label>
                <input
                  type="text"
                  value={reportFilters.photographerName}
                  onChange={(e) => setReportFilters({...reportFilters, photographerName: e.target.value})}
                  placeholder="Search..."
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Start Date</label>
                <input
                  type="date"
                  value={reportFilters.startDate}
                  onChange={(e) => setReportFilters({...reportFilters, startDate: e.target.value})}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>End Date</label>
                <input
                  type="date"
                  value={reportFilters.endDate}
                  onChange={(e) => setReportFilters({...reportFilters, endDate: e.target.value})}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Package Type</label>
                <select
                  value={reportFilters.packageType}
                  onChange={(e) => setReportFilters({...reportFilters, packageType: e.target.value})}
                  style={{...inputStyle, cursor: 'pointer'}}
                >
                  <option value="">All</option>
                  <option value="photography">Photography</option>
                  <option value="videography">Videography</option>
                  <option value="both">Both</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Company</label>
                <input
                  type="text"
                  value={reportFilters.company}
                  onChange={(e) => setReportFilters({...reportFilters, company: e.target.value})}
                  placeholder="Search..."
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Contact Person</label>
                <input
                  type="text"
                  value={reportFilters.contactPerson}
                  onChange={(e) => setReportFilters({...reportFilters, contactPerson: e.target.value})}
                  placeholder="Search..."
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Reference</label>
                <input
                  type="text"
                  value={reportFilters.reference}
                  onChange={(e) => setReportFilters({...reportFilters, reference: e.target.value})}
                  placeholder="Search..."
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Contact Number</label>
                <input
                  type="text"
                  value={reportFilters.contactNumber}
                  onChange={(e) => setReportFilters({...reportFilters, contactNumber: e.target.value})}
                  placeholder="Search..."
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Booking Status</label>
                <select
                  value={reportFilters.bookingStatus}
                  onChange={(e) => setReportFilters({...reportFilters, bookingStatus: e.target.value})}
                  style={{...inputStyle, cursor: 'pointer'}}
                >
                  <option value="">All</option>
                  <option value="booked">Booked</option>
                  <option value="postponed">Postponed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Handover Status</label>
                <select
                  value={reportFilters.handoverStatus}
                  onChange={(e) => setReportFilters({...reportFilters, handoverStatus: e.target.value})}
                  style={{...inputStyle, cursor: 'pointer'}}
                >
                  <option value="">All</option>
                  <option value="pending">Pending</option>
                  <option value="done">Done</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Payment Status</label>
                <select
                  value={reportFilters.paymentStatus}
                  onChange={(e) => setReportFilters({...reportFilters, paymentStatus: e.target.value})}
                  style={{...inputStyle, cursor: 'pointer'}}
                >
                  <option value="">All</option>
                  <option value="not paid">Not Paid</option>
                  <option value="part paid">Part Paid</option>
                  <option value="full paid">Full Paid</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
              <button onClick={applyReportFilters} style={{
                padding: '0.7rem 1.3rem',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Filter size={18} />
                Apply Filters
              </button>
              <button onClick={exportToCSV} style={{
                padding: '0.7rem 1.3rem',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '8px',
                color: '#10b981',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Download size={18} />
                CSV
              </button>
              <button onClick={exportToPDF} style={{
                padding: '0.7rem 1.3rem',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                color: '#ef4444',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Download size={18} />
                PDF
              </button>
            </div>

            {/* Summary Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              <div style={{
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                borderRadius: '10px',
                padding: '1rem'
              }}>
                <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '0.4rem' }}>Total Bookings</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#6366f1' }}>
                  {filteredBookings.length}
                </div>
              </div>
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '10px',
                padding: '1rem'
              }}>
                <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '0.4rem' }}>Total Revenue</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#10b981' }}>
                  {filteredBookings.reduce((sum, b) => sum + b.packageAmount, 0).toFixed(3)} KWD
                </div>
              </div>
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '10px',
                padding: '1rem'
              }}>
                <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '0.4rem' }}>Balance Due</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#ef4444' }}>
                  {filteredBookings.reduce((sum, b) => sum + b.balanceAmount, 0).toFixed(3)} KWD
                </div>
              </div>
              <div style={{
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '10px',
                padding: '1rem'
              }}>
                <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '0.4rem' }}>Total Paid</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#f59e0b' }}>
                  {filteredBookings.reduce((sum, b) => sum + b.partPaidAmount, 0).toFixed(3)} KWD
                </div>
              </div>
              <div style={{
                background: 'rgba(139, 92, 246, 0.1)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '10px',
                padding: '1rem'
              }}>
                <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '0.4rem' }}>Total Expenses</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#8b5cf6' }}>
                  {filteredBookings.reduce((sum, b) => sum + (b.expensesAmount || 0), 0).toFixed(3)} KWD
                </div>
              </div>
            </div>

            {/* Report Table */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '10px',
              overflow: 'auto',
              maxHeight: '400px'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{
                  position: 'sticky',
                  top: 0,
                  background: 'rgba(26, 31, 58, 0.95)',
                  backdropFilter: 'blur(10px)'
                }}>
                  <tr>
                    <th style={{ padding: '0.8rem', textAlign: 'left', color: '#6366f1', fontSize: '0.8rem', fontWeight: 600 }}>Photographer</th>
                    <th style={{ padding: '0.8rem', textAlign: 'left', color: '#6366f1', fontSize: '0.8rem', fontWeight: 600 }}>Date</th>
                    <th style={{ padding: '0.8rem', textAlign: 'left', color: '#6366f1', fontSize: '0.8rem', fontWeight: 600 }}>Company</th>
                    <th style={{ padding: '0.8rem', textAlign: 'left', color: '#6366f1', fontSize: '0.8rem', fontWeight: 600 }}>Contact</th>
                    <th style={{ padding: '0.8rem', textAlign: 'right', color: '#6366f1', fontSize: '0.8rem', fontWeight: 600 }}>Amount</th>
                    <th style={{ padding: '0.8rem', textAlign: 'right', color: '#6366f1', fontSize: '0.8rem', fontWeight: 600 }}>Balance</th>
                    <th style={{ padding: '0.8rem', textAlign: 'left', color: '#6366f1', fontSize: '0.8rem', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '0.8rem', textAlign: 'left', color: '#6366f1', fontSize: '0.8rem', fontWeight: 600 }}>Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking, index) => (
                    <tr key={booking.id} style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      background: index % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)'
                    }}>
                      <td style={{ padding: '0.8rem', fontSize: '0.85rem' }}>{booking.photographerName}</td>
                      <td style={{ padding: '0.8rem', fontSize: '0.85rem' }}>
                        {booking.date instanceof Date ? booking.date.toLocaleDateString() : new Date(booking.date).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '0.8rem', fontSize: '0.85rem' }}>{booking.company}</td>
                      <td style={{ padding: '0.8rem', fontSize: '0.85rem' }}>{booking.contactNumber}</td>
                      <td style={{ padding: '0.8rem', fontSize: '0.85rem', textAlign: 'right' }}>
                        {booking.packageAmount.toFixed(3)} KWD
                      </td>
                      <td style={{ 
                        padding: '0.8rem', 
                        fontSize: '0.85rem', 
                        textAlign: 'right',
                        color: booking.balanceAmount > 0 ? '#ef4444' : '#10b981',
                        fontWeight: 600
                      }}>
                        {booking.balanceAmount.toFixed(3)} KWD
                      </td>
                      <td style={{ padding: '0.8rem', fontSize: '0.85rem' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '10px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: booking.bookingStatus === 'completed' ? 'rgba(34, 197, 94, 0.2)' : booking.bookingStatus === 'postponed' ? 'rgba(239, 68, 68, 0.2)' : booking.bookingStatus === 'cancelled' ? 'rgba(107, 114, 128, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                          color: booking.bookingStatus === 'completed' ? '#4ade80' : booking.bookingStatus === 'postponed' ? '#f87171' : booking.bookingStatus === 'cancelled' ? '#9ca3af' : '#a5b4fc',
                          textTransform: 'capitalize'
                        }}>
                          {booking.bookingStatus}
                        </span>
                      </td>
                      <td style={{ padding: '0.8rem', fontSize: '0.85rem' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '10px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: booking.paymentStatus === 'full paid' ? 'rgba(34, 197, 94, 0.2)' : booking.paymentStatus === 'not paid' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                          color: booking.paymentStatus === 'full paid' ? '#4ade80' : booking.paymentStatus === 'not paid' ? '#f87171' : '#fbbf24',
                          textTransform: 'capitalize'
                        }}>
                          {booking.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredBookings.length === 0 && (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#888' }}>
                  No bookings found matching the selected filters
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        input[type="date"]::-webkit-calendar-picker-indicator,
        input[type="time"]::-webkit-calendar-picker-indicator {
          filter: invert(1);
          cursor: pointer;
        }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.02); }
        ::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.3); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(99, 102, 241, 0.5); }
      `}</style>
    </div>
  );
};

export default MarzukCalendar;
