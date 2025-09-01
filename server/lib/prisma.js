import { PrismaClient } from '@prisma/client';

// Определяем настройки для разных окружений
const prismaOptions = {
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
  
  // Настройки connection pool для production
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
};

// Singleton pattern для Prisma Client
let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient(prismaOptions);
} else {
  // В development используем глобальный объект для hot reload
  if (!global.prisma) {
    global.prisma = new PrismaClient(prismaOptions);
  }
  prisma = global.prisma;
}

// Добавляем middleware для логирования медленных запросов
prisma.$use(async (params, next) => {
  const before = Date.now();
  const result = await next(params);
  const after = Date.now();
  const duration = after - before;
  
  // Логируем запросы дольше 1 секунды
  if (duration > 1000) {
    console.warn(`⚠️ Slow query detected: ${params.model}.${params.action} took ${duration}ms`);
  }
  
  return result;
});

// Обработка отключения
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;