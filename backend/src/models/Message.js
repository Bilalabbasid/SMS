const mongoose = require('mongoose');

const AttachmentSchema = new mongoose.Schema({
  filename: String,
  url: String,
  contentType: String,
  size: Number
}, { _id: false });

const MessageSchema = new mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  conversationType: { type: String, enum: ['user', 'class', 'group'], required: true },
  conversationId: { type: mongoose.Schema.Types.ObjectId, required: true },
  text: { type: String },
  attachments: [AttachmentSchema],
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  meta: { type: Object },
  status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' }
}, { timestamps: true });

MessageSchema.index({ conversationType: 1, conversationId: 1, createdAt: -1 });

module.exports = mongoose.models.Message || mongoose.model('Message', MessageSchema);
