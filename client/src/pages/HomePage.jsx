import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { getLanguageFromPath } from '../i18n/config';
import { useAuthStore } from '../stores/authStore';
import SEOTags from '../components/SEOTags';
import { 
  Sparkles, 
  Zap, 
  Palette, 
  Users, 
  Shield, 
  Globe,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Wand2,
  Image,
  Brush
} from 'lucide-react';

const HomePage = () => {
  const [currentFeature, setCurrentFeature] = useState(1);
  const [openFaq, setOpenFaq] = useState(null);
  const [activeCategory, setActiveCategory] = useState('anime');
  const { t } = useTranslation('home');
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();
  
  // Get current language from path
  const currentLang = getLanguageFromPath(location.pathname) || 'en';

  // Helper function to create localized links
  const createLocalizedLink = (path) => {
    return `/${currentLang}${path}`;
  };

  const aiFeatures = [
    {
      id: 1,
      title: t('features.anime_generator.title'),
      description: t('features.anime_generator.description'),
      image: '/anime-wedding.jpg',
      icon: <Wand2 className="w-5 h-5" />,
      color: 'from-pink-400 to-pink-600',
      link: '/anime-generator'
    },
    {
      id: 2,
      title: t('features.image_to_image.title'),
      description: t('features.image_to_image.description'),
      image: '/image-to-image.webp',
      icon: <Image className="w-5 h-5" />,
      color: 'from-yellow-400 to-orange-500',
      link: '/image-to-image-generator'
    },
    {
      id: 3,
      title: t('features.style_transfer.title'),
      description: t('features.style_transfer.description'),
      image: '/style-transfer.webp',
      icon: <Brush className="w-5 h-5" />,
      color: 'from-blue-400 to-cyan-500',
      link: '/image-style-transfer'
    }
  ];

  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Lightning Fast',
      description: 'Generate stunning images in seconds with our optimized AI models'
    },
    {
      icon: <Palette className="w-6 h-6" />,
      title: 'Multiple Styles',
      description: 'Choose from various artistic styles and models for unique creations'
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Community Gallery',
      description: 'Share your creations and get inspired by other artists'
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Safe & Private',
      description: 'Your data and creations are secure with enterprise-grade protection'
    }
  ];

  const examples = [
    {
      style: 'Digital Avatar',
      image: 'https://images.unsplash.com/photo-1636622433525-127afdf3662d?w=400'
    },
    {
      style: 'Anime & Manga',
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc27?w=400'
    },
    {
      style: 'Product Photo',
      image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400'
    },
    {
      style: 'Tattoo Design',
      image: 'https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?w=400'
    }
  ];

  const galleryCategories = {
    'anime': {
      name: t('categories.anime_manga'),
      images: [
        '/il_794xN.6879206739_46as.avif',
        '/il_794xN.6879206749_a1eo (1).avif',
        '/il_794xN.6831231318_lw9v.webp'
      ]
    },
    'tattoo': {
      name: t('categories.tattoo_design'),
      images: [
        'https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?w=400&h=500&fit=crop',
        'https://images.unsplash.com/photo-1567701554261-fcc289c03a36?w=400&h=500&fit=crop',
        'https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?w=400&h=500&fit=crop'
      ]
    },
    'product': {
      name: t('categories.product_photo'),
      images: [
        'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=500&fit=crop',
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=500&fit=crop',
        'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=400&h=500&fit=crop'
      ]
    },
    'wallpaper': {
      name: t('categories.wallpaper'),
      images: [
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=500&fit=crop',
        'https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=400&h=500&fit=crop',
        'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&h=500&fit=crop'
      ]
    }
  };

  const nextFeature = () => {
    setCurrentFeature((prev) => (prev === 3 ? 1 : prev + 1));
  };

  const prevFeature = () => {
    setCurrentFeature((prev) => (prev === 1 ? 3 : prev - 1));
  };

  const faqs = t('faq.questions', { returnObjects: true }) || [];

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div>
      <SEOTags
        title={t('hero.title')}
        description={t('hero.subtitle')}
        keywords="AI image generator, free online AI art, photo to anime, cartoon maker, artificial intelligence"
      />
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white py-16 lg:py-24">
        <div className="container-custom">
          {/* Title Section */}
          <div className="text-center mb-16">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
            >
{t('hero.title')}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto"
            >
{t('hero.subtitle')}
            </motion.p>
          </div>

          {/* AI Features Cards */}
          <div className="relative max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
              {aiFeatures.map((feature, index) => (
                <motion.div
                  key={feature.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.15 }}
                  className="group relative"
                >
                  <Link to={createLocalizedLink(feature.link)} className="block">
                    <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden">
                      {/* Badge */}
                      <div className={`absolute top-4 right-4 z-10 bg-gradient-to-r ${feature.color} text-white px-3 py-1 rounded-full flex items-center gap-1`}>
                        {feature.icon}
                        <span className="text-xs font-semibold uppercase tracking-wide">AI</span>
                      </div>
                      
                      {/* Title */}
                      <div className="p-6 pb-3">
                        <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                        <p className="text-gray-600 text-sm leading-relaxed mb-4">
                          {feature.description}
                        </p>
                      </div>
                      
                      {/* Image Container */}
                      <div className="relative aspect-square overflow-hidden bg-gray-100">
                        <img 
                          src={feature.image} 
                          alt={feature.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="absolute bottom-4 left-4 right-4">
                            <div className="flex items-center justify-between text-white">
                              <span className="text-sm font-medium">{t('buttons.try_now')}</span>
                              <ArrowRight className="w-5 h-5" />
                            </div>
                          </div>
                        </div>

                        {/* Arrow Navigation for Mobile */}
                        {index === 1 && (
                          <>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                prevFeature();
                              }}
                              className="md:hidden absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg"
                            >
                              <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                nextFeature();
                              }}
                              className="md:hidden absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg"
                            >
                              <ChevronRight className="w-5 h-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Desktop Navigation Arrows */}
            <button
              onClick={prevFeature}
              className="hidden md:block absolute left-0 lg:-left-12 top-1/2 -translate-y-1/2 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-shadow"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={nextFeature}
              className="hidden md:block absolute right-0 lg:-right-12 top-1/2 -translate-y-1/2 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-shadow"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="flex justify-center mt-12"
          >
            <Link to={createLocalizedLink('/image-style-transfer')} className="btn btn-primary text-lg px-8 py-4">
              <Sparkles className="w-5 h-5 mr-2" />
              {t('buttons.start_creating')}
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Magic of AI Section */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="container-custom">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl md:text-5xl font-bold mb-4"
            >
              {t('sections.magic_title')}
              <br />
              {t('sections.magic_subtitle')}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-lg text-gray-600 max-w-4xl mx-auto leading-relaxed"
            >
              {t('sections.magic_description')}
            </motion.p>
          </div>

          {/* Photo to Anime Converter */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-6xl mx-auto"
          >
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Text Content */}
              <div className="order-2 lg:order-1">
                <h3 className="text-3xl md:text-4xl font-bold mb-6 text-gray-800">
                  {t('sections.anime_converter.title')}
                </h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  {t('sections.anime_converter.description1')}
                </p>
                <p className="text-gray-600 leading-relaxed mb-8">
                  {t('sections.anime_converter.description2')}
                </p>
                <Link 
                  to={createLocalizedLink('/anime-generator')} 
                  className="btn btn-primary inline-flex items-center text-lg"
                >
                  {t('buttons.try_anime_converter')}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </div>

              {/* Image Showcase */}
              <div className="order-1 lg:order-2">
                <div className="relative">
                  {/* Main Container with gradient background */}
                  <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-purple-400 via-pink-300 to-blue-300 p-1">
                    <div className="bg-white rounded-3xl overflow-hidden">
                      {/* Single Anime Transformation Image */}
                      <div className="relative aspect-[4/3] bg-gradient-to-br from-purple-100 to-pink-100">
                        <img 
                          src="/Screenshot (59).png"
                          alt="Transform your photo into Ghibli masterpiece"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Decorative Elements */}
                  <div className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full blur-3xl opacity-30"></div>
                  <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full blur-3xl opacity-30"></div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Professional Headshots Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-6xl mx-auto mt-20"
          >
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Image Showcase */}
              <div className="order-2 lg:order-1">
                <div className="relative">
                  {/* Main Container */}
                  <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-blue-100 to-purple-200 p-1">
                    <div className="bg-white rounded-3xl overflow-hidden">
                      {/* Single Image to Image Transformation */}
                      <div className="relative aspect-[4/3] bg-gradient-to-br from-blue-50 to-purple-100">
                        <img 
                          src="/il_794xN.6989129759_igne.webp"
                          alt="AI Image to Image transformation example"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Decorative Elements */}
                  <div className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full blur-3xl opacity-20"></div>
                  <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full blur-3xl opacity-20"></div>
                </div>
              </div>

              {/* Text Content */}
              <div className="order-1 lg:order-2">
                <h3 className="text-3xl md:text-4xl font-bold mb-6 text-gray-800">
                  {t('sections.headshots.title')}
                </h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  {t('sections.headshots.description1')}
                </p>
                <p className="text-gray-600 leading-relaxed mb-8">
                  {t('sections.headshots.description2')}
                </p>
                <Link 
                  to={createLocalizedLink('/image-to-image-generator')} 
                  className="btn btn-primary inline-flex items-center text-lg"
                >
                  {t('buttons.create_headshot')}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </div>
            </div>
          </motion.div>

          {/* AI Tattoo Generator Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-6xl mx-auto mt-20"
          >
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Text Content */}
              <div className="order-2 lg:order-1">
                <h3 className="text-3xl md:text-4xl font-bold mb-6 text-gray-800">
                  {t('sections.tattoo.title')}
                </h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  {t('sections.tattoo.description1')}
                </p>
                <p className="text-gray-600 leading-relaxed mb-8">
                  {t('sections.tattoo.description2')}
                </p>
                <Link 
                  to={createLocalizedLink('/style-transfer')} 
                  className="btn btn-primary inline-flex items-center text-lg"
                >
                  {t('buttons.design_tattoo')}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </div>

              {/* Image Showcase */}
              <div className="order-1 lg:order-2">
                <div className="relative">
                  {/* Main Container */}
                  <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-purple-100 to-orange-200 p-1">
                    <div className="bg-white rounded-3xl overflow-hidden">
                      {/* Single Style Transfer Example */}
                      <div className="relative aspect-[4/3] bg-gradient-to-br from-purple-50 to-orange-100">
                        <img 
                          src="/image-to-image-ai-generator.avif"
                          alt="AI Style Transfer artistic transformation example"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Decorative Elements */}
                  <div className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full blur-3xl opacity-20"></div>
                  <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full blur-3xl opacity-20"></div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Gallery Categories Section */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="container-custom">
          <div className="text-center mb-12">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl md:text-5xl font-bold mb-4"
            >
              {t('sections.gallery_title')}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-lg text-gray-600 max-w-3xl mx-auto"
            >
              {t('sections.gallery_description')}
            </motion.p>
          </div>

          {/* Category Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-wrap justify-center gap-3 mb-12"
          >
            {Object.entries(galleryCategories).map(([key, category]) => (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                className={`px-6 py-3 rounded-full font-medium transition-all ${
                  activeCategory === key
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg transform scale-105'
                    : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-md'
                }`}
              >
                {category.name}
              </button>
            ))}
          </motion.div>

          {/* Gallery Grid */}
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="max-w-5xl mx-auto"
          >
            <div className="grid md:grid-cols-3 gap-6">
              {galleryCategories[activeCategory].images.map((image, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="group relative"
                >
                  <div className="relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300">
                    <img 
                      src={image} 
                      alt={`${galleryCategories[activeCategory].name} example ${index + 1}`}
                      className="w-full aspect-square object-contain group-hover:scale-110 transition-transform duration-500"
                    />
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-4 left-4 right-4">
                        <p className="text-white font-medium mb-2">{galleryCategories[activeCategory].name}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-white/80 text-sm">AI Generated</span>
                          <Link 
                            to={activeCategory === 'anime' ? createLocalizedLink('/anime-generator') : createLocalizedLink('/image-style-transfer')} 
                            className="text-white bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm hover:bg-white/30 transition-colors"
                          >
                            {t('buttons.try_now')} →
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

        </div>
      </section>

      {/* Features Section */}
      {/* <section className="py-20 bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Why Choose СolibRRRi?</h2>
            <p className="text-xl text-gray-600">Powerful features to bring your imagination to life</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="card p-6 hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section> */}

      {/* Examples Section */}
      {/* <section className="py-20 bg-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Preview What's Possible</h2>
            <p className="text-xl text-gray-600">
              Turn your ideas into stunning visuals with our generative AI
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {examples.map((example, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group cursor-pointer"
              >
                <div className="relative rounded-xl overflow-hidden">
                  <img 
                    src={example.image} 
                    alt={example.style}
                    className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-4 left-4 text-white">
                      <p className="font-semibold">{example.style}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/gallery" className="btn btn-primary">
              View More Examples
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>
      </section> */}

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-4xl font-bold mb-4"
              >
                {t('faq.title')}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-xl text-gray-600"
              >
                {t('faq.subtitle')}
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-4"
            >
              {faqs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-lg font-medium text-gray-800 pr-4">
                      {index + 1}. {faq.question}
                    </span>
                    <motion.div
                      animate={{ rotate: openFaq === index ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex-shrink-0"
                    >
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    </motion.div>
                  </button>
                  
                  <AnimatePresence>
                    {openFaq === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-5 pt-0">
                          <p className="text-gray-600 leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </motion.div>

            {/* <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="text-center mt-12"
            >
              <p className="text-gray-600 mb-4">
                {t('faq.support.text')}
              </p>
              <Link 
                to={createLocalizedLink('/contact')} 
                className="btn btn-outline inline-flex items-center"
              >
                {t('faq.support.button')}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </motion.div> */}
          </div>
        </div>
      </section>

      {/* CTA Section - Show only for non-authenticated users */}
      {!isAuthenticated && (
        <section className="py-20 bg-gradient-to-r from-primary-500 to-primary-600">
          <div className="container-custom text-center">
            <h2 className="text-4xl font-bold text-white mb-4">
              {t('cta.title')}
            </h2>
            <p className="text-xl text-white/90 mb-8">
              {t('cta.subtitle')}
            </p>
            <Link to={createLocalizedLink('/register')} className="btn bg-white text-primary-600 hover:bg-gray-100 text-lg px-8 py-4">
              {t('cta.button')}
              <Sparkles className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </section>
      )}
    </div>
  );
};

export default HomePage;