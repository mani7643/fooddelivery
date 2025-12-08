# Food Delivery Partner Platform

A comprehensive full-stack web application for food delivery partners, featuring both delivery driver and restaurant partner interfaces with real-time order management, GPS tracking, earnings analytics, and complete authentication system.

## 🚀 Features

### Driver Portal
- **Dashboard**: Real-time earnings, delivery stats, and availability toggle
- **Order Management**: Accept/reject deliveries, update order status
- **Earnings Tracking**: View daily and total earnings with transaction history
- **Profile Management**: Update vehicle and license information
- **Real-time Notifications**: Instant updates for new delivery requests

### Restaurant Portal
- **Dashboard**: Revenue analytics, order statistics, and operating status control
- **Order Management**: Accept/reject orders, track preparation status
- **Menu Management**: Add, edit, and delete menu items
- **Analytics**: View popular items, revenue trends, and performance metrics
- **Profile Management**: Update business information and cuisine types

## 🛠️ Technology Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Socket.io** for real-time communication
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Multer** for file uploads

### Frontend
- **React** 18 with Vite
- **React Router** for navigation
- **Axios** for API calls
- **Socket.io Client** for real-time updates
- **Modern CSS** with glassmorphism and animations

## 📦 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (copy from `.env.example`):
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/courier-platform
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

4. Start the server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## 🎯 Usage

### Getting Started

1. **Register an Account**
   - Visit `http://localhost:5173/register`
   - Choose your role (Driver or Restaurant)
   - Fill in the required information
   - Submit to create your account

2. **Login**
   - Visit `http://localhost:5173/login`
   - Enter your credentials
   - You'll be redirected to your role-specific dashboard

3. **Driver Workflow**
   - Toggle availability to start receiving orders
   - Accept delivery requests from the dashboard
   - Update order status as you pick up and deliver
   - Track your earnings in real-time

4. **Restaurant Workflow**
   - Set your restaurant as "Open" to receive orders
   - Add menu items to your catalog
   - Accept incoming orders and set preparation time
   - Update order status (preparing → ready for pickup)
   - View analytics and popular items

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Driver Routes
- `GET /api/driver/profile` - Get driver profile
- `PUT /api/driver/profile` - Update driver profile
- `PUT /api/driver/location` - Update location
- `PUT /api/driver/availability` - Toggle availability
- `GET /api/driver/orders` - Get all orders
- `GET /api/driver/orders/active` - Get active orders
- `PUT /api/driver/orders/:id/accept` - Accept order
- `PUT /api/driver/orders/:id/status` - Update order status
- `GET /api/driver/earnings` - Get earnings

### Restaurant Routes
- `GET /api/restaurant/profile` - Get restaurant profile
- `PUT /api/restaurant/profile` - Update restaurant profile
- `PUT /api/restaurant/operating-status` - Toggle operating status
- `GET /api/restaurant/menu` - Get menu items
- `POST /api/restaurant/menu` - Add menu item
- `PUT /api/restaurant/menu/:id` - Update menu item
- `DELETE /api/restaurant/menu/:id` - Delete menu item
- `GET /api/restaurant/orders` - Get all orders
- `GET /api/restaurant/orders/pending` - Get pending orders
- `PUT /api/restaurant/orders/:id/accept` - Accept order
- `PUT /api/restaurant/orders/:id/reject` - Reject order
- `PUT /api/restaurant/orders/:id/status` - Update order status
- `GET /api/restaurant/analytics` - Get analytics

### Order Routes
- `POST /api/orders` - Create order (for testing)
- `GET /api/orders` - Get all orders
- `GET /api/orders/:id` - Get order by ID

## 🎨 Design Features

- **Dark Theme**: Modern dark color scheme with vibrant accents
- **Glassmorphism**: Beautiful frosted glass effects
- **Smooth Animations**: Fade, slide, and pulse animations
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Real-time Updates**: Live order notifications via Socket.io
- **Intuitive UI**: Clean, user-friendly interface

## 🔒 Security

- JWT-based authentication
- Password hashing with bcryptjs
- Protected API routes
- Role-based access control
- CORS configuration

## 📝 Project Structure

```
courier.com/
├── backend/
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── middleware/      # Auth & upload middleware
│   ├── socket/          # Socket.io handlers
│   ├── uploads/         # File uploads
│   └── server.js        # Main server file
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── context/     # React context providers
│   │   ├── pages/       # Page components
│   │   │   ├── driver/  # Driver portal pages
│   │   │   └── restaurant/ # Restaurant portal pages
│   │   ├── services/    # API service layer
│   │   ├── App.jsx      # Main app component
│   │   ├── main.jsx     # Entry point
│   │   └── index.css    # Design system
│   └── index.html       # HTML template
└── README.md
```

## 🚧 Development

### Running in Development Mode

Backend:
```bash
cd backend
npm run dev
```

Frontend:
```bash
cd frontend
npm run dev
```

### Building for Production

Frontend:
```bash
cd frontend
npm run build
```

## 🤝 Contributing

This is a demonstration project. Feel free to fork and customize for your needs.

## 📄 License

ISC

## 👨‍💻 Author

Built with ❤️ for food delivery partners

---

**Note**: Make sure MongoDB is running before starting the backend server. You can use MongoDB Atlas for a cloud database or run MongoDB locally.
