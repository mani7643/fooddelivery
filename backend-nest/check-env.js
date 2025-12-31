require('dotenv').config();
console.log('MONGO_URI:', process.env.MONGO_URI ? 'Present' : 'Missing');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Present' : 'Missing');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Present' : 'Missing');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL ? 'Present' : 'Missing');
console.log('PORT:', process.env.PORT);
