import React, { useState, useRef, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';

const PetPortraitReviewsSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef(null);

  // Pet Portrait specific reviews with customer artwork
  const reviews = [
    {
      id: 2,
      image: '/Review Pet Portraits/Z5XXEZckp.jpg', // Pitbull in tuxedo portrait displayed in dining room
      name: 'Lisa Chen',
      rating: 5,
      comment: "Love this! My pit bull looks so classy in his formal portrait hanging in the dining room.",
      verified: true
    },
    {
      id: 7,
      image: '/Review Pet Portraits/iap_600x600.6829780242_44gr63cs.webp', // Cat portrait
      name: 'Rachel Brown',
      rating: 5,
      comment: 'Print quality is amazing! Colors are so vibrant and shipped super fast.',
      verified: true
    },
    {
      id: 8,
      image: '/Review Pet Portraits/iap_600x600.6844417521_i6xbupdu.avif', // Pet portrait
      name: 'Chris Taylor',
      rating: 5,
      comment: 'Good price and customer service helped with sizing. Really happy with it!',
      verified: true
    },
    {
      id: 9,
      image: '/Review Pet Portraits/iap_600x600.6743113928_6ne9kycw.webp', // Chihuahua in royal attire
      name: 'Maria Rodriguez',
      rating: 5,
      comment: 'My little Boy looks like royalty in this portrait! The golden mantle and attention to detail are absolutely stunning. Perfect gift for my family.',
      verified: true
    },
    {
      id: 10,
      image: '/Review Pet Portraits/iap_600x600.6748630512_a0de9atj.webp', // Cat in golden dress
      name: 'Emma Thompson',
      rating: 5,
      comment: 'The way my cat is portrayed in this golden Renaissance dress is magnificent! The pearl necklace and embroidery details make her look like true nobility.',
      verified: true
    },
    {
      id: 11,
      image: '/Review Pet Portraits/iap_600x600.6794317956_bb5x84hd.webp', // Dachshund in military uniform
      name: 'Robert Miller',
      rating: 5,
      comment: 'My Dachshund has never looked more distinguished! The military uniform with medals captures his personality perfectly. Outstanding artwork quality.',
      verified: true
    },
    {
      id: 14,
      image: '/Review Pet Portraits/iap_600x600.6748630512_a0de9atj.webp', // Calico cat in golden Renaissance dress
      name: 'Jennifer Walsh',
      rating: 5,
      comment: 'My calico cat looks absolutely majestic in this golden Renaissance gown! The intricate embroidery and pearl necklace make her look like she stepped out of a royal portrait.',
      verified: true
    },
    {
      id: 15,
      image: '/Review Pet Portraits/zDkwY5qlR.jpg', // Cocker Spaniel in green military uniform
      name: 'Michael Thompson',
      rating: 5,
      comment: 'My Cocker Spaniel looks so proud and noble in this green military uniform! The golden epaulets and medals perfectly capture his distinguished personality.',
      verified: true
    },
    {
      id: 16,
      image: '/Review Pet Portraits/i0h5WWz0Q.jpg', // Akita in white lace Renaissance dress
      name: 'Hiroshi Tanaka',
      rating: 5,
      comment: 'My Akita looks absolutely beautiful in this elegant white lace Renaissance gown. The delicate ruffled collar and graceful pose capture her noble spirit perfectly.',
      verified: true
    },
    {
      id: 17,
      image: '/Review Pet Portraits/iap_600x600.6829780242_44gr63cs.webp', // Tuxedo cat in luxurious Renaissance dress
      name: 'Catherine Dubois',
      rating: 5,
      comment: 'My tuxedo cat looks absolutely stunning in this luxurious Renaissance gown with intricate gold embroidery. The attention to detail in every whisker is remarkable!',
      verified: true
    }
  ];

  // Автоматическая прокрутка
  useEffect(() => {
    const timer = setInterval(() => {
      handleNext();
    }, 5000);

    return () => clearInterval(timer);
  }, []);  // Убираем currentIndex из зависимостей для правильной работы

  const handlePrev = () => {
    setCurrentIndex((prev) => {
      const newIndex = prev === 0 ? reviews.length - 1 : prev - 1;
      scrollToIndex(newIndex);
      return newIndex;
    });
  };

  const handleNext = () => {
    setCurrentIndex((prev) => {
      const newIndex = prev === reviews.length - 1 ? 0 : prev + 1;
      scrollToIndex(newIndex);
      return newIndex;
    });
  };

  // Функция для плавной прокрутки к определенному индексу
  const scrollToIndex = (index) => {
    if (scrollRef.current) {
      const cardWidth = 320; // width + gap
      const scrollPosition = index * cardWidth;
      scrollRef.current.scrollTo({ left: scrollPosition, behavior: 'smooth' });
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
          Pet Owners Love Our AI Portraits!
        </h2>
        <p className="text-gray-700">
          Over 1000 happy pet parents worldwide
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
          {/* Дублируем отзывы для бесконечной прокрутки */}
          {[...reviews, ...reviews].map((review, index) => (
            <div
              key={`${review.id}-${Math.floor(index / reviews.length)}`}
              className="flex-shrink-0 w-80 h-[450px] snap-center"
            >
              {/* Карточка отзыва */}
              <div className="bg-white rounded-xl overflow-hidden shadow-xl h-full flex flex-col">
                {/* Изображение работы */}
                <div className="relative h-64 bg-gray-200">
                  <img
                    src={review.image}
                    alt="Pet portrait artwork"
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
                  <div className="flex items-center justify-center gap-2 pt-3 border-t border-gray-100 mt-auto">
                    <div className="flex-1 text-center">
                      <p className="text-sm font-medium text-gray-900">{review.name}</p>
                      <p className="text-xs text-gray-500">Verified Customer</p>
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
          {reviews.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentIndex(index);
                scrollToIndex(index);
              }}
              className={`w-2 h-2 rounded-full transition-all ${
                currentIndex % reviews.length === index
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
          Create Your Pet Portrait
        </button>
      </div>
    </div>
  );
};

export default PetPortraitReviewsSection;