import React, { useState, useRef, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';

const PetPortraitReviewsSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef(null);

  // Pet Portrait specific reviews with customer artwork
  const reviews = [
    {
      id: 1,
      image: '/Review Pet Portraits/MycDB-Kd2_mid.jpg', // Golden doodle with newspaper portrait
      customerPhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face', // Male customer
      name: 'Mike Johnson',
      rating: 5,
      comment: "😂 Perfect bathroom art! My dog reading the newspaper on the toilet is hilarious. Guests love it.",
      verified: true
    },
    {
      id: 2,
      image: '/Review Pet Portraits/Z5XXEZckp.jpg', // Pitbull in tuxedo portrait displayed in dining room
      customerPhoto: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop&crop=face', // Female customer
      name: 'Lisa Chen',
      rating: 5,
      comment: "Love this! My pit bull looks so classy in his formal portrait hanging in the dining room.",
      verified: true
    },
    {
      id: 3,
      image: '/Review Pet Portraits/2dBi0csWn.jpg', // Two cats with portrait
      customerPhoto: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face', // Female customer
      name: 'Jessica Martinez',
      rating: 5,
      comment: "Super cute! My cat looks amazing in this style. Great quality and fast delivery!",
      verified: true
    },
    {
      id: 4,
      image: '/Review Pet Portraits/Vuq5H8nMQ.jpg', // Dog reading newspaper portrait on wall
      customerPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face', // Male customer
      name: 'Tom Wilson',
      rating: 5,
      comment: "Wife loves it now too 😄 Our golden retriever reading the news is the perfect conversation starter.",
      verified: true
    },
    {
      id: 5,
      image: '/Review Pet Portraits/i0h5WWz0Q.jpg', // Small dog with newspaper portrait
      customerPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face', // Male customer with glasses
      name: 'David Kim',
      rating: 5,
      comment: "My little dog looks so serious with his newspaper 🤓 Quality is great, ordering another one!",
      verified: true
    },
    {
      id: 6,
      image: '/Review Pet Portraits/zDkwY5qlR.jpg', // Puppy portrait on wood wall
      customerPhoto: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&h=80&fit=crop&crop=face', // Female customer
      name: 'Amy Davis',
      rating: 5,
      comment: 'Beautiful quality print. This puppy portrait brings back great memories of my dad.',
      verified: true
    },
    {
      id: 7,
      image: '/Review Pet Portraits/iap_600x600.6829780242_44gr63cs.webp', // Cat portrait
      customerPhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&crop=face', // Female customer
      name: 'Rachel Brown',
      rating: 5,
      comment: 'Print quality is amazing! Colors are so vibrant and shipped super fast.',
      verified: true
    },
    {
      id: 8,
      image: '/Review Pet Portraits/iap_600x600.6844417521_i6xbupdu.avif', // Pet portrait
      customerPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face', // Male customer
      name: 'Chris Taylor',
      rating: 5,
      comment: 'Good price and customer service helped with sizing. Really happy with it!',
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
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100 mt-auto">
                    <img
                      src={review.customerPhoto}
                      alt={review.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div className="flex-1">
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
          Create Your Pet Portrait
        </button>
      </div>
    </div>
  );
};

export default PetPortraitReviewsSection;