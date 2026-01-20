# 🚀 EthioAI Tourism Platform API Documentation

## Overview

The EthioAI Tourism Platform provides a comprehensive REST API for managing tourism services, bookings, marketplace transactions, and cultural content. This API supports both web and mobile applications with features including tour management, booking systems, payment processing, AI-powered chat, and cultural content delivery.

### Base URL
```
Production: https://api.ethioai.com
Development: http://localhost:5000
```

### API Version
Current Version: `v1`

### Authentication
The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Quick Start

### 1. Authentication
```bash
# Register a new user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securePassword123"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securePassword123"
  }'
```

### 2. Get Tours
```bash
curl -X GET http://localhost:5000/api/tours \
  -H "Authorization: Bearer <your-token>"
```

## API Endpoints

### Authentication Endpoints

#### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
  "name": "string",
  "email": "string",
  "password": "string",
  "role": "USER" // Optional: USER, ADMIN, GUIDE, VENDOR
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "string",
      "email": "string",
      "role": "USER",
      "isEmailVerified": false
    },
    "tokens": {
      "accessToken": "jwt-token",
      "refreshToken": "refresh-token"
    }
  }
}
```

#### POST /api/auth/login
Authenticate user and get access tokens.

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "string",
      "email": "string",
      "role": "USER"
    },
    "tokens": {
      "accessToken": "jwt-token",
      "refreshToken": "refresh-token"
    }
  }
}
```

