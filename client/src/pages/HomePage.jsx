import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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

  const aiFeatures = [
    {
      id: 1,
      title: 'Anime Portrait Generator',
      description: 'Turn selfies into stunning anime artwork instantly. Pick your favorite style and watch AI bring your character to life.',
      image: '/anime-wedding.jpg',
      icon: <Wand2 className="w-5 h-5" />,
      color: 'from-pink-400 to-pink-600',
      link: '/anime-generator'
    },
    {
      id: 2,
      title: 'AI Image to Image Generator',
      description: 'Reimagine any photo with AI magic. Keep facial features intact while exploring endless creative possibilities.',
      image: '/image-to-image.webp',
      icon: <Image className="w-5 h-5" />,
      color: 'from-yellow-400 to-orange-500',
      link: '/generate'
    },
    {
      id: 3,
      title: 'AI Style Transfer',
      description: 'Blend art movements with your photos. From Van Gogh brushstrokes to futuristic cyberpunk aesthetics in seconds.',
      image: '/style-transfer.webp',
      icon: <Brush className="w-5 h-5" />,
      color: 'from-blue-400 to-cyan-500',
      link: '/generate'
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
    'digital': {
      name: 'Digital Avatar',
      images: [
        'https://images.unsplash.com/photo-1636622433525-127afdf3662d?w=400&h=500&fit=crop',
        'https://images.unsplash.com/photo-1635322966219-b75ed372eb01?w=400&h=500&fit=crop',
        'https://images.unsplash.com/photo-1633177317976-3f9bc45e1d1d?w=400&h=500&fit=crop'
      ]
    },
    'anime': {
      name: 'Anime & Manga',
      images: [
        'https://images.unsplash.com/photo-1578662996442-48f60103fc27?w=400&h=500&fit=crop',
        'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=400&h=500&fit=crop',
        'https://images.unsplash.com/photo-1578632292335-df3abbb0d586?w=400&h=500&fit=crop'
      ]
    },
    'tattoo': {
      name: 'Tattoo Design',
      images: [
        'https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?w=400&h=500&fit=crop',
        'https://images.unsplash.com/photo-1567701554261-fcc289c03a36?w=400&h=500&fit=crop',
        'https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?w=400&h=500&fit=crop'
      ]
    },
    'product': {
      name: 'Product Photo',
      images: [
        'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=500&fit=crop',
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=500&fit=crop',
        'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=400&h=500&fit=crop'
      ]
    },
    'wallpaper': {
      name: 'Wallpaper',
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

  const faqs = [
    {
      question: "How Does the Anime Portrait Generator Work?",
      answer: "Our anime portrait generator uses advanced AI algorithms to transform your photos into anime-style artwork. Simply upload your photo, select your preferred style, and our AI will analyze facial features, expressions, and characteristics to create a unique anime version while maintaining your identity."
    },
    {
      question: "Do I Need Design Skills to Create AI Anime Portraits?",
      answer: "No design skills are required! Our user-friendly interface makes it easy for anyone to create professional-quality anime portraits. Just upload your photo, choose from our preset styles or customize your preferences, and let the AI do the work for you."
    },
    {
      question: "What is an AI Headshot Generator?",
      answer: "An AI headshot generator is a tool that creates professional-looking portrait photos using artificial intelligence. It can transform casual photos into polished headshots suitable for LinkedIn profiles, resumes, or professional portfolios, all without the need for a photo studio."
    },
    {
      question: "What Can I Create with an AI Headshot Generator?",
      answer: "You can create professional business headshots, creative portraits for social media, avatar images for gaming profiles, artistic interpretations of your photos, and customized profile pictures for various platforms. The possibilities are endless with different styles and customization options."
    },
    {
      question: "What Type of Photos Work Best for the AI Headshot Generator?",
      answer: "Clear, front-facing photos with good lighting work best. The ideal photo should show your face clearly with minimal obstructions, have even lighting without harsh shadows, be in focus and high resolution, and preferably have a simple background for best results."
    },
    {
      question: "Is Your AI Tattoo Generator Free to Use?",
      answer: "Yes! Our basic AI tattoo generator is completely free to use. You can create unlimited tattoo designs, explore various styles, and download your creations without any charges. Premium features are available for users who want advanced customization options."
    },
    {
      question: "Can I Design a Custom Tattoo with the AI Tattoo Generator?",
      answer: "Absolutely! Our AI tattoo generator allows full customization. You can specify design elements, choose artistic styles, adjust size and complexity, combine multiple concepts, and even upload reference images to guide the AI in creating your perfect tattoo design."
    },
    {
      question: "What is Vheer Text to Image?",
      answer: "Vheer Text to Image is our flagship feature that converts written descriptions into stunning visual artwork. Using state-of-the-art AI models, it interprets your text prompts and generates unique, high-quality images that match your vision, from realistic photos to abstract art."
    },
    {
      question: "What Makes Vheer Text to Image Generator Different?",
      answer: "Vheer stands out with its intuitive interface, diverse style options, fast generation speed, high-resolution outputs, and unlimited free generations. We also offer advanced features like style mixing, prompt enhancement, and batch generation for power users."
    },
    {
      question: "How Does Vheer Ensure My Data Privacy and Security?",
      answer: "We take privacy seriously. All uploaded images are encrypted during transmission, processed securely on our servers, automatically deleted after processing, never shared with third parties, and you retain full ownership of all generated content. We comply with GDPR and other data protection regulations."
    }
  ];

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div>
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
              Free Online <span className="text-gradient">AI Image</span>
              <br />
              Generator
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto"
            >
              Convert simple text or ordinary photos into breathtaking masterpieces with our free
              online AI image generators. Instantly generate AI artworks at your fingertips like a pro!
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
                  <Link to={feature.link} className="block">
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
                              <span className="text-sm font-medium">Try Now</span>
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

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mt-12"
          >
            <Link to="/generate" className="btn btn-primary text-lg px-8 py-4">
              <Sparkles className="w-5 h-5 mr-2" />
              Start Creating for Free
            </Link>
            <Link to="/gallery" className="btn btn-outline text-lg px-8 py-4">
              Explore Gallery
              <ArrowRight className="w-5 h-5 ml-2" />
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
              The Magic Of AI Image Generation
              <br />
              For Everyone
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-lg text-gray-600 max-w-4xl mx-auto leading-relaxed"
            >
              Unleash your creativity with AI image generation technology on Vheer! Create stunning visuals in seconds by simply
              describing what you want or customizing your preference. Whether you're designing unique anime avatars,
              enhancing existing photos, or generating realistic scenes, our generative AI can bring your ideas to life. With AI image
              generation, everyone has the power to produce high-quality, original images for any project or purpose.
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
                  100% Free Photo to Anime Converter
                </h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  Transform your selfie or profile picture into anime-style art for free with our
                  anime portrait generator. Simply upload your photo, add a few prompts to
                  describe your preferences, and let our AI art generator work its magic.
                </p>
                <p className="text-gray-600 leading-relaxed mb-8">
                  Whether you want a Chibi, Waifu, Classic, Shonen, Fantasy, Cyberpunk,
                  Gothic, Realistic, Historical, or Romantic anime portrait, our tool brings your
                  vision to life with vibrant, personalized anime art—no hidden fees, no limits.
                </p>
                <Link 
                  to="/anime-generator" 
                  className="btn btn-primary inline-flex items-center text-lg"
                >
                  Try Anime Converter
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </div>

              {/* Image Showcase */}
              <div className="order-1 lg:order-2">
                <div className="relative">
                  {/* Main Container with gradient background */}
                  <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-purple-400 via-pink-300 to-blue-300 p-1">
                    <div className="bg-white rounded-3xl overflow-hidden">
                      <div className="grid grid-cols-2 gap-0">
                        {/* Left Anime Image */}
                        <div className="relative aspect-[3/4] bg-gradient-to-br from-purple-200 to-pink-200">
                          <img 
                            src="https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=400&h=500&fit=crop"
                            alt="Anime style portrait 1"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        {/* Right Anime Image */}
                        <div className="relative aspect-[3/4] bg-gradient-to-br from-blue-200 to-purple-200">
                          <img 
                            src="https://images.unsplash.com/photo-1578662996442-48f60103fc27?w=400&h=500&fit=crop"
                            alt="Anime style portrait 2"
                            className="w-full h-full object-cover"
                          />
                          
                          {/* Small Original Photo Overlay */}
                          <div className="absolute bottom-4 right-4 w-20 h-20 rounded-lg overflow-hidden border-2 border-white shadow-lg">
                            <img 
                              src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop"
                              alt="Original photo"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
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
                  <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 p-1">
                    <div className="bg-white rounded-3xl overflow-hidden">
                      <div className="grid grid-cols-2 gap-0">
                        {/* Left Professional Headshot */}
                        <div className="relative aspect-[3/4] bg-gradient-to-br from-gray-50 to-gray-100">
                          <img 
                            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop"
                            alt="Professional headshot in suit"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        {/* Right Professional Headshot */}
                        <div className="relative aspect-[3/4] bg-gradient-to-br from-green-50 to-green-100">
                          <img 
                            src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop"
                            alt="Professional headshot casual"
                            className="w-full h-full object-cover"
                          />
                          
                          {/* Small Original Photo Overlay */}
                          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-20 h-20 rounded-lg overflow-hidden border-3 border-white shadow-xl">
                            <img 
                              src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop"
                              alt="Original photo"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
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
                  Professional Headshots for Personal or Brand Use
                </h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  Want to look more professional and attractive on your social media? Our AI-powered 
                  headshot generator lets you transform your photo into a polished, business-ready 
                  portrait in just a few steps. Get free AI to generate headshots for your LinkedIn, 
                  INS, FB, or website profile.
                </p>
                <p className="text-gray-600 leading-relaxed mb-8">
                  Don't worry about any imperfections in your original photo; we will replace it with a 
                  clean background, perfect lights, a cool hairstyle, and confident facial features. 
                  With customizable features and instant results, achieving a standout professional 
                  image has never been easier.
                </p>
                <Link 
                  to="/generate" 
                  className="btn btn-primary inline-flex items-center text-lg"
                >
                  Create Professional Headshot
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
                  Visualize Your Body Art with AI Tattoo Generator
                </h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  Unleash your creativity and design custom tattoos like never before with our AI 
                  Tattoo Generator. This powerful, free tool allows you to transform your ideas 
                  into striking body art - from intricate symbols to large, detailed designs.
                </p>
                <p className="text-gray-600 leading-relaxed mb-8">
                  Whether you're envisioning a traditional wolf tattoo, a delicate butterfly, or a 
                  timeless rose, our AI image generator can bring your vision to life with ease. 
                  You can customize your tattoo for any body part — whether it's your forearm, 
                  wrist, finger, or spine — and experiment with different styles and themes to 
                  create something truly unique. With the AI Tattoo Generator, designing your 
                  perfect tattoo has never been more effortless or exciting!
                </p>
                <Link 
                  to="/generate" 
                  className="btn btn-primary inline-flex items-center text-lg"
                >
                  Design Your Tattoo
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </div>

              {/* Image Showcase */}
              <div className="order-1 lg:order-2">
                <div className="relative">
                  {/* Main Container */}
                  <div className="relative rounded-3xl overflow-hidden p-1">
                    <div className="rounded-3xl overflow-hidden">
                      <div className="grid grid-cols-2 gap-2">
                        {/* Top Left - Whale Tattoo */}
                        <div className="relative aspect-[4/3] bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl overflow-hidden">
                          <img 
                            src="https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?w=400&h=300&fit=crop"
                            alt="Whale tattoo design"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        {/* Top Right - Heart Tattoo */}
                        <div className="relative aspect-[4/3] bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl overflow-hidden">
                          <img 
                            src="https://images.unsplash.com/photo-1568515045052-f9a854d70bfd?w=400&h=300&fit=crop"
                            alt="Anatomical heart tattoo"
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Bottom Left - Rose Tattoo */}
                        <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden">
                          <img 
                            src="https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400&h=300&fit=crop"
                            alt="Rose tattoo design"
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Bottom Right - Lion Tattoo */}
                        <div className="relative aspect-[4/3] bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl overflow-hidden">
                          <img 
                            src="https://images.unsplash.com/photo-1567701554261-fcc289c03a36?w=400&h=300&fit=crop"
                            alt="Lion tattoo design"
                            className="w-full h-full object-cover"
                          />
                        </div>
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
              Preview What's Possible With AI-Generated Images
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-lg text-gray-600 max-w-3xl mx-auto"
            >
              Turn your ideas into stunning visuals with our generative AI. Create amazing headshots, tattoo designs, anime art, and 
              more in seconds. Just enter a prompt, customize with ease, and browse a world of AI-crafted styles.
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
                      className="w-full h-[400px] object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-4 left-4 right-4">
                        <p className="text-white font-medium mb-2">{galleryCategories[activeCategory].name}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-white/80 text-sm">AI Generated</span>
                          <Link 
                            to={activeCategory === 'anime' ? '/anime-generator' : '/generate'} 
                            className="text-white bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm hover:bg-white/30 transition-colors"
                          >
                            Try Now →
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-center mt-12"
          >
            <Link 
              to="/gallery" 
              className="btn btn-primary inline-flex items-center text-lg px-8 py-4"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Explore Full Gallery
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      {/* <section className="py-20 bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Why Choose Vheer?</h2>
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
                Frequently Asked Questions
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-xl text-gray-600"
              >
                Get Answers to Your Questions About Vheer
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

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="text-center mt-12"
            >
              <p className="text-gray-600 mb-4">
                Still have questions? We're here to help!
              </p>
              <Link 
                to="/contact" 
                className="btn btn-outline inline-flex items-center"
              >
                Contact Support
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-500 to-primary-600">
        <div className="container-custom text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Create Amazing Art?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join thousands of creators using Vheer to bring their ideas to life
          </p>
          <Link to="/register" className="btn bg-white text-primary-600 hover:bg-gray-100 text-lg px-8 py-4">
            Get Started for Free
            <Sparkles className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;