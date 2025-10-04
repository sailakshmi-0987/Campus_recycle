Campus Recycle Backend API

Backend for Campus Recycle, a marketplace for students to buy and sell items within their university community.

Table of Contents

Overview

Features

Tech Stack

Installation

Environment Variables

API Endpoints

Authentication & Authorization

Rate Limiting

Error Handling

Database Schema

License

Overview

This backend provides RESTful APIs for a student marketplace, supporting user registration, listings, messaging, reviews, notifications, and university-based filtering.

Key capabilities:

User authentication with JWT

University-specific registration

Listing creation and management

Messaging system with notifications

Review and reputation system

File uploads via Cloudinary

Rate limiting and input validation

Features

User Management: Registration, login, profile update, email verification

Listings: CRUD operations, image upload, search, filtering, pagination

Messaging: Conversations, unread counts, notifications, email alerts

Reviews: Transaction-based reviews, ratings, reputation updates

Notifications: In-app notifications for messages, listings, reviews

Security: JWT authentication, route protection, input validation

Rate Limiting: Prevent abuse for login, listing creation, messaging, and uploads

Error Handling: Centralized error response with proper HTTP codes

Tech Stack

Server: Node.js, Express.js

Database: MongoDB, Mongoose

Authentication: JWT

File Uploads: Cloudinary

Validation: Express-validator

Rate Limiting: express-rate-limit

Email: Nodemailer or custom email utils

Installation

Clone the repository:

git clone https://github.com/yourusername/campus-recycle-backend.git
cd campus-recycle-backend


Install dependencies:

npm install


Setup environment variables (see below)

Start the server:

npm run dev


Server will run on http://localhost:5000 (or the port defined in .env)

Environment Variables

Create a .env file in the root:

PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
EMAIL_SERVICE=smtp_service
EMAIL_USER=email@example.com
EMAIL_PASS=email_password

API Endpoints
Auth

POST /api/auth/register – Register new user

POST /api/auth/login – User login

POST /api/auth/verify-email – Verify email

POST /api/auth/resend-verification – Resend verification code

POST /api/auth/logout – Logout

Users

GET /api/users/:id – Get user profile

PUT /api/users/:id – Update profile

POST /api/users/:id/profile-image – Upload profile image

GET /api/users/:id/listings – User’s listings

GET /api/users/:id/reviews – User’s reviews

Listings

GET /api/listings – Get listings with filters

GET /api/listings/:id – Get single listing

POST /api/listings – Create listing

PUT /api/listings/:id – Update listing

POST /api/listings/:id/images – Upload listing images

Messages

GET /api/messages/conversations – Get all conversations

GET /api/messages/:conversationId – Get messages in a conversation

POST /api/messages – Send a message

GET /api/messages/unread/count – Unread message count

PUT /api/messages/:conversationId/read – Mark conversation as read

Reviews

POST /api/reviews – Create review

Notifications

Notifications are created automatically for messages, listings, and reviews

Authentication & Authorization

JWT-based authentication for protected routes

Optional authentication for some public endpoints

Role and ownership checks for resources (e.g., listings, messages)

Rate Limiting

General API: 100 requests / 15 min

Auth routes: 5 attempts / 15 min (skip successful)

Create listings: 10 per hour

Send messages: 10 per minute

Uploads: 50 per hour

Error Handling

Centralized error handler returns consistent JSON:

{
  "success": false,
  "error": "Error message here"
}


Handles validation, JWT errors, duplicate keys, and resource not found

Database Schema Overview

User: Profile, university, email verification, reputation, listings count

University: Name, domain, statistics

Listing: Title, description, category, price, condition, seller, images

Message: Conversation ID, sender, recipient, listing, text, attachments

Review: Transaction, reviewer, reviewee, rating, categories

Notification: Type, message, related listing/user/transaction, read status

License

MIT License © Power House