#### POST /api/auth/refresh
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "string"
}
```

#### POST /api/auth/logout
Logout user and invalidate tokens.

#### POST /api/auth/forgot-password
Request password reset email.

**Request Body:**
```json
{
  "email": "string"
}
```

#### POST /api/auth/reset-password
Reset password using reset token.

**Request Body:**
```json
{
  "token": "string",
  "newPassword": "string"
}
```

### Tour Management Endpoints

#### GET /api/tours
Get list of tours with filtering and pagination.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `category` (string): Filter by category
- `difficulty` (string): Filter by difficulty (Easy, Moderate, Challenging)
- `minPrice` (number): Minimum price filter
- `maxPrice` (number): Maximum price filter
- `featured` (boolean): Filter featured tours
- `search` (string): Search in title and description

**Response:**
```json
{
  "success": true,
  "data": {
    "tours": [
      {
        "id": "uuid",
        "title": "string",
        "slug": "string",
        "description": "string",
        "shortDescription": "string",
        "images": ["url1", "url2"],
        "price": 299.99,
        "discountPrice": 249.99,
        "duration": 7,
        "maxGroupSize": 12,
        "difficulty": "Moderate",
        "status": "PUBLISHED",
        "featured": true,
        "startLocation": {
          "name": "Addis Ababa",
          "coordinates": [9.0320, 38.7469],
          "address": "Bole International Airport"
        },
        "category": "Cultural",
        "language": "en",
        "createdAt": "2024-01-01T00:00:00Z",
        "guide": {
          "id": "uuid",
          "user": {
            "name": "Guide Name",
            "avatar": "url"
          },
          "rating": 4.8,
          "totalReviews": 156
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "pages": 5
    }
  }
}
```

#### GET /api/tours/:id
Get detailed tour information.

**Response:**
```json
{
  "success": true,
  "data": {
    "tour": {
      "id": "uuid",
      "title": "string",
      "slug": "string",
      "description": "string",
      "shortDescription": "string",
      "images": ["url1", "url2"],
      "price": 299.99,
      "discountPrice": 249.99,
      "duration": 7,
      "maxGroupSize": 12,
      "difficulty": "Moderate",
      "status": "PUBLISHED",
      "featured": true,
      "startLocation": {
        "name": "Addis Ababa",
        "coordinates": [9.0320, 38.7469],
        "address": "Bole International Airport"
      },
      "locations": [
        {
          "name": "Lalibela",
          "coordinates": [12.0317, 39.0473],
          "description": "Rock-hewn churches"
        }
      ],
      "included": [
        "Accommodation",
        "Meals",
        "Transportation",
        "Guide services"
      ],
      "excluded": [
        "International flights",
        "Personal expenses",
        "Tips"
      ],
      "itinerary": [
        {
          "day": 1,
          "title": "Arrival in Addis Ababa",
          "description": "Airport pickup and city tour",
          "activities": ["City tour", "Welcome dinner"],
          "accommodation": "Hotel name",
          "meals": ["Dinner"]
        }
      ],
      "tags": ["Cultural", "Historical", "UNESCO"],
      "category": "Cultural",
      "language": "en",
      "guide": {
        "id": "uuid",
        "user": {
          "name": "Guide Name",
          "avatar": "url",
          "bio": "Experienced guide..."
        },
        "experience": 10,
        "languages": ["English", "Amharic"],
        "specialties": ["Cultural tours", "Historical sites"],
        "rating": 4.8,
        "totalReviews": 156,
        "isVerified": true
      },
      "reviews": {
        "average": 4.7,
        "total": 89,
        "distribution": {
          "5": 45,
          "4": 30,
          "3": 10,
          "2": 3,
          "1": 1
        }
      }
    }
  }
}
```

#### POST /api/tours
Create a new tour (Guide/Admin only).

**Request Body:**
```json
{
  "title": "string",
  "description": "string",
  "shortDescription": "string",
  "images": ["url1", "url2"],
  "price": 299.99,
  "discountPrice": 249.99,
  "duration": 7,
  "maxGroupSize": 12,
  "difficulty": "Moderate",
  "startLocation": {
    "name": "Addis Ababa",
    "coordinates": [9.0320, 38.7469],
    "address": "Bole International Airport"
  },
  "locations": [
    {
      "name": "Lalibela",
      "coordinates": [12.0317, 39.0473],
      "description": "Rock-hewn churches"
    }
  ],
  "included": ["Accommodation", "Meals"],
  "excluded": ["International flights"],
  "itinerary": [
    {
      "day": 1,
      "title": "Arrival",
      "description": "Airport pickup",
      "activities": ["City tour"],
      "accommodation": "Hotel name",
      "meals": ["Dinner"]
    }
  ],
  "tags": ["Cultural", "Historical"],
  "category": "Cultural"
}
```

#### PUT /api/tours/:id
Update tour information (Guide/Admin only).

#### DELETE /api/tours/:id
Delete a tour (Guide/Admin only).

### Booking Endpoints

#### GET /api/bookings
Get user's bookings.

**Query Parameters:**
- `status` (string): Filter by booking status
- `page` (number): Page number
- `limit` (number): Items per page

**Response:**
```json
{
  "success": true,
  "data": {
    "bookings": [
      {
        "id": "uuid",
        "bookingNumber": "BK-2024-001",
        "tour": {
          "id": "uuid",
          "title": "Tour Title",
          "images": ["url"],
          "duration": 7
        },
        "startDate": "2024-06-01T00:00:00Z",
        "endDate": "2024-06-08T00:00:00Z",
        "adults": 2,
        "children": 1,
        "totalPrice": 899.97,
        "status": "CONFIRMED",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "pages": 1
    }
  }
}
```

#### GET /api/bookings/:id
Get detailed booking information.

#### POST /api/bookings
Create a new booking.

**Request Body:**
```json
{
  "tourId": "uuid",
  "startDate": "2024-06-01T00:00:00Z",
  "adults": 2,
  "children": 1,
  "participants": [
    {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "dateOfBirth": "1990-01-01",
      "passportNumber": "A12345678",
      "nationality": "US"
    }
  ],
  "specialRequests": "Vegetarian meals",
  "promoCode": "SAVE10"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "booking": {
      "id": "uuid",
      "bookingNumber": "BK-2024-001",
      "tourId": "uuid",
      "startDate": "2024-06-01T00:00:00Z",
      "endDate": "2024-06-08T00:00:00Z",
      "adults": 2,
      "children": 1,
      "totalPrice": 899.97,
      "discountAmount": 89.99,
      "status": "PENDING",
      "participants": [...],
      "specialRequests": "Vegetarian meals"
    }
  }
}
```

#### PUT /api/bookings/:id/cancel
Cancel a booking.

### Payment Endpoints

#### POST /api/payments/create-intent
Create payment intent for booking.

**Request Body:**
```json
{
  "bookingId": "uuid",
  "paymentMethod": "STRIPE" // STRIPE, CHAPA, TELEBIRR, CBE_BIRR
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "clientSecret": "pi_xxx_secret_xxx",
    "paymentId": "uuid",
    "amount": 89997, // Amount in cents
    "currency": "USD"
  }
}
```

#### POST /api/payments/confirm
Confirm payment completion.

**Request Body:**
```json
{
  "paymentId": "uuid",
  "paymentIntentId": "pi_xxx"
}
```

#### GET /api/payments
Get user's payment history.

#### POST /api/payments/webhook
Webhook endpoint for payment providers (Stripe, Chapa).

### Marketplace Endpoints

#### GET /api/marketplace/products
Get marketplace products.

**Query Parameters:**
- `category` (string): Filter by category
- `vendor` (string): Filter by vendor
- `minPrice` (number): Minimum price
- `maxPrice` (number): Maximum price
- `search` (string): Search query
- `page` (number): Page number
- `limit` (number): Items per page

#### GET /api/marketplace/products/:id
Get product details.

#### POST /api/marketplace/products
Create new product (Vendor only).

#### GET /api/marketplace/categories
Get product categories.

#### POST /api/marketplace/orders
Create new order.

#### GET /api/marketplace/orders
Get user's orders.

### Chat Endpoints

#### POST /api/chat/message
Send message to AI assistant.

**Request Body:**
```json
{
  "message": "I want to visit Lalibela",
  "language": "en"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "Lalibela is famous for its rock-hewn churches...",
    "recommendations": [
      {
        "type": "tour",
        "id": "uuid",
        "title": "Lalibela Churches Tour",
        "price": 299.99
      }
    ],
    "messageId": "uuid"
  }
}
```

#### GET /api/chat/history
Get chat message history.

### Cultural Content Endpoints

#### GET /api/cultural/content
Get cultural content (articles, recipes, artifacts).

**Query Parameters:**
- `type` (string): Content type (article, recipe, artifact)
- `category` (string): Content category
- `language` (string): Content language
- `featured` (boolean): Featured content only

#### GET /api/cultural/content/:slug
Get specific cultural content by slug.

### Review Endpoints

#### GET /api/reviews
Get reviews for tours or products.

**Query Parameters:**
- `tourId` (string): Filter by tour
- `productId` (string): Filter by product
- `rating` (number): Filter by rating

#### POST /api/reviews
Create new review.

**Request Body:**
```json
{
  "tourId": "uuid", // or productId
  "rating": 5,
  "title": "Amazing experience!",
  "comment": "The tour was incredible...",
  "images": ["url1", "url2"]
}
```

### Upload Endpoints

#### POST /api/upload/image
Upload image file.

**Request:**
- Content-Type: multipart/form-data
- Field name: `image`
- Supported formats: JPG, PNG, WebP
- Max size: 5MB

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://cloudinary.com/image-url",
    "publicId": "image-public-id"
  }
}
```

