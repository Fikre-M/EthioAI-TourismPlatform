import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'your-access-secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
    accessExpiresIn: '15m',  // 15 minutes
    refreshExpiresIn: '7d',  // 7 days
  },
  database: {
    url: process.env.DATABASE_URL || 'mysql://user:password@localhost:3306/ethioai',
  },
  email: {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT) : 587,
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    from: process.env.EMAIL_FROM || 'noreply@ethioai.com',
  },
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
};
