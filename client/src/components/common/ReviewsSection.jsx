import React, { useState, useRef, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';

const ReviewsSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef(null);

  // Заглушки для отзывов с фото работ
  const reviews = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1555169062-013468b47731?w=400&h=400&fit=crop',
      customerPhoto: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop&crop=face',
      name: 'Анна',
      rating: 5,
      comment: 'Спасибо за потрясающую работу. Качество печати превосходное, доставка быстрая. Обязательно закажу еще!',
      verified: true
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=400&fit=crop',
      customerPhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face',
      name: 'Дмитрий',
      rating: 5,
      comment: 'Заказывал постер с личной фотографией. Результат превзошел ожидания! Рамка отличного качества.',
      verified: true
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1523712999610-f77fbcfc3843?w=400&h=400&fit=crop',
      customerPhoto: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face',
      name: 'Мария',
      rating: 5,
      comment: 'Очень довольна покупкой! Цвета яркие, печать четкая. Украшение для моей гостиной.',
      verified: true
    },
    {
      id: 4,
      image: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=400&h=400&fit=crop',
      customerPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face',
      name: 'Алексей',
      rating: 5,
      comment: 'Отличный сервис! Помогли с выбором размера и рамки. Доставка точно в срок.',
      verified: true
    },
    {
      id: 5,
      image: 'https://images.unsplash.com/photo-1481349518771-20055b2a7b24?w=400&h=400&fit=crop',
      customerPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=face',
      name: 'Елена',
      rating: 5,
      comment: 'Заказываю уже третий раз. Всегда отличное качество и быстрая доставка!',
      verified: true
    },
    {
      id: 6,
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop',
      customerPhoto: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&h=80&fit=crop&crop=face',
      name: 'Светлана',
      rating: 5,
      comment: 'Прекрасный подарок на день рождения! Упаковка тоже на высоте.',
      verified: true
    },
    {
      id: 7,
      image: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&h=400&fit=crop',
      customerPhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&crop=face',
      name: 'Ольга',
      rating: 5,
      comment: 'Невероятное качество печати! Заказала несколько постеров для офиса, все в восторге!',
      verified: true
    },
    {
      id: 8,
      image: 'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=400&h=400&fit=crop',
      customerPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face',
      name: 'Виктор',
      rating: 5,
      comment: 'Быстро, качественно и недорого! Постеры выглядят потрясающе в моей квартире.',
      verified: true
    },
    {
      id: 9,
      image: 'https://images.unsplash.com/photo-1533158326339-7f3cf2404354?w=400&h=400&fit=crop',
      customerPhoto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&crop=face',
      name: 'Игорь',
      rating: 5,
      comment: 'Отличная работа! Помогли выбрать идеальный размер и оформление. Супер сервис!',
      verified: true
    }
  ];

  // Автоматическая прокрутка
  useEffect(() => {
    const timer = setInterval(() => {
      handleNext();
    }, 5000);

    return () => clearInterval(timer);
  }, [currentIndex]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? reviews.length - 4 : prev - 1));
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -330, behavior: 'smooth' });
    }
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev >= reviews.length - 4 ? 0 : prev + 1));
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 330, behavior: 'smooth' });
    }
  };

  // Функция для отрисовки звезд
  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }, (_, index) => (
          <Star
            key={index}
            className={`w-3 h-3 ${
              index < rating ? 'text-pink-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="mt-16 py-12 overflow-hidden">
      {/* Заголовок */}
      <div className="text-center mb-8 px-4">
        <div className="flex items-center justify-center gap-2 mb-3">
          {renderStars(5)}
          <span className="text-gray-700 text-sm font-medium">Rated 4.9 from 1000+ reviews</span>
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          Клиенты любят наши постеры!
        </h2>
        <p className="text-gray-700">
          Более 1000 довольных покупателей по всей Украине
        </p>
      </div>

      {/* Карусель отзывов */}
      <div className="relative px-4">
        {/* Кнопка влево */}
        <button
          onClick={handlePrev}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 backdrop-blur-sm text-gray-700 p-2 rounded-full hover:bg-white transition-colors shadow-lg"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Кнопка вправо */}
        <button
          onClick={handleNext}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 backdrop-blur-sm text-gray-700 p-2 rounded-full hover:bg-white transition-colors shadow-lg"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Контейнер с отзывами */}
        <div 
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {reviews.map((review) => (
            <div
              key={review.id}
              className="flex-shrink-0 w-80 h-[450px] snap-center"
            >
              {/* Карточка отзыва */}
              <div className="bg-white rounded-xl overflow-hidden shadow-xl h-full flex flex-col">
                {/* Изображение работы */}
                <div className="relative h-64 bg-gray-200">
                  <img
                    src={review.image}
                    alt="Customer artwork"
                    className="w-full h-full object-cover"
                  />
                  {/* Метка "Проверенный покупатель" */}
                  {review.verified && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      <span>Verified Customer</span>
                    </div>
                  )}
                </div>

                {/* Контент отзыва */}
                <div className="p-5 flex-1 flex flex-col">
                  {/* Рейтинг */}
                  {renderStars(review.rating)}
                  
                  {/* Текст отзыва */}
                  <p className="text-gray-700 text-sm mt-3 mb-4 flex-1">
                    {review.comment}
                  </p>

                  {/* Информация о клиенте */}
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100 mt-auto">
                    <img
                      src={review.customerPhoto}
                      alt={review.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{review.name}</p>
                      <p className="text-xs text-gray-500">Проверенный покупатель</p>
                    </div>
                    {review.verified && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Индикаторы */}
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: Math.ceil(reviews.length / 4) }, (_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index * 4)}
              className={`w-2 h-2 rounded-full transition-all ${
                Math.floor(currentIndex / 4) === index
                  ? 'bg-gray-800 w-8'
                  : 'bg-gray-600/40'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Кнопка действия */}
      <div className="text-center mt-8">
        <button className="bg-gray-800 hover:bg-gray-900 text-white px-8 py-3 rounded-full font-semibold hover:shadow-xl transform hover:scale-105 transition-all">
          Создать свой постер
        </button>
      </div>
    </div>
  );
};

export default ReviewsSection;