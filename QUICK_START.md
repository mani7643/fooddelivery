# Quick Start Guide - Driver Dashboard

## Access the Application

1. **Open Browser**: Navigate to http://localhost:5173

2. **Register as Driver**:
   - Click "Sign up" if you're on the login page
   - Select "🏍️ Driver" role
   - Fill in the form:
     ```
     Name: Test Driver
     Email: driver@test.com
     Phone: +1234567890
     Password: driver123
     Vehicle Type: bike
     Vehicle Number: TEST-123
     License Number: DL123456
     ```
   - Click "Create Account"

3. **You'll be redirected to**: http://localhost:5173/driver

## Driver Dashboard Features

### Main Dashboard (`/driver`)
- **Availability Toggle**: Click "Go Online" to start receiving orders
- **Stats Cards**: View earnings, deliveries, rating, total earnings
- **Active Deliveries**: See current delivery requests

### Orders Page (`/driver/orders`)
- View all your delivery orders
- Filter by: All, Active, Completed
- Update order status

### Earnings Page (`/driver/earnings`)
- Today's earnings summary
- Total earnings
- Transaction history

### Profile Page (`/driver/profile`)
- View/edit vehicle information
- Update license details
- See your rating

## Alternative: Login with Existing Account

If you already registered:
- Email: driver@test.com
- Password: driver123

## Testing Tips

1. **To see orders**: You'll need to create test orders or have a restaurant accept orders
2. **Toggle Availability**: Click the "Go Online" button to mark yourself as available
3. **Real-time Updates**: Orders will appear automatically when created

## Troubleshooting

- **Can't access?** Make sure both servers are running:
  - Backend: http://localhost:5000 (should show API info)
  - Frontend: http://localhost:5173 (should show the app)

- **MongoDB Error?** Ensure MongoDB is running locally or update the connection string in `backend/.env`

- **Port Already in Use?** Check if another app is using ports 5000 or 5173

---

**Note**: The dashboard will be empty initially. Go online to start receiving delivery requests!
