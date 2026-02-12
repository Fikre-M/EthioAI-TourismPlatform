# 🔐 Security Guide for EthioAI Tourism Platform

## API Key Management Best Practices

### ✅ DO's

1. **Backend Only for Private Keys**
   - Store all AI API keys (OpenAI, Anthropic, etc.) in backend environment variables
   - Never expose private API keys to the frontend
   - Use server-side proxy endpoints for AI API calls

2. **Environment Variables**
   ```bash
   # ✅ Good - Backend .env
   OPENAI_API_KEY=sk-proj-xxxxx
   ANTHROPIC_API_KEY=sk-ant-xxxxx
   
   # ✅ Good - Frontend .env (public keys only)
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
   VITE_MAPBOX_ACCESS_TOKEN=pk.xxxxx
   ```

3. **Secure Storage**
   - Use encrypted environment variables in production
   - Rotate API keys regularly
   - Monitor API key usage and set up alerts

4. **Rate Limiting**
   - Implement rate limiting for AI endpoints
   - Use user-based rate limiting when possible
   - Set up monitoring for unusual usage patterns

### ❌ DON'Ts

1. **Never in Frontend**
   ```javascript
   // ❌ NEVER do this
   const openaiKey = 'sk-proj-xxxxx'; // Exposed to users!
   ```

2. **Never in Git**
   - Add `.env` to `.gitignore`
   - Use `.env.example` for documentation
   - Never commit actual API keys

3. **Never in Client-Side Code**
   - Don't put API keys in React components
   - Don't store in localStorage or sessionStorage
   - Don't include in client-side configuration

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │    │  Express Server │    │   AI Services   │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │   UI/UX     │ │    │ │ API Routes  │ │    │ │   OpenAI    │ │
│ │             │ │    │ │             │ │    │ │             │ │
│ │ Public Keys │◄┼────┼►│ Private Keys│◄┼────┼►│ Anthropic   │ │
│ │ Only        │ │    │ │ Secure      │ │    │ │             │ │
│ │             │ │    │ │             │ │    │ │   Google    │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Implementation Examples

### Backend API Endpoint
```typescript
// ✅ Secure backend implementation
app.post('/api/ai/chat', authenticateUser, aiRateLimit, async (req, res) => {
  try {
    const { message } = req.body;
    
    // API key is securely stored in environment
    const response = await AIService.generateResponse([
      { role: 'user', content: message }
    ]);
    
    res.json({ success: true, data: response });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### Frontend API Call
```typescript
// ✅ Secure frontend implementation
const chatService = {
  async sendMessage(message: string) {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`, // User auth only
      },
      body: JSON.stringify({ message }),
    });
    
    return response.json();
  }
};
```

## Environment Setup

### 1. Backend Environment (.env)
```bash
# AI Services (PRIVATE - Backend only)
OPENAI_API_KEY=sk-proj-your-actual-key
ANTHROPIC_API_KEY=sk-ant-your-actual-key
GOOGLE_AI_API_KEY=your-google-key

# Database (PRIVATE)
DATABASE_URL=mysql://user:pass@localhost:3306/db

# JWT Secrets (PRIVATE)
JWT_SECRET=your-super-long-random-secret-key
JWT_ACCESS_SECRET=different-access-secret
JWT_REFRESH_SECRET=different-refresh-secret

# Payment (PRIVATE)
STRIPE_SECRET_KEY=sk_test_your-stripe-secret
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Email (PRIVATE)
EMAIL_PASS=your-email-app-password
```

### 2. Frontend Environment (.env)
```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:5000

# Public Keys Only
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-public-key
VITE_MAPBOX_ACCESS_TOKEN=pk.your-mapbox-public-token

# Feature Flags
VITE_ENABLE_CHAT=true
VITE_DEBUG_MODE=false
```

## Production Deployment

### 1. Environment Variables
```bash
# Use your hosting provider's environment variable system
# Examples:
# - Vercel: Environment Variables in dashboard
# - Heroku: Config Vars
# - AWS: Parameter Store or Secrets Manager
# - Docker: docker-compose.yml with env_file
```

### 2. Secrets Management
```yaml
# docker-compose.yml example
version: '3.8'
services:
  backend:
    build: ./server
    env_file:
      - .env.production
    secrets:
      - openai_key
      - database_password

secrets:
  openai_key:
    external: true
  database_password:
    external: true
```

### 3. CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Validate Environment
        run: |
          cd server
          npm run validate:env
          
      - name: Deploy
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: |
          # Your deployment script
```

## Monitoring and Alerts

### 1. API Key Usage Monitoring
```typescript
// Monitor API usage
const monitorAPIUsage = async (provider: string, tokensUsed: number, cost: number) => {
  await logAPIUsage({
    provider,
    tokensUsed,
    cost,
    timestamp: new Date(),
    userId: req.user?.id,
  });
  
  // Alert if usage is high
  if (cost > DAILY_COST_LIMIT) {
    await sendAlert('High API usage detected');
  }
};
```

### 2. Security Alerts
```typescript
// Monitor for suspicious activity
const securityMiddleware = (req, res, next) => {
  // Log all API key related requests
  if (req.path.includes('/api/ai/')) {
    logSecurityEvent({
      type: 'AI_API_ACCESS',
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      timestamp: new Date(),
    });
  }
  
  next();
};
```

## Emergency Procedures

### 1. API Key Compromise
```bash
# Immediate steps:
1. Revoke compromised API key immediately
2. Generate new API key
3. Update environment variables
4. Restart all services
5. Monitor for unauthorized usage
6. Review access logs
```

### 2. Security Incident Response
```bash
# Response checklist:
1. Identify scope of compromise
2. Isolate affected systems
3. Preserve evidence
4. Notify stakeholders
5. Implement fixes
6. Monitor for further issues
7. Document lessons learned
```

## Compliance and Auditing

### 1. Regular Security Audits
- Review API key access patterns monthly
- Audit environment variable configurations
- Check for exposed secrets in code
- Validate rate limiting effectiveness

### 2. Compliance Requirements
- GDPR: Ensure user data protection
- PCI DSS: Secure payment processing
- SOC 2: Security controls documentation
- ISO 27001: Information security management

## Tools and Resources

### 1. Security Tools
- **git-secrets**: Prevent committing secrets
- **truffleHog**: Find secrets in git history
- **SAST tools**: Static application security testing
- **Dependency scanning**: Check for vulnerable packages

### 2. Monitoring Services
- **Sentry**: Error tracking and performance monitoring
- **DataDog**: Infrastructure and application monitoring
- **New Relic**: Application performance monitoring
- **AWS CloudWatch**: Cloud infrastructure monitoring

Remember: Security is an ongoing process, not a one-time setup. Regularly review and update your security practices!