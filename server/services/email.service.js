import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  async sendAbandonedCartReminder(customerEmail, cartData) {
    try {
      const { sessionId, items, totalAmount, createdAt } = cartData;
      
      const mailOptions = {
        from: `"Vheer" <${process.env.EMAIL_USER}>`,
        to: customerEmail,
        subject: '🛒 Вы забыли товары в корзине!',
        html: this.generateAbandonedCartHtml(items, totalAmount, createdAt, sessionId)
      };

      await this.transporter.sendMail(mailOptions);
      logger.info('Abandoned cart email sent', { email: customerEmail, sessionId });
      
      return { success: true };
    } catch (error) {
      logger.error('Failed to send abandoned cart email', {
        error: error.message,
        email: customerEmail
      });
      return { success: false, error: error.message };
    }
  }

  async sendNewOrderNotification(adminEmail, orderData) {
    try {
      const { orderReference, customerEmail, totalAmount } = orderData;
      
      const mailOptions = {
        from: `"Vheer" <${process.env.EMAIL_USER}>`,
        to: adminEmail,
        subject: `🛍️ Новый заказ #${orderReference}`,
        html: this.generateNewOrderHtml(orderData)
      };

      await this.transporter.sendMail(mailOptions);
      logger.info('New order notification sent', { adminEmail, orderReference });
      
      return { success: true };
    } catch (error) {
      logger.error('Failed to send new order notification', {
        error: error.message,
        orderReference: orderData.orderReference
      });
      return { success: false, error: error.message };
    }
  }

  generateAbandonedCartHtml(items, totalAmount, createdAt, sessionId) {
    const itemsHtml = items.map(item => `
      <div style="border-bottom: 1px solid #eee; padding: 15px 0;">
        <div style="display: flex; align-items: center;">
          <img src="${item.image || '/default-product.jpg'}" 
               alt="${item.name}" 
               style="width: 60px; height: 60px; object-fit: cover; margin-right: 15px; border-radius: 8px;">
          <div>
            <h4 style="margin: 0; font-size: 16px; color: #333;">${item.name}</h4>
            <p style="margin: 5px 0; color: #666;">Модель: ${item.model}</p>
            <p style="margin: 5px 0; color: #666;">Количество: ${item.quantity}</p>
            <p style="margin: 5px 0; font-weight: bold; color: #ff6b35;">₴${item.price}</p>
          </div>
        </div>
      </div>
    `).join('');

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Напоминание о корзине</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 0;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🛒 Ваша корзина ждет!</h1>
          <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Не упустите возможность завершить покупку</p>
        </div>

        <!-- Content -->
        <div style="padding: 30px;">
          <h2 style="color: #333; margin-bottom: 20px;">Товары в вашей корзине:</h2>
          
          ${itemsHtml}
          
          <!-- Total -->
          <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center;">
            <h3 style="margin: 0; color: #333;">Общая сумма: <span style="color: #ff6b35;">₴${totalAmount}</span></h3>
          </div>

          <!-- CTA Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL}/cart?session=${sessionId}" 
               style="background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%); 
                      color: white; 
                      padding: 15px 40px; 
                      text-decoration: none; 
                      border-radius: 25px; 
                      font-weight: bold; 
                      font-size: 16px;
                      display: inline-block;
                      box-shadow: 0 4px 15px rgba(255, 107, 53, 0.3);">
              🛍️ Завершить покупку
            </a>
          </div>

          <!-- Info -->
          <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <p style="margin: 0; color: #1976d2; font-size: 14px; text-align: center;">
              💡 Корзина создана ${new Date(createdAt).toLocaleDateString('ru-RU')} в ${new Date(createdAt).toLocaleTimeString('ru-RU')}
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #333; color: white; padding: 20px; text-align: center;">
          <p style="margin: 0; font-size: 14px;">© 2024 Vheer. Спасибо за выбор наших товаров!</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  generateNewOrderHtml(orderData) {
    const {
      orderReference,
      customerFirstName,
      customerLastName,
      customerEmail,
      customerPhone,
      totalAmount,
      items,
      shippingAddress,
      createdAt
    } = orderData;

    const itemsHtml = items?.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₴${item.price}</td>
      </tr>
    `).join('') || '<tr><td colspan="3" style="padding: 10px; text-align: center; color: #666;">Детали товаров недоступны</td></tr>';

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Новый заказ</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 0;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🛍️ Новый заказ!</h1>
          <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Заказ #${orderReference}</p>
        </div>

        <!-- Content -->
        <div style="padding: 30px;">
          
          <!-- Customer Info -->
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 15px 0; color: #333;">👤 Информация о клиенте:</h3>
            <p style="margin: 5px 0; color: #666;"><strong>Имя:</strong> ${customerFirstName} ${customerLastName}</p>
            <p style="margin: 5px 0; color: #666;"><strong>Email:</strong> ${customerEmail}</p>
            <p style="margin: 5px 0; color: #666;"><strong>Телефон:</strong> ${customerPhone || 'Не указан'}</p>
          </div>

          <!-- Shipping Address -->
          ${shippingAddress ? `
          <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 15px 0; color: #333;">📍 Адрес доставки:</h3>
            <p style="margin: 5px 0; color: #666;">${shippingAddress}</p>
          </div>
          ` : ''}

          <!-- Order Items -->
          <div style="margin-bottom: 20px;">
            <h3 style="margin: 0 0 15px 0; color: #333;">📦 Товары в заказе:</h3>
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd;">
              <thead>
                <tr style="background-color: #f8f9fa;">
                  <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Товар</th>
                  <th style="padding: 12px; text-align: center; border-bottom: 2px solid #ddd;">Кол-во</th>
                  <th style="padding: 12px; text-align: right; border-bottom: 2px solid #ddd;">Цена</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
          </div>

          <!-- Total -->
          <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
            <h3 style="margin: 0; color: #155724;">💰 Общая сумма: ₴${totalAmount}</h3>
          </div>

          <!-- Order Info -->
          <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px;">
            <p style="margin: 0; color: #1976d2; font-size: 14px; text-align: center;">
              📅 Заказ создан: ${new Date(createdAt).toLocaleDateString('ru-RU')} в ${new Date(createdAt).toLocaleTimeString('ru-RU')}
            </p>
          </div>

          <!-- Admin Action -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL}/admin?tab=orders" 
               style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); 
                      color: white; 
                      padding: 15px 40px; 
                      text-decoration: none; 
                      border-radius: 25px; 
                      font-weight: bold; 
                      font-size: 16px;
                      display: inline-block;
                      box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);">
              🔧 Перейти в админ-панель
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #333; color: white; padding: 20px; text-align: center;">
          <p style="margin: 0; font-size: 14px;">Админ-уведомление Vheer</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  async testConnection() {
    try {
      await this.transporter.verify();
      logger.info('Email service connection successful');
      return { success: true };
    } catch (error) {
      logger.error('Email service connection failed', { error: error.message });
      return { success: false, error: error.message };
    }
  }
}

export default new EmailService();