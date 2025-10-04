const express = require('express');
const router = express.Router();
const {
    getConversations,
    getMessages,
    sendMessage,
    getUnreadCount,
    markConversationAsRead
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');
const { validateMessage } = require('../middleware/validation');
const { messageLimiter } = require('../middleware/rateLimiter');

router.use(protect); // All message routes require authentication

router.get('/conversations', getConversations);
router.get('/unread/count', getUnreadCount);
router.get('/:conversationId', getMessages);
router.post('/', messageLimiter, validateMessage, sendMessage);
router.put('/:conversationId/read', markConversationAsRead);

module.exports = router;