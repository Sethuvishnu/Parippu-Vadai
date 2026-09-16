const mongoose = require('mongoose');

const syncedConversationSchema = new mongoose.Schema({
  conversationId: { type: String, required: true, unique: true },
  status: { type: String, required: true }, // "saved" | "skipped"
  title: String,
  processedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SyncedConversation', syncedConversationSchema);