# 🏠 Smart Rent Management System

A comprehensive property management application that streamlines rent collection, tenant communication, and property administration through intelligent automation and modern web technologies.

## ✨ Features

### 🏘️ **Multi-Property Management**
- **Address-Based Auto-Assignment**: Tenants are automatically assigned to landlords based on matching property addresses
- **Property Portfolio Dashboard**: Manage multiple properties with individual statistics and occupancy rates
- **Smart Property Creation**: Add properties with automatic tenant assignment to existing matching addresses
- **Property Analytics**: Track units, occupancy rates, and rental income per property

### 💰 **Payment Processing**
- **Dual Payment Gateway**: Integrated Stripe and PayPal checkout systems
- **Automated Balance Tracking**: Dynamic rent calculations with due dates and late fees
- **Payment History**: Comprehensive transaction records for both tenants and landlords
- **Real-Time Balance Updates**: Instant balance updates after successful payments

### 🛠️ **Maintenance Management**
- **Smart Priority Assignment**: Automatic priority classification based on request keywords
- **Interactive Request Dashboard**: Filter, sort, and manage repair requests efficiently
- **Status Tracking**: Real-time updates from submission to resolution
- **Tenant Communication**: Direct request submission and status monitoring

### 📊 **Advanced Analytics**
- **Financial Dashboard**: Revenue tracking, collection rates, and outstanding balances
- **Tenant Analytics**: Occupancy statistics, payment patterns, and tenant summaries
- **Interactive Charts**: Visual representation of financial data and trends
- **Performance Metrics**: Collection efficiency and property performance indicators

### 🔐 **Security & Authentication**
- **Role-Based Access**: Separate dashboards for landlords and tenants
- **Secure Authentication**: Passport.js with bcrypt password hashing
- **Session Management**: Persistent login sessions with MongoDB session store
- **Data Privacy**: Users only see their own properties and assigned tenants

## 🛠️ **Technology Stack**

### **Backend**
- **Node.js** with Express.js framework
- **MongoDB** with Mongoose ODM for data persistence
- **Passport.js** for authentication and session management
- **bcrypt** for secure password hashing

### **Frontend**
- **Vanilla JavaScript** with modern ES6+ features
- **Responsive CSS** with mobile-first design
- **Interactive UI** with real-time updates and animations
- **Progressive Enhancement** for optimal user experience

### **Payment Integration**
- **Stripe** for credit card processing with webhooks
- **PayPal** checkout SDK for alternative payment options
- **Webhook Security** with signature verification

### **Development Tools**
- **Terser** for JavaScript minification
- **cssnano** for CSS optimization
- **dotenv** for environment configuration

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js (v14 or higher)
- MongoDB database
- Stripe account (for payment processing)
- PayPal developer account (optional)

### **Installation**

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Moomz7/rent-app.git
   cd rent-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Create a `.env` file in the root directory:
   ```env
   MONGO_URI=mongodb://localhost:27017/rentapp
   SESSION_SECRET=your-super-secret-key-here
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
   PAYPAL_CLIENT_ID=your_paypal_client_id
   PAYPAL_CLIENT_SECRET=your_paypal_client_secret
   ```

4. **Start the application:**
   ```bash
   node server.js
   ```

5. **Access the application:**
   - Open your browser to `http://localhost:3000`
   - Sign up as a landlord or tenant
   - Start managing your properties!

## 📱 **User Guides**

### **For Landlords**
1. **Property Setup**: Add your properties with complete address information
2. **Tenant Management**: View automatically assigned tenants based on property addresses
3. **Payment Tracking**: Monitor rent collection and outstanding balances
4. **Maintenance Requests**: Review, prioritize, and resolve tenant repair requests
5. **Analytics**: Access financial reports and property performance metrics

### **For Tenants**
1. **Account Registration**: Sign up with your rental address for automatic landlord assignment
2. **Rent Payment**: Pay rent securely using Stripe or PayPal
3. **Balance Monitoring**: Track payment history and upcoming due dates
4. **Maintenance Requests**: Submit repair requests with automatic priority classification
5. **Account Management**: Update profile information and view payment history

