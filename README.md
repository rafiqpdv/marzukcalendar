# Photography Booking System

A professional booking calendar application with Firebase backend and Vercel deployment.

## Features

### Calendar Interface
- Monthly calendar view with navigation
- Visual booking indicators on dates
- Click date to view bookings
- Maximum 2 bookings per time slot (2 photographers)

### Booking Management
- **Photographer Name**: 10 characters
- **Date**: Default current date
- **Time**: From/To time selection
- **Package Type**: Photography, Videography, Both
- **Company**: 15 characters
- **Contact Person**: 20 characters
- **Reference**: 20 characters
- **Contact Number**: 10 digits (numbers only)
- **Package Amount**: KWD format (0000.000)
- **Booking Status**: Booked, Postponed, Completed
- **Handover Status**: Pending, Done
- **Handover Date**: Date field
- **Handover URL**: 500 characters
- **Payment Status**: Not Paid, Part Paid, Full Paid
- **Part Paid Amount**: KWD format (0000.000)
- **Balance Amount**: Auto-calculated (Package - Part Paid)
- **Full Paid Date**: Date field

### Report View
- Filter by all fields
- Real-time statistics (Total Bookings, Revenue, Balance, Paid)
- CSV export functionality
- Comprehensive data table

## Setup Instructions

### 1. Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create new project or select existing
3. Enable Firestore Database:
   - Click "Firestore Database"
   - Click "Create database"
   - Choose "Start in test mode" (for development)
   - Select region (e.g., asia-south1)

4. Get Firebase config:
   - Project Settings → Your apps
   - Click web icon (</>)
   - Copy firebaseConfig object

5. Update `src/App.jsx` (lines 13-19):
```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id",
  storageBucket: "your-storage-bucket",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

6. Set Firestore Security Rules:
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

### 2. Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Visit http://localhost:5173
```

### 3. GitHub Setup

```bash
# Initialize git
git init
git add .
git commit -m "Initial commit"
git branch -M main

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git push -u origin main
```

### 4. Vercel Deployment

**Option A: Vercel Dashboard**
1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "New Project"
4. Import your repository
5. Framework: Vite (auto-detected)
6. Click "Deploy"

**Option B: Vercel CLI**
```bash
npm install -g vercel
vercel login
vercel
```

## Usage

### Creating a Booking
1. Click on a date in the calendar
2. Click "Book" button
3. Fill in all fields (fields marked * are required)
4. Click "Create Booking"

### Editing a Booking
1. Click on a date with bookings
2. Click edit icon on any booking card
3. Modify fields as needed
4. Click "Update Booking"

### Viewing Reports
1. Click "Report View" button in header
2. Set desired filters
3. Click "Apply Filters"
4. Review statistics and table
5. Click "Export CSV" to download

## Important Notes

- **Maximum 2 bookings** allowed per date and time slot
- **Balance amount** is automatically calculated
- All monetary values use **KWD currency** with 3 decimal places (0000.000)
- **Character limits** are enforced on text fields
- **Contact number** accepts only numeric input

## Tech Stack

- **Frontend**: React 18 + Vite
- **Database**: Firebase Firestore
- **Deployment**: Vercel
- **Icons**: Lucide React
- **Styling**: Inline CSS with custom design

## Database Structure

```javascript
{
  photographerName: String (max 10 chars),
  date: Timestamp,
  fromTime: String,
  toTime: String,
  packageType: String ("photography" | "videography" | "both"),
  company: String (max 15 chars),
  contactPerson: String (max 20 chars),
  reference: String (max 20 chars),
  contactNumber: String (10 digits),
  packageAmount: Number,
  bookingStatus: String ("booked" | "postponed" | "completed"),
  handoverStatus: String ("pending" | "done"),
  handoverDate: Timestamp | null,
  handoverUrl: String (max 500 chars),
  paymentStatus: String ("not paid" | "part paid" | "full paid"),
  partPaidAmount: Number,
  balanceAmount: Number,
  fullPaidDate: Timestamp | null,
  createdAt: Timestamp,
  updatedAt: Timestamp (on edits)
}
```

## Troubleshooting

**Can't see bookings?**
- Check Firebase config is correct
- Verify Firestore is enabled
- Check browser console (F12) for errors

**Build fails on Vercel?**
- Ensure all files are committed to GitHub
- Check package.json exists
- Verify no syntax errors

**2-booking limit not working?**
- Check time overlap logic
- Verify Firebase data is correct
- Look for console errors

## Security for Production

Update Firestore rules for authenticated access:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /bookings/{bookingId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

Then add Firebase Authentication to your project.

## Support

For issues:
- Check Firebase Console for database errors
- Review browser console for JavaScript errors
- Verify all environment variables are set correctly

---

Built with ❤️ for Photography Studios
