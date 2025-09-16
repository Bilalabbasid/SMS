const express = require('express');
const Message = require('../models/Message');
const User = require('../models/User');
const Class = require('../models/Class');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// POST /api/messages - create a message in a conversation
// body: { conversationType: 'user'|'class'|'group', conversationId, text, attachments }
router.post('/', authenticate, async (req, res) => {
  try {
    const { conversationType, conversationId, text, attachments, meta } = req.body;

    if (!conversationType || !conversationId) {
      return res.status(400).json({ success: false, message: 'conversationType and conversationId are required' });
    }

    if (!['user', 'class', 'group'].includes(conversationType)) {
      return res.status(400).json({ success: false, message: 'Invalid conversationType' });
    }

    // Validate targets for user/class
    if (conversationType === 'user') {
      const u = await User.findById(conversationId);
      if (!u) return res.status(404).json({ success: false, message: 'Recipient user not found' });
    }

    if (conversationType === 'class') {
      const c = await Class.findById(conversationId);
      if (!c) return res.status(404).json({ success: false, message: 'Target class not found' });
    }

    const msg = new Message({
      from: req.user.id,
      conversationType,
      conversationId,
      text: text || null,
      attachments: attachments || [],
      meta: meta || {}
    });

    await msg.save();

    const populated = await Message.findById(msg._id).populate('from', 'firstName lastName email');

    // Broadcast via Socket.IO to conversation room
    try {
      if (req.io) {
        const room = `${conversationType}:${conversationId}`;
        req.io.to(room).emit('message.new', populated);
      }
    } catch (socketErr) {
      console.warn('Socket broadcast failed', socketErr.message);
    }

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, message: 'Failed to send message', error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' });
  }
});

// GET /api/messages - list messages in a conversation or recent conversations
// query: conversationType, conversationId, page, limit
router.get('/', authenticate, async (req, res) => {
  try {
    const { conversationType, conversationId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 25, 200);
    const skip = (page - 1) * limit;

    if (!conversationType || !conversationId) {
      // Return recent messages involving user grouped by conversations (simple fallback)
      const recent = await Message.find({ $or: [{ conversationId: req.user.id }, { 'meta.participants': req.user.id }] })
        .sort({ createdAt: -1 })
        .limit(50)
        .populate('from', 'firstName lastName email');

      return res.status(200).json({ success: true, data: recent });
    }

    const filter = { conversationType, conversationId };

    const [messages, total] = await Promise.all([
      Message.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('from', 'firstName lastName email'),
      Message.countDocuments(filter)
    ]);

    res.status(200).json({ success: true, data: { messages, pagination: { page, limit, total } } });
  } catch (error) {
    console.error('List messages error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch messages', error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' });
  }
});

// POST /api/messages/mark-read - mark messages as read for the user in a conversation
router.post('/mark-read', authenticate, async (req, res) => {
  try {
    const { conversationType, conversationId } = req.body;
    if (!conversationType || !conversationId) {
      return res.status(400).json({ success: false, message: 'conversationType and conversationId required' });
    }

    await Message.updateMany({ conversationType, conversationId, readBy: { $ne: req.user.id } }, { $push: { readBy: req.user.id }, $set: { status: 'read' } });

    // Optionally broadcast read receipts
    if (req.io) {
      req.io.to(`${conversationType}:${conversationId}`).emit('message.read', { conversationType, conversationId, userId: req.user.id });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark messages read', error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' });
  }
});

module.exports = router;
