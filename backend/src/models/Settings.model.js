const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    // Singleton pattern - only one settings document
    _id: {
        type: String,
        default: 'platform_settings'
    },
    
    // Platform UPI/Payment QR Code
    platformPaymentQR: {
        url: String,
        publicId: String, // Cloudinary public ID for deletion
        upiId: String,
        uploadedAt: Date,
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    
    // Commission settings (can be adjusted by admin)
    commission: {
        platformPercentage: {
            type: Number,
            default: 10,
            min: 0,
            max: 100
        },
        ownerPercentage: {
            type: Number,
            default: 90,
            min: 0,
            max: 100
        }
    },
    
    // Platform bank details (for receiving payments)
    bankDetails: {
        accountName: String,
        accountNumber: String,
        ifscCode: String,
        bankName: String,
        branch: String
    },
    
    // Other platform settings can be added here
    maintenanceMode: {
        type: Boolean,
        default: false
    },
    maintenanceMessage: String
    
}, {
    timestamps: true
});

// Static method to get or create settings
settingsSchema.statics.getSettings = async function() {
    let settings = await this.findById('platform_settings');
    
    if (!settings) {
        settings = await this.create({
            _id: 'platform_settings',
            commission: {
                platformPercentage: 10,
                ownerPercentage: 90
            }
        });
    }
    
    return settings;
};

// Static method to update platform QR
settingsSchema.statics.updatePlatformQR = async function(qrData, adminId) {
    let settings = await this.getSettings();
    
    settings.platformPaymentQR = {
        url: qrData.url,
        publicId: qrData.publicId,
        upiId: qrData.upiId,
        uploadedAt: new Date(),
        uploadedBy: adminId
    };
    
    return await settings.save();
};

// Static method to update commission rates
settingsSchema.statics.updateCommission = async function(platformPercentage, ownerPercentage) {
    if (platformPercentage + ownerPercentage !== 100) {
        throw new Error('Commission percentages must add up to 100');
    }
    
    let settings = await this.getSettings();
    
    settings.commission = {
        platformPercentage,
        ownerPercentage
    };
    
    return await settings.save();
};

const Settings = mongoose.model('Settings', settingsSchema);

module.exports = Settings;