## 🏗️ **Project Structure**

```
rent-app/
├── models/                 # MongoDB data models
│   ├── User.js            # User accounts (landlords/tenants)
│   ├── Property.js        # Property management
│   ├── Payment.js         # Payment records
│   └── RepairRequest.js   # Maintenance requests
├── routes/                # Express route handlers
│   ├── auth.js           # Authentication & registration
│   ├── landlord.js       # Landlord dashboard APIs
│   └── tenant.js         # Tenant portal APIs
├── public/               # Frontend assets
│   ├── scripts/         # JavaScript files
│   ├── styles/          # CSS stylesheets
│   └── *.html           # Frontend pages
├── server.js            # Main application server
└── package.json         # Project dependencies
```

## 🔌 **API Endpoints**

### **Authentication**
- `POST /signup` - User registration with auto-assignment
- `POST /login` - User authentication
- `GET /logout` - Session termination

### **Landlord APIs**
- `GET /api/properties` - Get landlord's properties with stats
- `POST /api/properties` - Create new property
- `GET /api/tenants/balances` - Get assigned tenants with balances
- `GET /api/payments` - Get payment history for assigned tenants
- `GET /api/repair-requests` - Get maintenance requests

### **Tenant APIs**
- `GET /api/balance` - Get current balance and due date
- `POST /api/payments` - Record manual payment
- `GET /api/payments` - Get personal payment history
- `POST /api/repair-requests` - Submit maintenance request

### **Payment Processing**
- `POST /create-checkout-session` - Stripe payment initiation
- `POST /webhook/stripe` - Stripe webhook handler
- `POST /api/paypal/create-order` - PayPal order creation

## 🌟 **Key Features Explained**

### **Intelligent Tenant Assignment**
The system automatically assigns tenants to landlords based on normalized address matching. When a landlord adds a property, existing tenants with matching addresses are automatically assigned, streamlining the onboarding process.

### **Dynamic Balance Calculation**
Rent balances are calculated in real-time based on lease start dates, monthly rent amounts, and payment history. The system automatically determines due dates and tracks outstanding balances.

### **Smart Priority System**
Maintenance requests are automatically prioritized based on keywords in the description. Emergency terms like "water leak" or "electrical" receive high priority, while routine maintenance gets standard priority.

### **Financial Analytics**
Comprehensive analytics track collection rates, revenue trends, and property performance. Landlords can view occupancy rates, payment patterns, and generate financial reports.

## 🔒 **Security Features**

- **Password Security**: Bcrypt hashing with salt rounds
- **Session Management**: Secure session storage with MongoDB
- **Role-Based Access**: Strict separation between landlord and tenant data
- **Payment Security**: Stripe/PayPal secure processing with webhook verification
- **Data Isolation**: Users can only access their own assigned data

## 🚀 **Deployment**

### **Production Setup**
1. Set up MongoDB Atlas or hosted MongoDB instance
2. Configure production environment variables
3. Set up Stripe webhooks for your domain
4. Deploy to your preferred hosting platform (Heroku, AWS, DigitalOcean)
5. Configure SSL certificates for secure payment processing

### **Environment Variables**
```env
# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/rentapp

# Security
SESSION_SECRET=production-secret-key-min-32-chars

# Stripe (Production Keys)
STRIPE_SECRET_KEY=sk_live_your_production_key
STRIPE_WEBHOOK_SECRET=whsec_your_production_webhook_secret

# PayPal (Production)
PAYPAL_CLIENT_ID=your_production_client_id
PAYPAL_CLIENT_SECRET=your_production_client_secret
```

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 📄 **License**

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🆘 **Support**

For support, please open an issue on GitHub or contact the development team.

## 🔮 **Future Enhancements**

- **Mobile Application**: React Native or Flutter mobile app
- **Document Management**: Lease upload and digital signing
- **Notification System**: Email/SMS alerts for payments and requests
- **Advanced Reporting**: PDF report generation and export
- **Multi-Language Support**: Internationalization for global use
- **API Integration**: Third-party property management tool connections

---

**Built with ❤️ for modern property management**