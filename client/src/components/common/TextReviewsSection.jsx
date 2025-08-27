import React from 'react';
import { Star, CheckCircle } from 'lucide-react';

const TextReviewsSection = () => {
  // Заглушки для отзывов с фото работ
  const reviews = [
    {
      id: 1,
      name: 'Анна К.',
      date: '21.08.2024',
      rating: 5,
      comment: 'Спасибо за потрясающую работу! Заказывала портрет из фотографии любимой собаки. Качество печати превосходное, цвета яркие. Рамка тоже отличная!',
      images: [
        'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=500&fit=crop',
      ],
      size: '12" × 18" / Unframed',
      verified: true
    },
    {
      id: 2,
      name: 'Дмитрий П.',
      date: '19.08.2024',
      rating: 5,
      comment: 'Отличное качество! Делал постер с семейной фотографии на годовщину. Жена в восторге. Доставка быстрая, упаковка надежная.',
      images: [
        'https://images.unsplash.com/photo-1511732351157-1865efcb7b7b?w=400&h=500&fit=crop',
        'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=400&h=500&fit=crop',
      ],
      size: '8" × 10" / Unframed',
      verified: true
    },
    {
      id: 3,
      name: 'Мария С.',
      date: '15.08.2024',
      rating: 5,
      comment: 'Заказывала несколько постеров для офиса. Все пришло в идеальном состоянии. Качество печати на высоте, цвета насыщенные. Рекомендую!',
      images: [
        'https://images.unsplash.com/photo-1494253109108-2e30c049369b?w=400&h=500&fit=crop',
      ],
      size: '16" × 20" / Black Frame',
      verified: true
    },
    {
      id: 4,
      name: 'Алексей В.',
      date: '12.08.2024',
      rating: 5,
      comment: 'Превосходно! Постер выглядит точно как на превью. Материал качественный, печать четкая. Буду заказывать еще.',
      images: [
        'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&h=500&fit=crop',
        'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=400&h=500&fit=crop',
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=500&fit=crop',
      ],
      size: '24" × 36" / White Frame',
      verified: true
    },
    {
      id: 5,
      name: 'Елена М.',
      date: '08.08.2024',
      rating: 5,
      comment: 'Очень довольна! Делала постеры для детской комнаты. Яркие, красочные, дети в восторге. Качество отличное.',
      images: [
        'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=400&h=500&fit=crop',
      ],
      size: '12" × 12" / Unframed',
      verified: true
    },
    {
      id: 6,
      name: 'Виктор К.',
      date: '05.08.2024',
      rating: 5,
      comment: 'Заказал серию постеров для гостиной. Все выполнено на высшем уровне. Цвета точные, качество печати превосходное. Спасибо!',
      images: [
        'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=500&fit=crop',
      ],
      size: '18" × 24" / Black Frame',
      verified: true
    }
  ];

  // Функция для отрисовки звезд
  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }, (_, index) => (
          <Star
            key={index}
            className={`w-4 h-4 ${
              index < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Заголовок с рейтингом */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {renderStars(5)}
            <span className="text-gray-600">2,875 Reviews</span>
            <button className="text-gray-600 hover:text-gray-800">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          <button className="text-gray-600 hover:text-gray-800 font-medium">
            Write a review
          </button>
        </div>
      </div>

      {/* Сетка отзывов */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review) => (
            <div key={review.id} className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Изображения работ */}
              <div className="bg-gray-100">
                {review.images.length === 1 ? (
                  <img
                    src={review.images[0]}
                    alt="Customer artwork"
                    className="w-full h-64 object-cover"
                  />
                ) : review.images.length === 2 ? (
                  <div className="grid grid-cols-2 gap-1">
                    {review.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt="Customer artwork"
                        className="w-full h-32 object-cover"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-1">
                    <img
                      src={review.images[0]}
                      alt="Customer artwork"
                      className="col-span-2 w-full h-32 object-cover"
                    />
                    {review.images.slice(1, 3).map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt="Customer artwork"
                        className="w-full h-32 object-cover"
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Информация об отзыве */}
              <div className="p-4">
                {/* Имя и дата */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{review.name}</span>
                    {review.verified && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                  <span className="text-sm text-gray-500">{review.date}</span>
                </div>

                {/* Рейтинг */}
                {renderStars(review.rating)}

                {/* Размер */}
                {review.size && (
                  <p className="text-xs text-gray-500 mt-2">
                    Size: {review.size}
                  </p>
                )}

                {/* Текст отзыва */}
                <p className="text-sm text-gray-700 mt-3 line-clamp-4">
                  {review.comment}
                </p>

                {/* Метка проверенной покупки */}
                {review.verified && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      The General - Custom Pet Canvas
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Кнопка загрузить еще */}
        <div className="text-center mt-8">
          <button className="px-8 py-3 border-2 border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors">
            Load More Reviews
          </button>
        </div>
      </div>
    </div>
  );
};

export default TextReviewsSection;