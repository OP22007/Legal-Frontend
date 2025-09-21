# LegalEase - AI-Powered Legal Document Analysis Platform

[![Next.js](https://img.shields.io/badge/Next.js-15.5.3-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.16.1-green)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-cyan)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-blue)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-black)](https://vercel.com/)

LegalEase is a comprehensive AI-powered platform that demystifies legal documents by providing clear, human-friendly summaries, risk assessments, and interactive analysis. Built with modern web technologies, it supports multiple languages and offers an intuitive chat interface for document-related queries.

## Features

### Core Functionality
- **Document Upload & Analysis**: Support for PDF, DOCX, and TXT files up to 20MB
- **AI-Powered Summaries**: ELI5 (Explain Like I'm 5) summaries in multiple languages
- **Risk Assessment**: Comprehensive risk analysis with severity levels (Low, Medium, High, Critical)
- **Interactive Chat**: AI-powered chat interface for document-specific questions
- **Multi-Language Support**: Translation capabilities for global users
- **Document Viewer**: Built-in PDF viewer with glossary highlighting

### Advanced Features
- **Key Points Extraction**: Automatic identification of critical clauses and terms
- **Glossary System**: Interactive legal term explanations
- **Risk Factor Analysis**: Detailed risk categorization and mitigation suggestions
- **Export Functionality**: Multiple export formats (PDF, DOCX, HTML, JSON)
- **User Personas**: Tailored analysis for different user types (Students, Freelancers, Tenants, etc.)
- **Analytics Dashboard**: Usage tracking and insights

### Security & Privacy
- **Bank-Level Encryption**: AES-256 encryption for all data
- **Secure Authentication**: NextAuth.js with multiple providers
- **Data Retention Control**: Configurable auto-deletion policies
- **Audit Logging**: Comprehensive activity tracking

##  Architecture

### Tech Stack

#### Frontend
- **Framework**: Next.js 15.5.3 with App Router
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 with Radix UI components
- **State Management**: Zustand
- **Animations**: Framer Motion
- **Forms**: React Hook Form with Zod validation
- **PDF Processing**: React-PDF with custom text rendering

#### Backend & Database
- **Database**: PostgreSQL (hosted on Supabase)
- **ORM**: Prisma 6.16.1 with custom client generation
- **Authentication**: NextAuth.js 4 with multiple providers
- **API**: Next.js API Routes with RESTful design
- **Email**: Nodemailer with Gmail SMTP

#### AI & External Services
- **AI Models**: Google Gemini Pro, OpenAI GPT models
- **Vector Search**: Pinecone for semantic search
- **Translation**: Google Translate API
- **File Storage**: Google Cloud Storage
- **Analytics**: Vercel Analytics

#### Development Tools
- **Linting**: Biome (fast, modern linter)
- **Code Formatting**: Biome formatter
- **Package Manager**: pnpm
- **Deployment**: Vercel with automatic deployments

### Database Schema

The platform uses a comprehensive PostgreSQL schema with the following main entities:

#### User Management
- **Users**: Authentication, profiles, preferences, and personas
- **Accounts/Sessions**: NextAuth.js required tables
- **Verification Tokens**: Email verification system

#### Document Processing
- **Documents**: File metadata, processing status, analysis results
- **Document Analysis**: AI-generated summaries and detailed analysis
- **Key Points**: Extracted important clauses and terms
- **Risk Factors**: Identified risks with severity and mitigation
- **Glossary Terms**: Legal terminology explanations

#### Communication
- **Chat Sessions**: Document-specific conversations
- **Chat Messages**: User-AI message history with metadata

#### Analytics & Audit
- **User Analytics**: Usage tracking and insights
- **Export History**: Document export tracking
- **Audit Logs**: System activity logging
- **System Config**: Dynamic configuration management

##  Getting Started

### Prerequisites

- **Node.js**: Version 18.17 or higher
- **pnpm**: Modern package manager (recommended)
- **PostgreSQL**: Database (Supabase recommended for easy setup)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/OP22007/Legal-Frontend.git
   cd Legal-Frontend
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Environment Setup**

   Copy the example environment file and configure your variables:
   ```bash
   cp .env.example .env
   ```

   Configure the following environment variables:

   ```env
   # Database
   POSTGRES_PRISMA_URL="your_supabase_connection_string"
   POSTGRES_URL_NON_POOLING="your_direct_postgres_url"

   # Authentication
   NEXTAUTH_SECRET="your_nextauth_secret"
   NEXTAUTH_URL="http://localhost:3000"
   GOOGLE_CLIENT_ID="your_google_oauth_client_id"
   GOOGLE_CLIENT_SECRET="your_google_oauth_client_secret"

   # External Services
   GOOGLE_API_KEY="your_google_ai_api_key"
   PINECONE_API_KEY="your_pinecone_api_key"
   PINECONE_ENVIRONMENT="us-east-1-aws"
   PINECONE_INDEX_NAME="your_index_name"

   # Email Configuration
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT="587"
   SMTP_USER="your_email@gmail.com"
   SMTP_PASS="your_app_password"

   # Backend API
   NEXT_PUBLIC_BACKEND_URL="https://your-backend-api.com"
   ```

4. **Database Setup**

   Generate Prisma client and run migrations:
   ```bash
   pnpm prisma generate
   pnpm prisma db push
   ```

   Optional: Seed the database with sample data:
   ```bash
   pnpm prisma db seed
   ```

5. **Development Server**

   Start the development server:
   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

##  Project Structure

```
Legal-Frontend/
├── prisma/
│   ├── schema.prisma          # Database schema definition
│   └── migrations/            # Database migration files
├── public/                    # Static assets
│   ├── lottie/               # Animation files
│   └── *.png                 # Images and icons
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── api/              # API routes
│   │   │   ├── auth/         # Authentication endpoints
│   │   │   ├── chat/         # Chat functionality
│   │   │   ├── documents/    # Document management
│   │   │   ├── translate/    # Translation services
│   │   │   └── upload/       # File upload handling
│   │   ├── analysis/         # Document analysis pages
│   │   ├── auth/             # Authentication pages
│   │   ├── chat/             # Chat interface
│   │   ├── dashboard/        # User dashboard
│   │   └── upload/           # File upload interface
│   ├── components/           # Reusable UI components
│   │   ├── ui/               # Radix UI components
│   │   └── *.tsx             # Custom components
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utility libraries
│   │   ├── auth.ts           # Authentication configuration
│   │   ├── db.ts             # Database client
│   │   ├── email.ts          # Email utilities
│   │   ├── pinecone.ts       # Vector search client
│   │   └── utils.ts          # General utilities
│   └── types/                # TypeScript type definitions
├── .env                      # Environment variables
├── biome.json               # Linting and formatting config
├── components.json          # shadcn/ui configuration
├── next.config.ts           # Next.js configuration
├── package.json             # Dependencies and scripts
├── tailwind.config.ts       # Tailwind CSS configuration
└── tsconfig.json            # TypeScript configuration
```

##  Configuration

### Next.js Configuration

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma']
  },
  api: {
    bodyParser: {
      sizeLimit: '25mb', // Large file upload support
    },
  },
};
```

### Database Configuration

The application uses Prisma with PostgreSQL. Key configuration includes:

- **Connection Pooling**: Supabase connection pooling for production
- **Custom Client Generation**: Optimized Prisma client in `/src/generated/prisma/`
- **Database Indexes**: Optimized indexes for performance
- **Foreign Key Constraints**: Proper referential integrity

### Authentication Setup

NextAuth.js is configured with multiple providers:

```typescript
// Supported providers: Google, GitHub, Email, Credentials
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    // Additional providers...
  ],
  database: process.env.POSTGRES_PRISMA_URL,
};
```

##  UI/UX Design

### Design System
- **Color Palette**: Indigo-based primary colors with dark mode support
- **Typography**: Manrope for headings, Inter for body text
- **Components**: Radix UI primitives with custom styling
- **Animations**: Framer Motion for smooth interactions
- **Responsive**: Mobile-first design with progressive enhancement

### Key UI Components
- **Document Viewer**: Custom PDF viewer with glossary highlighting
- **Chat Interface**: Real-time chat with AI document analysis
- **Risk Dashboard**: Interactive risk factor visualization
- **Upload Zone**: Drag-and-drop file upload with progress indicators
- **Analysis Reports**: Comprehensive document analysis displays

##  AI Integration

### Document Analysis Pipeline

1. **Text Extraction**: PDF/Word document parsing
2. **Content Analysis**: AI-powered clause identification
3. **Risk Assessment**: Automated risk scoring and categorization
4. **Summary Generation**: ELI5 summaries in multiple languages
5. **Glossary Creation**: Legal term extraction and explanation

### Supported AI Models

- **Primary**: Google Gemini Pro for document analysis
- **Fallback**: OpenAI GPT models for chat functionality
- **Translation**: Google Translate API for multi-language support
- **Vector Search**: Pinecone for semantic document search

### AI Features

- **Contextual Analysis**: Document-aware chat responses
- **Multi-language Support**: Real-time translation
- **Risk Intelligence**: Advanced risk pattern recognition
- **Legal Expertise**: Specialized legal document understanding

##  Security Features

### Data Protection
- **Encryption**: AES-256 encryption at rest and in transit
- **Access Control**: Role-based permissions (User, Admin, Moderator)
- **Data Retention**: Configurable auto-deletion policies
- **Audit Trails**: Comprehensive activity logging

### Authentication & Authorization
- **Multi-provider Auth**: Google, GitHub, Email, and credentials
- **Session Management**: Secure JWT-based sessions
- **Password Security**: bcrypt hashing with salt rounds
- **Email Verification**: Secure account verification flow

##  Analytics & Monitoring

### User Analytics
- **Usage Tracking**: Document uploads, analyses, chat interactions
- **Performance Metrics**: Response times, success rates
- **Feature Adoption**: User persona analysis
- **Retention Insights**: User engagement patterns

### System Monitoring
- **Error Tracking**: Comprehensive error logging
- **Performance Monitoring**: API response times and throughput
- **Database Metrics**: Query performance and connection pooling
- **Security Events**: Authentication and access attempt logging

##  Deployment

### Vercel Deployment

1. **Connect Repository**
   ```bash
   # Vercel CLI
   vercel --prod
   ```

2. **Environment Variables**
   Configure all production environment variables in Vercel dashboard

3. **Database Migration**
   ```bash
   vercel prisma db push
   ```

4. **Domain Configuration**
   Set up custom domain and SSL certificates

### Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates installed
- [ ] CDN configured for static assets
- [ ] Monitoring and logging enabled
- [ ] Backup procedures established

##  Testing

### Testing Strategy

```bash
# Run linting
pnpm lint