### Transport Endpoints

#### GET /api/transport/options
Get available transport options.

#### POST /api/transport/book
Book transport service.

### Itinerary Endpoints

#### GET /api/itineraries
Get user's itineraries.

#### POST /api/itineraries
Create new itinerary.

#### GET /api/itineraries/:id
Get itinerary details.

#### PUT /api/itineraries/:id
Update itinerary.

#### DELETE /api/itineraries/:id
Delete itinerary.

## Data Models

### User Model
```json
{
  "id": "uuid",
  "name": "string",
  "email": "string",
  "role": "USER|ADMIN|GUIDE|VENDOR",
  "isEmailVerified": "boolean",
  "avatar": "string|null",
  "phone": "string|null",
  "bio": "string|null",
  "location": "string|null",
  "dateOfBirth": "datetime|null",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

### Tour Model
```json
{
  "id": "uuid",
  "title": "string",
  "slug": "string",
  "description": "string",
  "shortDescription": "string|null",
  "images": ["string"],
  "price": "decimal",
  "discountPrice": "decimal|null",
  "duration": "number",
  "maxGroupSize": "number",
  "difficulty": "string",
  "status": "DRAFT|PUBLISHED|SUSPENDED|ARCHIVED",
  "featured": "boolean",
  "startLocation": {
    "name": "string",
    "coordinates": ["number", "number"],
    "address": "string"
  },
  "locations": [
    {
      "name": "string",
      "coordinates": ["number", "number"],
      "description": "string"
    }
  ],
  "included": ["string"],
  "excluded": ["string"],
  "itinerary": [
    {
      "day": "number",
      "title": "string",
      "description": "string",
      "activities": ["string"],
      "accommodation": "string",
      "meals": ["string"]
    }
  ],
  "tags": ["string"],
  "category": "string",
  "language": "string",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

### Booking Model
```json
{
  "id": "uuid",
  "bookingNumber": "string",
  "userId": "uuid",
  "tourId": "uuid",
  "startDate": "datetime",
  "endDate": "datetime",
  "adults": "number",
  "children": "number",
  "totalPrice": "decimal",
  "discountAmount": "decimal|null",
  "promoCode": "string|null",
  "status": "PENDING|CONFIRMED|CANCELLED|COMPLETED|REFUNDED",
  "notes": "string|null",
  "specialRequests": "string|null",
  "participants": [
    {
      "name": "string",
      "email": "string",
      "phone": "string",
      "dateOfBirth": "date",
      "passportNumber": "string",
      "nationality": "string"
    }
  ],
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

## Error Handling

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": "Additional error details",
    "field": "fieldName" // For validation errors
  }
}
```

### Common Error Codes
- `VALIDATION_ERROR` (400): Request validation failed
- `UNAUTHORIZED` (401): Authentication required
- `FORBIDDEN` (403): Insufficient permissions
- `NOT_FOUND` (404): Resource not found
- `CONFLICT` (409): Resource conflict (e.g., email already exists)
- `RATE_LIMIT_EXCEEDED` (429): Too many requests
- `INTERNAL_ERROR` (500): Server error
- `SERVICE_UNAVAILABLE` (503): Service temporarily unavailable

### Validation Errors
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      },
      {
        "field": "password",
        "message": "Password must be at least 8 characters"
      }
    ]
  }
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse:
- **General endpoints**: 100 requests per 15 minutes per IP
- **Authentication endpoints**: 5 requests per 15 minutes per IP
- **Upload endpoints**: 10 requests per 15 minutes per user

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Pagination

