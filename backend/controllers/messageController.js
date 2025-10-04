const Message = require('../models/Message');
const Listing = require('../models/Listing');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { ErrorResponse } = require('../middleware/errorHandler');
const { sendEmail, getNewMessageEmailTemplate } = require('../utils/sendEmail');

// @desc    Get all conversations for user
// @route   GET /api/messages/conversations
// @access  Private
exports.getConversations = async (req, res, next) => {
    try {
        const userId = req.user.id;

        // Get all unique conversations
        const conversations = await Message.aggregate([
            {
                $match: {
                    $or: [
                        { sender: mongoose.Types.ObjectId(userId) },
                        { recipient: mongoose.Types.ObjectId(userId) }
                    ]
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $group: {
                    _id: '$conversationId',
                    lastMessage: { $first: '$$ROOT' },
                    unreadCount: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ['$recipient', mongoose.Types.ObjectId(userId)] },
                                        { $eq: ['$isRead', false] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'lastMessage.sender',
                    foreignField: '_id',
                    as: 'sender'
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'lastMessage.recipient',
                    foreignField: '_id',
                    as: 'recipient'
                }
            },
            {
                $lookup: {
                    from: 'listings',
                    localField: 'lastMessage.listing',
                    foreignField: '_id',
                    as: 'listing'
                }
            },
            {
                $unwind: '$sender'
            },
            {
                $unwind: '$recipient'
            },
            {
                $unwind: '$listing'
            },
            {
                $project: {
                    conversationId: '$_id',
                    lastMessage: {
                        messageText: '$lastMessage.messageText',
                        createdAt: '$lastMessage.createdAt',
                        isRead: '$lastMessage.isRead'
                    },
                    unreadCount: 1,
                    listing: {
                        _id: '$listing._id',
                        title: '$listing.title',
                        images: '$listing.images',
                        price: '$listing.price',
                        status: '$listing.status'
                    },
                    otherUser: {
                        $cond: [
                            { $eq: ['$sender._id', mongoose.Types.ObjectId(userId)] },
                            {
                                _id: '$recipient._id',
                                firstName: '$recipient.firstName',
                                lastName: '$recipient.lastName',
                                profileImageUrl: '$recipient.profileImageUrl',
                                reputationScore: '$recipient.reputationScore'
                            },
                            {
                                _id: '$sender._id',
                                firstName: '$sender.firstName',
                                lastName: '$sender.lastName',
                                profileImageUrl: '$sender.profileImageUrl',
                                reputationScore: '$sender.reputationScore'
                            }
                        ]
                    }
                }
            },
            {
                $sort: { 'lastMessage.createdAt': -1 }
            }
        ]);

        res.status(200).json({
            success: true,
            count: conversations.length,
            data: conversations
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get messages in a conversation
// @route   GET /api/messages/:conversationId
// @access  Private
exports.getMessages = async (req, res, next) => {
    try {
        const { conversationId } = req.params;
        const { page = 1, limit = 50 } = req.query;

        // Verify user is part of this conversation
        const firstMessage = await Message.findOne({ conversationId });
        
        if (!firstMessage) {
            return next(new ErrorResponse('Conversation not found', 404));
        }

        const isParticipant = 
            firstMessage.sender.toString() === req.user.id ||
            firstMessage.recipient.toString() === req.user.id;

        if (!isParticipant) {
            return next(new ErrorResponse('Not authorized to view this conversation', 403));
        }

        // Get messages with pagination
        const skip = (Number(page) - 1) * Number(limit);

        const messages = await Message.find({ conversationId })
            .populate('sender', 'firstName lastName profileImageUrl')
            .populate('recipient', 'firstName lastName profileImageUrl')
            .populate('listing', 'title images price status')
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .skip(skip);

        const total = await Message.countDocuments({ conversationId });

        // Mark messages as read
        await Message.updateMany(
            {
                conversationId,
                recipient: req.user.id,
                isRead: false
            },
            {
                isRead: true,
                readAt: new Date()
            }
        );

        res.status(200).json({
            success: true,
            count: messages.length,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            },
            data: messages.reverse() // Reverse to show oldest first
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Send message
// @route   POST /api/messages
// @access  Private
exports.sendMessage = async (req, res, next) => {
    try {
        const { recipientId, listingId, messageText } = req.body;

        // Verify listing exists
        const listing = await Listing.findById(listingId);
        if (!listing) {
            return next(new ErrorResponse('Listing not found', 404));
        }

        // Verify recipient exists
        const recipient = await User.findById(recipientId);
        if (!recipient) {
            return next(new ErrorResponse('Recipient not found', 404));
        }

        // Don't allow messaging yourself
        if (recipientId === req.user.id) {
            return next(new ErrorResponse('Cannot send message to yourself', 400));
        }

        // Generate conversation ID
        const conversationId = Message.generateConversationId(
            req.user.id,
            recipientId,
            listingId
        );

        // Create message
        const message = await Message.create({
            conversationId,
            sender: req.user.id,
            recipient: recipientId,
            listing: listingId,
            messageText
        });

        // Populate message
        await message.populate([
            { path: 'sender', select: 'firstName lastName profileImageUrl' },
            { path: 'recipient', select: 'firstName lastName profileImageUrl' },
            { path: 'listing', select: 'title images price' }
        ]);

        // Create notification for recipient
        await Notification.createNotification({
            user: recipientId,
            type: 'new_message',
            title: 'New Message',
            message: `${req.user.firstName} sent you a message about "${listing.title}"`,
            relatedListing: listingId,
            relatedUser: req.user.id,
            actionUrl: `/messages/${conversationId}`
        });

        // Send email notification (optional - can be async)
        const messagePreview = messageText.length > 100 
            ? messageText.substring(0, 100) + '...' 
            : messageText;

        sendEmail({
            email: recipient.email,
            subject: 'New Message on Campus Recycle',
            html: getNewMessageEmailTemplate(
                `${req.user.firstName} ${req.user.lastName}`,
                listing.title,
                messagePreview
            )
        }).catch(err => console.error('Email notification error:', err));

        res.status(201).json({
            success: true,
            data: message
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get unread message count
// @route   GET /api/messages/unread/count
// @access  Private
exports.getUnreadCount = async (req, res, next) => {
    try {
        const count = await Message.getUnreadCount(req.user.id);

        res.status(200).json({
            success: true,
            data: { count }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Mark conversation as read
// @route   PUT /api/messages/:conversationId/read
// @access  Private
exports.markConversationAsRead = async (req, res, next) => {
    try {
        const { conversationId } = req.params;

        const result = await Message.updateMany(
            {
                conversationId,
                recipient: req.user.id,
                isRead: false
            },
            {
                isRead: true,
                readAt: new Date()
            }
        );

        res.status(200).json({
            success: true,
            data: {
                modifiedCount: result.modifiedCount
            }
        });
    } catch (error) {
        next(error);
    }
};