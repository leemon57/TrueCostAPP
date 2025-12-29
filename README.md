# TrueCost Mobile

TrueCost is a comprehensive personal finance and budgeting application built with **Expo** and **React Native**. It helps users track expenses, manage subscriptions, analyze budget profiles, and simulate loan scenarios using a **privacy-first, local-storage** approach.

## Overview

TrueCost is designed for users who want robust budgeting and forecasting features without sending personal financial data to external servers. The core functionality works **fully offline**, with data stored locally on-device.

---

## Features

### Comprehensive Budget Profiling
- Supports **Salaried** and **Hourly** income types
- Track **fixed** and **variable** expenses
- Set **savings targets** and **emergency fund** goals

### Expense Tracking
- Log daily expenses with detailed categorization
- Attach **receipt images** to expense entries
- Visualize spending habits and trends

### Subscription Management
- Track recurring payments and billing cycles (**Monthly / Yearly**)
- Monitor **active vs. inactive** subscriptions

### Loan Scenarios & Calculators
- Simulate different loan structures
- Compare **fixed annual rates** vs. **spread-over-policy rates**
- Configure principal, term length, and payment frequency

### Privacy-Focused Architecture
- **Local-first**: all user data stored on-device via **SQLite**
- No external server dependency for core functionality

---

## Tech Stack

- **Framework:** Expo (SDK 54), React Native  
- **Language:** TypeScript  
- **Database:** SQLite via `expo-sqlite`  
- **ORM:** Drizzle ORM  
- **Navigation:** Expo Router (file-based routing)

### UI / Visualization
- `react-native-gifted-charts` (financial charts and visualizations)
- `@expo/vector-icons` (icons)

### Utilities
- `date-fns` (date manipulation)
- `expo-image-picker` (receipt photo uploads)

---

## Project Structure

```text
truecost-mobile/
├── app/                 # Expo Router pages and layouts
├── components/          # Reusable UI components
├── constants/           # App-wide constants (Colors, Theme)
├── db/                  # Database configuration
│   ├── schema.ts        # Drizzle ORM schema definitions
│   └── client.ts        # Database connection setup
├── assets/              # Static assets (images, fonts)
└── package.json         # Project dependencies and scripts

