const mongoose = require('mongoose');

const emailSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  timestamp: { type: Date, required: true },
  profile: {
    name: { type: String, required: true },
    location: { type: String, required: true },
    farmSize: { type: String, required: true },
    crops: { type: String, required: true },
    organic: { type: String, required: true },
    selling: { type: String, required: true },
    challenges: { type: String, required: true },
    contact: { type: String, required: true }
  },
  type: { type: String, required: true }
});

const Email = mongoose.model('Email', emailSchema);

module.exports = Email;
