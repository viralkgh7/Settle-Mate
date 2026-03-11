# Split-Mate

Split-Mate is a comprehensive React Native & Expo application designed to seamlessly track, manage, and settle shared expenses among groups. Borrowing core concepts from SplitWise, this app simplifies group finances by calculating exactly "who owes who" and providing intuitive workflows for both tracking expenditures and zeroing out balances.

## Features ✨

### Core Functionality
- **Expense Tracking**: Easily add expenses, noting the total amount, description, and group.
- **Group Management**: Create and manage groups for roommates, trips, dinners, or events.
- **Smart Debt Calculation**: Automatically calculates the most efficient way to settle up within the group. 
- **Settle Up Workflow**: Dedicated screens to review outstanding balances and seamlessly mark them as paid/settled.

### User Experience
- **Authentication**: Secured login and signup flows, powered by Firebase Authentication.
- **Profile Integration**: Personalized profiles linking individual expenses to users.
- **Receipt Capture**: Integrated Expo Camera functionality to easily snap photos of receipts and attach them to expenses.

## Tech Stack 🛠️

- **Frontend Framework**: [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/) for cross-platform app development.
- **Language**: [TypeScript](https://www.typescriptlang.org/) for robust, type-safe code.
- **Backend & Database**: [Firebase](https://firebase.google.com/) Firestore for real-time cloud data storage.
- **Authentication**: Firebase Auth (OTP/Email depending on configuration).
- **Navigation**: React Navigation (Native Stack) for smooth screen transitions.
- **Styling**: Structured custom theme implementations using standard React Native styling.

## Project Structure 📁

- `src/components/`: Reusable UI elements (buttons, inputs, cards).
- `src/screens/`: Main application views (AddExpense, SettleUp, Profile, Camera, etc.).
- `src/navigation/`: Route configuration and stack navigators.
- `src/context/`: Global state management, primarily for Authentication flows.
- `src/hooks/`: Custom React hooks for separating logic from views.
- `src/utils/`: Core helper functions (like expense and settlement math).
- `src/theme.ts`: Centralized design system (colors, typography, spacing).

## Setup & Running Locally 🚀

### Prerequisites
- Node.js installed
- Expo Go app on your physical device (or iOS Simulator/Android Emulator)

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/viralkgh7/Split-Mate.git
   cd Split-Mate
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Firebase Configuration**
   Ensure your Firebase credentials are correct in `src/firebaseConfig.ts`. (You may need to verify your Firestore Security Rules if encountering permission errors during testing).

4. **Start the Development Server**
   ```bash
   npm start
   # or
   npx expo start
   ```

5. **Run the App**
   - Press `a` to open in Android Emulator.
   - Press `i` to open in iOS Simulator.
   - Scan the QR code with the Expo Go app on your physical phone.

---

> Built with React Native & Expo 🚀
