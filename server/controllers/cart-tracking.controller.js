import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Сохранить или обновить состояние корзины
 */
export const saveCartSession = async (req, res) => {
  try {
    const { sessionId, items, totalAmount, itemCount, currency = 'UAH', customerEmail } = req.body;
    const userId = req.user?.id || null;
    
    // Получаем информацию о пользователе
    const userIp = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    
    // Проверяем, существует ли уже сессия корзины
    const existingSession = await prisma.cartSession.findUnique({
      where: { sessionId }
    });
    
    if (existingSession) {
      // Обновляем существующую сессию
      const updatedSession = await prisma.cartSession.update({
        where: { sessionId },
        data: {
          items,
          totalAmount,
          itemCount,
          currency,
          userId: userId || existingSession.userId,
          lastActivityAt: new Date(),
          status: itemCount > 0 ? 'active' : 'abandoned',
          abandonedAt: itemCount === 0 ? new Date() : null,
          userIp,
          userAgent,
          customerEmail: customerEmail || existingSession.customerEmail
        }
      });
      
      res.json({
        success: true,
        cartSession: updatedSession,
        message: 'Корзина обновлена'
      });
    } else {
      // Создаем новую сессию корзины
      const newSession = await prisma.cartSession.create({
        data: {
          sessionId,
          userId,
          items,
          totalAmount,
          itemCount,
          currency,
          status: 'active',
          userIp,
          userAgent,
          customerEmail
        }
      });
      
      res.json({
        success: true,
        cartSession: newSession,
        message: 'Корзина сохранена'
      });
    }
    
  } catch (error) {
    console.error('Ошибка сохранения корзины:', error);
    res.status(500).json({
      success: false,
      message: 'Не удалось сохранить корзину'
    });
  }
};

/**
 * Пометить корзину как оплаченную
 */
export const markCartAsConverted = async (req, res) => {
  try {
    const { sessionId, orderId } = req.body;
    
    const updatedSession = await prisma.cartSession.update({
      where: { sessionId },
      data: {
        status: 'converted',
        convertedToOrderId: orderId
      }
    });
    
    res.json({
      success: true,
      cartSession: updatedSession,
      message: 'Корзина помечена как оплаченная'
    });
    
  } catch (error) {
    console.error('Ошибка обновления корзины:', error);
    res.status(500).json({
      success: false,
      message: 'Не удалось обновить корзину'
    });
  }
};

/**
 * Получить все активные корзины (админ)
 */
export const getActiveCarts = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, sortBy = 'lastActivityAt', sortOrder = 'desc' } = req.query;
    
    const skip = (page - 1) * limit;
    
    // Фильтры
    const where = {};
    if (status) {
      where.status = status;
    }
    
    // Получаем активные корзины
    const [carts, total] = await Promise.all([
      prisma.cartSession.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: {
          [sortBy]: sortOrder
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              fullName: true
            }
          }
        }
      }),
      prisma.cartSession.count({ where })
    ]);
    
    // Статистика
    const stats = await prisma.cartSession.aggregate({
      where: {
        status: 'active'
      },
      _sum: {
        totalAmount: true,
        itemCount: true
      },
      _count: {
        _all: true
      }
    });
    
    // Статистика по брошенным корзинам
    const abandonedStats = await prisma.cartSession.aggregate({
      where: {
        status: 'abandoned',
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // За последние 7 дней
        }
      },
      _sum: {
        totalAmount: true
      },
      _count: {
        _all: true
      }
    });
    
    res.json({
      success: true,
      carts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      stats: {
        activeCarts: stats._count._all || 0,
        activeCartValue: stats._sum.totalAmount || 0,
        activeItems: stats._sum.itemCount || 0,
        abandonedCarts: abandonedStats._count._all || 0,
        abandonedValue: abandonedStats._sum.totalAmount || 0
      }
    });
    
  } catch (error) {
    console.error('Ошибка получения корзин:', error);
    res.status(500).json({
      success: false,
      message: 'Не удалось получить корзины'
    });
  }
};

/**
 * Получить детали корзины (админ)
 */
export const getCartDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    const cart = await prisma.cartSession.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            fullName: true,
            totalCredits: true,
            createdAt: true
          }
        }
      }
    });
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Корзина не найдена'
      });
    }
    
    // Если корзина была конвертирована, получаем заказ
    let order = null;
    if (cart.convertedToOrderId) {
      order = await prisma.order.findFirst({
        where: {
          OR: [
            { id: cart.convertedToOrderId },
            { orderReference: cart.convertedToOrderId }
          ]
        }
      });
    }
    
    res.json({
      success: true,
      cart,
      order
    });
    
  } catch (error) {
    console.error('Ошибка получения деталей корзины:', error);
    res.status(500).json({
      success: false,
      message: 'Не удалось получить детали корзины'
    });
  }
};

/**
 * Получить статистику корзин (админ)
 */
