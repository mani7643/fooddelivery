import mongoose from 'mongoose';

const driverSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    vehicleType: {
        type: String,
        enum: ['bike', 'scooter', 'car', 'bicycle'],
        required: [true, 'Vehicle type is required']
    },
    vehicleNumber: {
        type: String,
        required: [true, 'Vehicle number is required'],
        trim: true,
        uppercase: true,
        validate: {
            validator: function (v) {
                // Regex for Indian vehicle number: State (2 chars) + Dist (2 digits) + Series (0-3 chars) + Number (4 digits)
                // Removes all spaces before checking
                return /^[A-Z]{2}[0-9]{2}[A-Z]{0,3}[0-9]{4}$/.test(v.replace(/\s/g, ''));
            },
            message: props => `${props.value} is not a valid Indian vehicle number!`
        }
    },
    licenseNumber: {
        type: String,
        required: [true, 'License number is required'],
        trim: true,
        uppercase: true,
        validate: {
            validator: function (v) {
                // Regex for Indian Driving License: 15 alphanumeric characters (State Code + RTO + Year + Digits)
                // Removes spaces/dashes before checking
                return /^[A-Z]{2}[0-9]{13}$/.test(v.replace(/\s|-/g, ''));
            },
            message: props => `${props.value} is not a valid Indian Driving License number!`
        }
    },
    currentLocation: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            default: [0, 0]
        }
    },
    isAvailable: {
        type: Boolean,
        default: false
    },
    currentStatus: {
        type: String,
        enum: ['idle', 'active', 'onTrip'],
        default: 'idle'
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    totalDeliveries: {
        type: Number,
        default: 0
    },
    totalEarnings: {
        type: Number,
        default: 0
    },
    todayEarnings: {
        type: Number,
        default: 0
    },
    bankDetails: {
        accountHolderName: String,
        accountNumber: String,
        ifscCode: String,
        bankName: String
    },
    // Document URLs for verification
    documents: {
        aadhaarFront: String,
        aadhaarBack: String,
        dlFront: String,
        dlBack: String,
        panCard: String,
        vehicleRC: String
    },
    // Verification status
    verificationStatus: {
        type: String,
        enum: ['pending_documents', 'pending_verification', 'verified', 'rejected'],
        default: 'pending_documents'
    },
    verificationNotes: String,
    verifiedAt: Date,
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Create geospatial index for location-based queries
driverSchema.index({ currentLocation: '2dsphere' });

const Driver = mongoose.model('Driver', driverSchema);

export default Driver;
