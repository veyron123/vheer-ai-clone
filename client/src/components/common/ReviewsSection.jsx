import React, { useState, useRef, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';

const ReviewsSection = ({ customReviews }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef(null);

  // Use custom reviews if provided, otherwise use default reviews
  const reviews = customReviews || [
    {
      id: 1,
      image: '/Image for main reviews/personalized-anime-portrait-640x533.jpg', // Dragon Ball Z style art
      customerPhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face', // Male customer to match the person in photo
      name: 'Alex Thompson',
      rating: 5,
      comment: "Yooo this is sick! 🔥 Got myself as Vegeta and I'm absolutely loving it! My friends think I'm crazy but honestly this is the coolest thing on my wall. Dragon Ball Z vibes are unmatched!",
      verified: true
    },
    {
      id: 2,
      image: '/Image for main reviews/7P9-pv5kX_mid.jpg', // Romantic couple on boat
      customerPhoto: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop&crop=face', // Female customer
      name: 'Sarah Mitchell',
      rating: 5,
      comment: "This turned out so beautiful! 😍 Me and my boyfriend's anniversary photo reimagined as this elegant romantic scene. The frame quality is amazing too - it looks so professional hanging in our bedroom!",
      verified: true
    },
    {
      id: 3,
      image: '/Image for main reviews/2_3068a735-f3f5-4d52-a8dc-b7544e643a4f.webp', // Two girls with Demon Slayer style art
      customerPhoto: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face', // Female customer
      name: 'Emma Rodriguez',
      rating: 5,
      comment: "OMG me and my bestie are obsessed! 😭💕 We got ourselves as Demon Slayer characters and it's literally perfect. The artist captured our friendship so well - we both look so badass! Can't stop staring at it lol",
      verified: true
    },
    {
      id: 4,
      image: '/Image for main reviews/8ObJ2VvQD_mid.jpg', // Romantic couple in forest setting
      customerPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face', // Male customer
      name: 'Jake Wilson',
      rating: 5,
      comment: "This is absolutely stunning! Got this made for my girlfriend's birthday - we're both in this beautiful forest scene that looks like something from Studio Ghibli. She literally cried when she saw it. Worth every penny! 🌲✨",
      verified: true
    },
    {
      id: 5,
      image: '/Image for main reviews/3_6d8dc6b9-6101-48b2-bc34-32a12ea6e7b4.webp', // Guy with glasses holding anime version of himself
      customerPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face', // Male customer with glasses
      name: 'Marcus Thompson',
      rating: 5,
      comment: "Dude this is so cool! 😎 I look like some kind of anime scientist or professor in this yellow coat. My coworkers are gonna flip when they see this in my office. The detail work is incredible - even got my glasses right!",
      verified: true
    },
    {
      id: 6,
      image: '/Image for main reviews/iap_600x600.6958415160_mbxydv1x.webp', // Female AI art
      customerPhoto: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&h=80&fit=crop&crop=face', // Female customer
      name: 'Jennifer Lee',
      rating: 5,
      comment: 'Perfect birthday gift! The packaging was also top-notch.',
      verified: true
    },
    {
      id: 7,
      image: '/Image for main reviews/iap_600x600.7155436136_k76xgxhm.webp', // Female AI art
      customerPhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&crop=face', // Female customer
      name: 'Amanda Clark',
      rating: 5,
      comment: 'Incredible print quality! Ordered several posters for the office and everyone loves them!',
      verified: true
    },
    {
      id: 8,
      image: '/Image for main reviews/images.jpg', // Neutral/Male AI art
      customerPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face', // Male customer
      name: 'Robert Miller',
      rating: 5,
      comment: 'Fast, high-quality and affordable! The posters look amazing in my apartment.',
      verified: true
    },
    {
      id: 9,
      image: '/Image for main reviews/images (1).jpg', // Neutral/Male AI art  
      customerPhoto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&crop=face', // Male customer
      name: 'David Anderson',
      rating: 5,
      comment: 'Excellent work! They helped me choose the perfect size and design. Super service!',
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
          Customers Love Our AI Art!
        </h2>
        <p className="text-gray-700">
          Over 1000 happy customers worldwide
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
              className="flex-shrink-0 w-80 h-[500px] snap-center"
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
          Create Your Art
        </button>
      </div>
    </div>
  );
};

export default ReviewsSection;