# Type checking
npx tsc --noEmit

# Build verification
pnpm build
```

### Test Coverage Areas
- **API Routes**: Authentication, document processing, chat functionality
- **Components**: UI components, form validation, error handling
- **Database**: CRUD operations, data integrity, migrations
- **AI Integration**: Model responses, error handling, fallbacks

##  Contributing

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
4. **Run tests and linting**
   ```bash
   pnpm lint
   npx tsc --noEmit
   ```
5. **Commit your changes**
   ```bash
   git commit -m "Add: Brief description of changes"
   ```
6. **Push to your branch**
   ```bash
   git push origin feature/your-feature-name
   ```
7. **Create a Pull Request**

### Code Standards

- **TypeScript**: Strict type checking enabled
- **ESLint**: Biome linting rules
- **Prettier**: Consistent code formatting
- **Conventional Commits**: Standardized commit messages

### Commit Message Format

```
type(scope): description

Types: feat, fix, docs, style, refactor, test, chore
```

##  API Documentation

### REST API Endpoints

#### Authentication
- `POST /api/auth/[...nextauth]` - NextAuth.js authentication
- `POST /api/auth/verify-email` - Email verification

#### Document Management
- `POST /api/upload` - File upload with processing
- `GET /api/documents` - List user documents
- `GET /api/documents/[id]` - Get document details
- `DELETE /api/documents/[id]` - Delete document

#### Analysis & Chat
- `POST /api/chat` - Send chat message
- `GET /api/chat?documentId=xxx` - Get chat history
- `POST /api/translate` - Text translation

#### Document Proxy
- `GET /api/document-proxy?url=xxx` - Secure document access

### API Response Format

```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "timestamp": "2024-01-01T00:00:00Z"
}
```

##  Troubleshooting

### Common Issues

#### Database Connection
```bash
# Check database connectivity
pnpm prisma db push --preview-feature
```

#### Build Errors
```bash
# Clear Next.js cache
rm -rf .next
pnpm build
```

#### Environment Variables
```bash
# Validate environment setup
node -e "console.log(Object.keys(process.env).filter(k => k.startsWith('NEXT')))"
```

### Performance Optimization

- **Database Queries**: Use Prisma's `include` and `select` for efficient data fetching
- **Image Optimization**: Next.js automatic image optimization
- **Code Splitting**: Dynamic imports for large components
- **Caching**: Redis caching for frequently accessed data

##  License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

##  Acknowledgments

- **Next.js Team** - For the amazing React framework
- **Vercel** - For hosting and deployment platform
- **Supabase** - For PostgreSQL hosting and real-time features
- **Prisma** - For the excellent ORM and database toolkit
- **Google AI** - For powerful AI models and APIs
- **OpenAI** - For advanced language models

##  Support

For support, email support@legalease.com or join our Discord community.

---

**LegalEase** - Making legal documents accessible to everyone, powered by AI. 
