import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupGuestUsers() {
  try {
    console.log('🔍 Поиск гостевых пользователей...');
    
    // Находим всех пользователей, которые являются гостевыми
    const guestUsers = await prisma.user.findMany({
      where: {
        OR: [
          { fullName: 'Guest User' },
          { email: { contains: 'guest_' } },
          { email: { contains: '@temp.com' } },
          { username: { contains: 'guest_' } },
          { emailVerified: false, totalCredits: 0, fullName: 'Guest User' }
        ]
      },
      include: {
        _count: {
          select: {
            images: true,
            generations: true,
            payments: true,
            orders: true,
            cartSessions: true
          }
        }
      }
    });

    console.log(`📊 Найдено ${guestUsers.length} гостевых пользователей`);
    
    if (guestUsers.length === 0) {
      console.log('✅ Гостевых пользователей не найдено');
      return;
    }

    // Показываем информацию о найденных пользователях
    guestUsers.forEach((user, index) => {
      console.log(`\n${index + 1}. ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Full Name: ${user.fullName}`);
      console.log(`   Created: ${user.createdAt.toLocaleString('ru-RU')}`);
      console.log(`   Credits: ${user.totalCredits}`);
      console.log(`   Images: ${user._count.images}`);
      console.log(`   Generations: ${user._count.generations}`);
      console.log(`   Payments: ${user._count.payments}`);
      console.log(`   Orders: ${user._count.orders}`);
      console.log(`   Cart Sessions: ${user._count.cartSessions}`);
    });

    // Удаляем пользователей с минимальной активностью
    const usersToDelete = guestUsers.filter(user => 
      user._count.images === 0 && 
      user._count.generations === 0 && 
      user._count.orders === 0
    );

    console.log(`\n🗑️  К удалению: ${usersToDelete.length} пользователей (без активности)`);

    if (usersToDelete.length === 0) {
      console.log('✅ Нет пользователей для безопасного удаления');
      return;
    }

    // Удаляем связанные данные и пользователей
    let deletedCount = 0;
    
    for (const user of usersToDelete) {
      try {
        console.log(`🔄 Удаление пользователя ${user.email}...`);
        
        // Призма автоматически удалит связанные записи благодаря каскадному удалению
        await prisma.user.delete({
          where: { id: user.id }
        });
        
        deletedCount++;
        console.log(`✅ Удален: ${user.email}`);
        
      } catch (error) {
        console.error(`❌ Ошибка удаления ${user.email}:`, error.message);
      }
    }

    console.log(`\n🎉 Успешно удалено ${deletedCount} из ${usersToDelete.length} гостевых пользователей`);
    
    // Показываем оставшихся пользователей с активностью
    const remainingActiveGuests = guestUsers.filter(user => 
      user._count.images > 0 || 
      user._count.generations > 0 || 
      user._count.orders > 0
    );

    if (remainingActiveGuests.length > 0) {
      console.log(`\n⚠️  Оставлено ${remainingActiveGuests.length} гостевых пользователей с активностью:`);
      remainingActiveGuests.forEach(user => {
        console.log(`   - ${user.email} (${user._count.images} изображений, ${user._count.generations} генераций, ${user._count.orders} заказов)`);
      });
    }

  } catch (error) {
    console.error('❌ Ошибка при очистке гостевых пользователей:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Запускаем скрипт
cleanupGuestUsers();