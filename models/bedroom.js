const mongoose = require('mongoose');
// Define the schema for the bedroom model
const bedroomSchema = new mongoose.Schema({
    ownerId: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    bedroomName: { type: String, required: true },
    temperature: { 
        type: Number, 
        required: true, 
        min: 50, 
        max: 100 
        // Fahrenheit range for bedroom comfort
    },
    lightLevel: { 
        type: Number, 
        required: true, 
        min: 0, 
        max: 5,
        // 0: Inky Black, 1: Very Dim, 2: Dim, 3: Soft Light, 4: Bright, 5: Bright Sunlight
    },
    noiseLevel: { 
        type: Number, 
        required: true, 
        min: 0, 
        max: 5,
        // 0: Deathly Silent, 1: Very Quiet, 2: Quiet, 3: Moderate, 4: Loud, 5: City Street
    }
});
//example of a default bedroom for testing
// {
//     "ownerId": "6842f9acbb9088bafa6a338b",
//     "bedroomName": "Guest Bedroom",
//     "temperature": 72,
//     "lightLevel": 3,
//     "noiseLevel": 2
// }

const Bedroom = mongoose.model('Bedroom', bedroomSchema);
module.exports = Bedroom;
