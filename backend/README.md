# I Thought of You - Backend API

Express.js backend with Supabase database for the "I Thought of You" app.

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create a `.env` file in the root directory:
```bash
cp env.example .env
```

Fill in your Supabase credentials:
```
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET=your_jwt_secret_key_here
PORT=3000
NODE_ENV=development
```

### 3. Database Setup
1. Create a new Supabase project
2. Run the SQL schema from `database/schema.sql` in your Supabase SQL editor
3. Get your project URL and API keys from the Supabase dashboard

### 4. Start the Server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Endpoints

### Authentication

#### POST `/api/auth/register`
Register a new user.
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

#### POST `/api/auth/login`
Login user.
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### GET `/api/auth/profile`
Get current user profile (requires authentication).

### Thoughts

#### GET `/api/thoughts`
Get all thoughts for current user (received and sent).

#### POST `/api/thoughts`
Create a new thought.
```json
{
  "recipientEmail": "friend@example.com",
  "text": "I thought of you today!",
  "imageUrl": "https://example.com/image.jpg" // optional
}
```

#### GET `/api/thoughts/pinned`
Get pinned thoughts for current user.

#### POST `/api/thoughts/pin/:thoughtId`
Pin a thought.

#### DELETE `/api/thoughts/pin/:thoughtId`
Unpin a thought.

### Friends

#### GET `/api/friends`
Get all users (potential friends).

#### GET `/api/friends/:friendId`
Get friend profile with thoughts from that friend.

## Database Schema

### Users Table
- `id` (UUID, Primary Key)
- `email` (VARCHAR, Unique)
- `password` (VARCHAR, Hashed)
- `name` (VARCHAR)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Thoughts Table
- `id` (UUID, Primary Key)
- `sender_id` (UUID, Foreign Key to users)
- `recipient_id` (UUID, Foreign Key to users)
- `text` (TEXT)
- `image_url` (TEXT, Optional)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Pinned Thoughts Table
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key to users)
- `thought_id` (UUID, Foreign Key to thoughts)
- `created_at` (TIMESTAMP)

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Row Level Security (RLS) in Supabase
- CORS enabled
- Input validation
- Error handling

## Development

The server runs on port 3000 by default. You can change this by setting the `PORT` environment variable.

### Health Check
Visit `http://localhost:3000/health` to check if the server is running. 