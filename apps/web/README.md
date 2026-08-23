# Fidechat v2 Frontend

A modern cross-platform chat client built with Next.js 15, React 19 and TypeScript, designed for Discord-like real-time communication.

## Features

- 🚀 **Modern Framework**: Built with Next.js 15 and React 19
- 💬 **Real-Time Chat**: Instant communication using Socket.IO
- 🔐 **Secure Authentication**: Keycloak integration using NextAuth.js
- 📱 **Responsive Design**: Adaptive interface for desktop
- 🎨 **Modern UI**: Elegant components with Radix UI and Tailwind CSS

## Core Features

### 🏠 Servers and Channels

- Create and manage servers (guilds)
- Organize conversations in channels
- Discover public servers
- Member and role system

### 💬 Messaging System

- Real-time message sending
- Emoji support with emoji-mart
- Message editing and deletion
- Live typing indicators

### 👥 User Management

- Customizable user profiles
- Activity status (online, idle, etc.)
- Federated authentication with Keycloak

### 🎨 User Interface

- Server and channel sidebar
- Members panel
- Content creation modals
- Adaptive design with resizable panels

## Tech Stack

### Frontend Core

- **Next.js 15**: React framework with App Router
- **React 19**: UI library with latest features
- **TypeScript**: Static typing for enhanced robustness

### Communication

- **Socket.IO Client**: Real-time communication
- **Axios**: HTTP client with interceptors
- **TanStack Query**: Server state management

### Authentication

- **NextAuth.js**: Authentication and authorization
- **Keycloak**: Federated identity provider

### UI/UX

- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Accessible primitive components
- **Framer Motion**: Smooth animations
- **Lucide React**: Modern iconography

### Development

- **ESLint**: Code linting
- **Prettier**: Code formatting
- **pnpm**: Efficient package manager

## System Requirements

### External Dependencies Required

This project requires the following services to function properly:

#### 🔧 REST API Backend

The frontend communicates with a [REST API](https://github.com/Datzu712/Fidechat-backend) that must be running at:

- **Base URL**: Configured via `NEXT_PUBLIC_REST_API_URL`
- **Version**: API v1 (`/api/v1`)
- **Authentication**: Bearer tokens via Keycloak

#### 🔌 WebSocket Server

For real-time communication:

- **URL**: Configured via `NEXT_PUBLIC_SOCKET_URL`
- **Protocol**: Socket.IO with JWT authentication

#### 🔐 Keycloak Server

For authentication and authorization:

- **Issuer URL**: Configured via `KEYCLOAK_ISSUER`
- **Client ID/Secret**: Configured in environment variables
- **Flow**: Authorization Code with PKCE

### Base Technologies

- **Node.js**: 22.0.0 or higher
- **pnpm**: 8.0.0 or higher (recommended)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Datzu712/fidechat-web
cd fidechat-frontend
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-here

# Keycloak Configuration
KEYCLOAK_CLIENT_ID=your-keycloak-client-id
KEYCLOAK_CLIENT_SECRET=your-keycloak-client-secret
KEYCLOAK_ISSUER=https://your-keycloak-server/realms/your-realm

# Backend Services
NEXT_PUBLIC_REST_API_URL=http://localhost:8080
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

**Note**: Make sure all backend services are configured and running before starting the frontend.

### 4. Start the Development Server

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`.

## Available Scripts

```bash
# Development with Turbo
pnpm dev

# Production build
pnpm build

# Start production server
pnpm start
```

## Development Configuration

### Local Authentication

For local development, ensure that:

1. Keycloak is configured with the appropriate client
2. Redirect URLs include `http://localhost:3000`
3. CORS is enabled in the backend

### Hot Reload

The project uses Turbo for ultra-fast hot reload during development.

## Deployment

### Production Environment Variables

Make sure to configure all necessary environment variables on your deployment platform.

### Optimized Build

```bash
pnpm build
pnpm start
```