export const getCartStats = async (req, res) => {
  try {
    const { period = '7' } = req.query; // дни
    
    const dateFilter = new Date();
    dateFilter.setDate(dateFilter.getDate() - parseInt(period));
    
    // Различные статистики
    const [
      totalCarts,
      activeCarts,
      abandonedCarts,
      convertedCarts,
      cartValueStats,
      conversionRate,
      topProducts,
      hourlyActivity
    ] = await Promise.all([
      // Всего корзин
      prisma.cartSession.count({
        where: {
          createdAt: {
            gte: dateFilter
          }
        }
      }),
      
      // Активные корзины
      prisma.cartSession.count({
        where: {
          status: 'active',
          createdAt: {
            gte: dateFilter
          }
        }
      }),
      
      // Брошенные корзины
      prisma.cartSession.count({
        where: {
          status: 'abandoned',
          createdAt: {
            gte: dateFilter
          }
        }
      }),
      
      // Конвертированные корзины
      prisma.cartSession.count({
        where: {
          status: 'converted',
          createdAt: {
            gte: dateFilter
          }
        }
      }),
      
      // Статистика по стоимости
      prisma.cartSession.aggregate({
        where: {
          createdAt: {
            gte: dateFilter
          }
        },
        _avg: {
          totalAmount: true
        },
        _sum: {
          totalAmount: true
        },
        _max: {
          totalAmount: true
        },
        _min: {
          totalAmount: true
        }
      }),
      
      // Конверсия
      prisma.cartSession.groupBy({
        by: ['status'],
        _count: {
          _all: true
        },
        where: {
          createdAt: {
            gte: dateFilter
          }
        }
      }),
      
      // Популярные товары в корзинах
      prisma.cartSession.findMany({
        where: {
          createdAt: {
            gte: dateFilter
          }
        },
        select: {
          items: true
        }
      }),
      
      // Активность по часам (за последние 24 часа)
      prisma.cartSession.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        },
        select: {
          createdAt: true
        }
      })
    ]);
    
    // Обработка популярных товаров
    const productCounts = {};
    topProducts.forEach(cart => {
      if (cart.items && Array.isArray(cart.items)) {
        cart.items.forEach(item => {
          const key = item.frameColorName || item.frameColor || 'Unknown';
          if (!productCounts[key]) {
            productCounts[key] = {
              name: key,
              count: 0,
              totalValue: 0
            };
          }
          productCounts[key].count += item.quantity || 1;
          productCounts[key].totalValue += (item.price || 0) * (item.quantity || 1);
        });
      }
    });
    
    const topProductsList = Object.values(productCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    // Активность по часам
    const hourlyData = Array(24).fill(0);
    hourlyActivity.forEach(cart => {
      const hour = new Date(cart.createdAt).getHours();
      hourlyData[hour]++;
    });
    
    // Расчет коэффициента конверсии
    const conversionData = conversionRate.reduce((acc, curr) => {
      acc[curr.status] = curr._count._all;
      return acc;
    }, {});
    
    const conversionPercent = totalCarts > 0 
      ? ((conversionData.converted || 0) / totalCarts * 100).toFixed(2)
      : 0;
    
    const abandonmentRate = totalCarts > 0
      ? ((conversionData.abandoned || 0) / totalCarts * 100).toFixed(2)
      : 0;
    
    res.json({
      success: true,
      stats: {
        period: `${period} дней`,
        totalCarts,
        activeCarts,
        abandonedCarts,
        convertedCarts,
        conversionRate: parseFloat(conversionPercent),
        abandonmentRate: parseFloat(abandonmentRate),
        cartValue: {
          total: cartValueStats._sum.totalAmount || 0,
          average: cartValueStats._avg.totalAmount || 0,
          max: cartValueStats._max.totalAmount || 0,
          min: cartValueStats._min.totalAmount || 0
        },
        topProducts: topProductsList,
        hourlyActivity: hourlyData,
        potentialRevenue: abandonedCarts * (cartValueStats._avg.totalAmount || 0)
      }
    });
    
  } catch (error) {
    console.error('Ошибка получения статистики корзин:', error);
    res.status(500).json({
      success: false,
      message: 'Не удалось получить статистику корзин'
    });
  }
};

/**
 * Автоматическая пометка брошенных корзин
 */
export const markAbandonedCarts = async () => {
  try {
    // Помечаем корзины как брошенные, если нет активности более 2 часов
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    
    const result = await prisma.cartSession.updateMany({
      where: {
        status: 'active',
        lastActivityAt: {
          lt: twoHoursAgo
        }
      },
      data: {
        status: 'abandoned',
        abandonedAt: new Date()
      }
    });
    
    console.log(`Помечено ${result.count} корзин как брошенные`);
    return result;
    
  } catch (error) {
    console.error('Ошибка пометки брошенных корзин:', error);
  }
};