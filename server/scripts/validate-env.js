#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Environment validation script
 * Run this before deployment to ensure all required environment variables are set
 */

const requiredVars = [
  'NODE_ENV',
  'PORT',
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
];

const productionRequiredVars = [
  'EMAIL_HOST',
  'EMAIL_USER',
  'EMAIL_PASS',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
];

const aiServiceVars = [
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'GOOGLE_AI_API_KEY',
];

function loadEnvFile(filePath) {
  try {
    const envContent = fs.readFileSync(filePath, 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    });
    
    return envVars;
  } catch (error) {
    return {};
  }
}

function validateEnvironment() {
  console.log('🔍 Validating environment variables...\n');

  const envFile = path.join(__dirname, '../.env');
  const envVars = { ...process.env, ...loadEnvFile(envFile) };
  
  let hasErrors = false;
  let hasWarnings = false;

  // Check required variables
  console.log('📋 Required Variables:');
  requiredVars.forEach(varName => {
    if (!envVars[varName] || envVars[varName].includes('your-') || envVars[varName].includes('example')) {
      console.log(`❌ ${varName}: Missing or using example value`);
      hasErrors = true;
    } else {
      console.log(`✅ ${varName}: Set`);
    }
  });

  // Check production variables
  if (envVars.NODE_ENV === 'production') {
    console.log('\n🏭 Production Variables:');
    productionRequiredVars.forEach(varName => {
      if (!envVars[varName] || envVars[varName].includes('your-') || envVars[varName].includes('example')) {
        console.log(`❌ ${varName}: Missing or using example value`);
        hasErrors = true;
      } else {
        console.log(`✅ ${varName}: Set`);
      }
    });
  }

  // Check AI service variables
  console.log('\n🤖 AI Service Variables:');
  const availableAIServices = [];
  aiServiceVars.forEach(varName => {
    if (envVars[varName] && !envVars[varName].includes('your-') && !envVars[varName].includes('example')) {
      console.log(`✅ ${varName}: Set`);
      availableAIServices.push(varName);
    } else {
      console.log(`⚠️  ${varName}: Not set`);
      hasWarnings = true;
    }
  });

  if (availableAIServices.length === 0) {
    console.log('❌ No AI services configured! At least one AI service is required.');
    hasErrors = true;
  }

  // Security checks
  console.log('\n🔒 Security Checks:');
  
  // JWT Secret strength
  if (envVars.JWT_SECRET && envVars.JWT_SECRET.length < 32) {
    console.log('⚠️  JWT_SECRET should be at least 32 characters long');
    hasWarnings = true;
  } else if (envVars.JWT_SECRET) {
    console.log('✅ JWT_SECRET: Adequate length');
  }

  // Different secrets
  if (envVars.JWT_SECRET === envVars.JWT_ACCESS_SECRET || 
      envVars.JWT_SECRET === envVars.JWT_REFRESH_SECRET) {
    console.log('⚠️  JWT secrets should be different for better security');
    hasWarnings = true;
  } else if (envVars.JWT_ACCESS_SECRET && envVars.JWT_REFRESH_SECRET) {
    console.log('✅ JWT secrets: Using different values');
  }

  // Database URL format
  if (envVars.DATABASE_URL && !envVars.DATABASE_URL.startsWith('mysql://')) {
    console.log('⚠️  DATABASE_URL should start with mysql://');
    hasWarnings = true;
  } else if (envVars.DATABASE_URL) {
    console.log('✅ DATABASE_URL: Correct format');
  }

  // Summary
  console.log('\n📊 Summary:');
  if (hasErrors) {
    console.log('❌ Validation failed! Please fix the errors above.');
    process.exit(1);
  } else if (hasWarnings) {
    console.log('⚠️  Validation passed with warnings. Consider addressing the warnings above.');
    process.exit(0);
  } else {
    console.log('✅ All environment variables are properly configured!');
    process.exit(0);
  }
}

// Run validation
validateEnvironment();