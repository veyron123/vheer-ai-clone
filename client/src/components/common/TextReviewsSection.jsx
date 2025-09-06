import React, { useState } from 'react';
import { Star, CheckCircle } from 'lucide-react';

const TextReviewsSection = () => {
  const [showAll, setShowAll] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // Sample reviews with customer AI artwork
  const reviews = [
    {
      id: 1,
      name: 'Sarah Johnson',
      date: '08.21.2024',
      rating: 5,
      comment: "Wow, this is so cool! My boyfriend and I got this anime poster made from our photo and we're both obsessed 😍 It looks just like us but in that romantic anime style. Honestly way better than I expected!",
      images: [
        '/Images for second section review/1_f2bc78a6-a0b8-4298-a655-45aa09895cad.webp',
      ],
      verified: true
    },
    {
      id: 2,
      name: 'Michael Davis',
      date: '08.19.2024',
      rating: 5,
      comment: "Got this made for our 2nd anniversary since we got engaged at Golden Gate Bridge. My fiancée cried happy tears when she saw it! They really captured that special moment perfectly.",
      images: [
        '/Images for second section review/image_4_9_.jpg',
      ],
      verified: true
    },
    {
      id: 3,
      name: 'Emily Rodriguez',
      date: '08.15.2024',
      rating: 5,
      comment: "Ordered this as a surprise for my bf's birthday and he LOVES it! He keeps showing it to everyone who comes over lol. The cartoon style is so cute and looks exactly like him.",
      images: [
        '/Images for second section review/images (3).jpg',
      ],
      verified: true
    },
    {
      id: 4,
      name: 'James Wilson',
      date: '08.12.2024',
      rating: 5,
      comment: "This turned out amazing! My girlfriend and I are planning a trip to Japan so we wanted something with that vibe. The artist nailed it - we look so cute in this style and the background is gorgeous.",
      images: [
        '/Images for second section review/Screenshot_2024-11-04_at_10.00.04.webp',
      ],
      verified: true
    },
    {
      id: 5,
      name: 'Lisa Thompson',
      date: '08.08.2024',
      rating: 5,
      comment: "Finally got some nice art for my apartment! I wasn't sure how it would turn out but this is perfect. The colors are so pretty and it makes my room feel more personal.",
      verified: true
    },
    {
      id: 6,
      name: 'Robert Miller',
      date: '08.05.2024',
      rating: 5,
      comment: "Haha my friends think this is hilarious! Got myself turned into an anime character and it actually looks pretty cool. Definitely gonna order one of my dog next 😂",
      images: [
        '/Images for second section review/v8MtugJ4jB_mid.jpg',
      ],
      verified: true
    }
  ];

  // Additional reviews that appear when "Load More" is clicked
  const additionalReviews = [
    {
      id: 7,
      name: 'Jennifer Lee',
      date: '08.02.2024',
      rating: 5,
      comment: "OMG I got my cat turned into anime style and it's the cutest thing ever! My friends keep asking where I got it done. Already thinking about getting one of my other pets too 🐱",
      verified: true
    },
    {
      id: 8,
      name: 'David Anderson',
      date: '07.30.2024',
      rating: 5,
      comment: "Did a whole family set for Christmas gifts and everyone was so excited! My kids especially love seeing themselves as anime characters. Might make this a yearly tradition tbh.",
      verified: true
    },
    {
      id: 9,
      name: 'Amanda Clark',
      date: '07.28.2024',
      rating: 5,
      comment: "My 8 year old daughter has been obsessed with Disney princesses lately so this was perfect! She literally squealed when she saw herself as one. Now she wants one for her room too 👸",
      verified: true
    }
  ];

  // Handle load more functionality
  const handleLoadMore = async () => {
    setIsLoading(true);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setShowAll(true);
    setIsLoading(false);
  };

  // Get reviews to display
  const displayedReviews = showAll ? [...reviews, ...additionalReviews] : reviews;

  // Function to render stars
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
          {displayedReviews.map((review) => (
            <div key={review.id} className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Customer artwork images - only show first image if images exist */}
              {review.images && review.images.length > 0 && (
                <div className="bg-gray-100">
                  <img
                    src={review.images[0]}
                    alt="Customer artwork"
                    className="w-full h-64 object-cover"
                  />
                </div>
              )}

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

                {/* Текст отзыва */}
                <p className="text-sm text-gray-700 mt-3 line-clamp-4">
                  {review.comment}
                </p>

                {/* Метка проверенной покупки */}
                {review.verified && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      AI Art Generator - Custom Creation
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Load More Button */}
        {!showAll && (
          <div className="text-center mt-8">
            <button 
              onClick={handleLoadMore}
              disabled={isLoading}
              className="px-8 py-3 border-2 border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mx-auto gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  Loading...
                </>
              ) : (
                'Load More Reviews'
              )}
            </button>
          </div>
        )}
        
        {/* Show less button when all reviews are displayed */}
        {showAll && (
          <div className="text-center mt-8">
            <button 
              onClick={() => setShowAll(false)}
              className="px-8 py-3 border-2 border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Show Less Reviews
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TextReviewsSection;