import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { prisma } from '@skilltree/database';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // Database connection with retry logic (exponential backoff)
  const maxRetries = 3;
  const retryDelays = [1000, 2000, 4000]; // 1s, 2s, 4s

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      await prisma.$connect();
      console.log('✅ Database connected successfully');
      break;
    } catch (error) {
      const isLastAttempt = attempt === maxRetries - 1;
      if (isLastAttempt) {
        console.error('❌ Database connection failed after 3 attempts:', error);
        process.exit(1);
      }
      console.warn(
        `⚠️  Database connection attempt ${attempt + 1} failed. Retrying in ${retryDelays[attempt]}ms...`,
      );
      await new Promise((resolve) => setTimeout(resolve, retryDelays[attempt]));
    }
  }

  const port = process.env.PORT || 4000;
  await app.listen(port);

  console.log(`🚀 API server listening on port ${port}`);

  // Send PM2 ready signal
  if (process.send) {
    process.send('ready');
  }

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('⏹️  Received SIGINT, graceful shutdown...');
    await app.close();
    await prisma.$disconnect();
    process.exit(0);
  });
}

bootstrap();