List endpoints support pagination with the following parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

Pagination response format:
```json
{
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "pages": 15,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## Webhooks

### Stripe Webhooks
Endpoint: `POST /api/payments/webhook/stripe`

Supported events:
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.dispute.created`

### Chapa Webhooks
Endpoint: `POST /api/payments/webhook/chapa`

Supported events:
- `charge.success`
- `charge.failed`

## SDKs and Libraries

### JavaScript/TypeScript
```bash
npm install @ethioai/tourism-sdk
```

```javascript
import { EthioAIClient } from '@ethioai/tourism-sdk';

const client = new EthioAIClient({
  apiKey: 'your-api-key',
  baseURL: 'https://api.ethioai.com'
});

// Get tours
const tours = await client.tours.list({
  category: 'Cultural',
  featured: true
});

// Create booking
const booking = await client.bookings.create({
  tourId: 'tour-uuid',
  startDate: '2024-06-01',
  adults: 2
});
```

### Python
```bash
pip install ethioai-tourism-sdk
```

```python
from ethioai_tourism import EthioAIClient

client = EthioAIClient(
    api_key='your-api-key',
    base_url='https://api.ethioai.com'
)

# Get tours
tours = client.tours.list(category='Cultural', featured=True)

# Create booking
booking = client.bookings.create(
    tour_id='tour-uuid',
    start_date='2024-06-01',
    adults=2
)
```

## Testing

### Test Environment
- Base URL: `https://api-staging.ethioai.com`
- Test API Key: Contact support for test credentials

### Test Data
The staging environment includes sample data:
- Test tours in various categories
- Sample user accounts
- Mock payment processing

### Postman Collection
Download our Postman collection: [EthioAI Tourism API.postman_collection.json](./postman/collection.json)

## Support

- **Documentation**: [https://docs.ethioai.com](https://docs.ethioai.com)
- **Support Email**: api-support@ethioai.com
- **Developer Portal**: [https://developers.ethioai.com](https://developers.ethioai.com)
- **Status Page**: [https://status.ethioai.com](https://status.ethioai.com)

## Changelog

### v1.2.0 (2024-01-15)
- Added marketplace endpoints
- Enhanced cultural content API
- Improved error handling

### v1.1.0 (2023-12-01)
- Added itinerary management
- Enhanced chat API with recommendations
- Added webhook support

### v1.0.0 (2023-10-01)
- Initial API release
- Core tour and booking functionality
- Authentication and payment processing