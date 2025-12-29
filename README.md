TrueCost Mobile
TrueCost is a comprehensive personal finance and budgeting application built with Expo and React Native. It is designed to help users track expenses, manage subscriptions, analyze budget profiles, and simulate loan scenarios with a privacy-first, local-storage approach.

🚀 Features
Comprehensive Budget Profiling:

Support for both Salaried and Hourly income types.

Track fixed and variable expenses.

Set savings targets and emergency fund goals.

Expense Tracking:

Log daily expenses with detailed categorization.

Attach receipt images to expense entries.

Visualize spending habits.

Subscription Management:

Track recurring payments and billing cycles (Monthly/Yearly).

Monitor active vs. inactive subscriptions.

Loan Scenarios & Calculators:

Simulate various loan structures.

Compare fixed annual rates vs. spread-over-policy rates.

Calculate principal, terms, and payment frequencies.

Privacy Focused:

Local-First Architecture: All data is stored locally on the device using SQLite.

No external server dependency for basic functionality.

🛠 Tech Stack
Framework: Expo (SDK 54) & React Native

Language: TypeScript

Database: SQLite via expo-sqlite

ORM: Drizzle ORM

Navigation: Expo Router (File-based routing)

UI/Visualization:

react-native-gifted-charts for financial data visualization.

@expo/vector-icons for iconography.

Utilities:

date-fns for date manipulation.

expo-image-picker for handling receipt uploads.

📂 Project Structure
Bash

truecost-mobile/
├── app/                 # Expo Router pages and layouts
├── components/          # Reusable UI components
├── constants/           # App-wide constants (Colors, Theme)
├── db/                  # Database configuration
│   ├── schema.ts        # Drizzle ORM schema definitions
│   └── client.ts        # Database connection setup
├── assets/              # Static assets (images, fonts)
└── package.json         # Project dependencies and scripts
🏁 Getting Started
Prerequisites
Node.js (LTS recommended)

Expo Go app on your physical device OR an Android Emulator / iOS Simulator.

Installation
Clone the repository:

Bash

git clone https://github.com/your-username/truecost-mobile.git
cd truecost-mobile
Install dependencies:

Bash

npm install
Start the development server:

Bash

npx expo start
Running the App
After running the start command, you can interact with the app via:

Mobile Device: Scan the QR code in your terminal using the Expo Go app (Android) or Camera app (iOS).

Emulators: Press a for Android or i for iOS simulator (requires setup).

Web: Press w to run in the browser.

💾 Database Schema
The application uses Drizzle ORM to manage the SQLite database. Key entities include:

users: Core user identity (supports local-only usage).

budget_profiles: Stores income frequency, rates, and financial health targets.

expenses: Individual transaction records linked to users.

subscriptions: Recurring costs with billing cycle logic.

loan_scenarios: Complex financial modeling for loans and debt repayment.

🤝 Contributing
Contributions are welcome! Please follow these steps:

Fork the project.

Create your feature branch (git checkout -b feature/AmazingFeature).

Commit your changes (git commit -m 'Add some AmazingFeature').

Push to the branch (git push origin feature/AmazingFeature).

Open a Pull Request.

📄 License
Distributed under the MIT License. See LICENSE for more information.
