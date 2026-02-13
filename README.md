# Marzuk Calendar - Photography Booking System

Complete booking management system with Firebase backend and Vercel deployment.

## ✨ New Features in v2.0

### 1. PDF Report Export
- Generate professional PDF reports with summary statistics
- Includes all filtered booking data in table format
- Download as PDF in addition to CSV export

### 2. Cancel Booking
- Cancel button for each booking
- Automatically updates status to "cancelled"
- Cancelled bookings shown with reduced opacity
- Cannot edit or modify cancelled bookings

### 3. Modify Date & Time
- Separate "Modify" button to change date/time
- Automatically updates status to "postponed" when modified
- Cannot modify completed bookings
- Validates time clashes before allowing modification

### 4. Enhanced Time Clash Validation
- Maximum 2 bookings per date and time slot
- Checks for overlapping time periods
- Clear error message: "⚠️ Time Clash! Please select another time"
- Works for both new bookings and modifications

### 5. Photographer Dropdown
- Changed from text input to dropdown
- Options: "Marzuk" and "Ajmal"
- Default selection: "Marzuk"

### 6. New Status: Cancelled
- Added "cancelled" to booking status options
- Automatically set when using Cancel button
- Excluded from active booking counts

## 📋 Features

### Calendar View
- Monthly calendar with navigation
- Visual booking indicators
- Click date to view bookings
- Today's date highlighted

### Booking Management
- **Photographer**: Dropdown (Marzuk/Ajmal)
- **Date & Time**: From/To time selection
- **Package Type**: Photography, Videography, Both
- **Company**: 15 characters max
- **Contact Person**: 20 characters max
- **Reference**: 20 characters max
- **Contact Number**: 10 digits (numbers only)
- **Package Amount**: KWD format (0000.000)
- **Booking Status**: Booked, Postponed, Completed, Cancelled
- **Handover Status**: Pending, Done
- **Handover Date & URL**
- **Payment Status**: Not Paid, Part Paid, Full Paid
- **Auto-calculated Balance**

### Action Buttons for Each Booking
- **Edit (Pencil Icon)**: Edit all booking details
- **Modify (Calendar Icon)**: Change date/time (sets status to postponed)
- **Cancel (X Icon)**: Cancel booking (sets status to cancelled)

### Report Generation
- Filter by all fields
- Real-time statistics
- **CSV Export**
- **PDF Export** (NEW!)

## 🚀 Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Firebase Configuration
Update `src/App.jsx` lines 17-23 with your Firebase config:
```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 3. Firestore Security Rules
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /bookings/{document=**} {
      allow read, write: if true; // Development only
    }
  }
}
```

### 4. Run Locally
```bash
npm run dev
```

### 5. Deploy to Vercel
```bash
# Push to GitHub first
git init
git add .
git commit -m "Initial commit"
git push

# Then deploy on Vercel
# Import from GitHub at vercel.com
```

## 🎯 Business Rules

### Time Clash Prevention
- **Maximum 2 bookings** per date and time slot
- System checks for overlapping times:
  - New booking time overlaps existing time → ❌ Blocked
  - Modification creates time clash → ❌ Blocked
  - Clear error message displayed

### Booking Status Workflow
1. **Booked** (default for new bookings)
2. **Postponed** (auto-set when date/time modified)
3. **Completed** (manually set, cannot be modified)
4. **Cancelled** (set via Cancel button, cannot be edited)

### Modification Rules
- ✅ Can modify: Booked, Postponed
- ❌ Cannot modify: Completed, Cancelled
- Modification automatically changes status to "Postponed"

## 📊 Report Features

### Filters Available
- Photographer Name
- Date Range (Start/End)
- Package Type
- Company
- Contact Person
- Reference
- Contact Number
- Booking Status
- Handover Status
- Payment Status

### Export Options
1. **CSV Export**: All data in spreadsheet format
2. **PDF Export**: Formatted report with:
   - Header with title and generation date
   - Summary statistics
   - Professional table layout
   - Color-coded headers

## 🎨 UI/UX Features

- Dark theme with gradient backgrounds
- Color-coded status indicators:
  - 🟢 Green: Completed, Full Paid, Done
  - 🔴 Red: Postponed, Not Paid, Balance Due
  - 🟡 Yellow: Part Paid
  - 🔵 Blue: Booked
  - ⚫ Gray: Cancelled, Pending
- Hover effects on interactive elements
- Smooth transitions and animations
- Responsive layout
- Custom scrollbars

## 💾 Database Structure

```javascript
{
  photographerName: String ("Marzuk" | "Ajmal"),
  date: Timestamp,
  fromTime: String,
  toTime: String,
  packageType: String,
  company: String (max 15),
  contactPerson: String (max 20),
  reference: String (max 20),
  contactNumber: String (10 digits),
  packageAmount: Number,
  bookingStatus: String ("booked" | "postponed" | "completed" | "cancelled"),
  handoverStatus: String,
  handoverDate: Timestamp | null,
  handoverUrl: String (max 500),
  paymentStatus: String,
  partPaidAmount: Number,
  balanceAmount: Number (auto-calculated),
  fullPaidDate: Timestamp | null,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## ⚙️ Tech Stack

- React 18
- Firebase Firestore
- jsPDF & jsPDF-AutoTable (PDF generation)
- Lucide React (Icons)
- Vite (Build tool)
- Vercel (Deployment)

## 🐛 Troubleshooting

**Time clash not working?**
- Check that times are in correct format (HH:MM)
- Verify booking status is not "cancelled"
- Check console for errors

**Cannot modify booking?**
- Completed bookings cannot be modified (by design)
- Cancelled bookings cannot be modified (by design)
- Use Edit button for other changes

**PDF not generating?**
- Check browser console for errors
- Verify jspdf packages are installed
- Try CSV export as alternative

**Booking not saving?**
- Check Firebase configuration
- Verify Firestore rules allow write access
- Check browser console for errors

## 📝 Change Log

### v2.0.0 (Latest)
- ✅ PDF report export
- ✅ Cancel booking feature
- ✅ Modify date/time feature
- ✅ Enhanced time clash validation
- ✅ Photographer dropdown (Marzuk/Ajmal)
- ✅ Cancelled status added
- ✅ Title changed to "Marzuk Calendar"

### v1.0.0
- Initial release with basic booking features

## 📞 Support

For issues:
- Check Firebase Console for database errors
- Review browser console (F12) for JavaScript errors
- Verify all dependencies are installed
- Test in incognito/private window

---

Built for Marzuk Photography 📸
