import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Hero slides data - Tesla-style full-screen sections
const heroSlides = [
  {
    id: 1,
    title: "Presale Condos",
    subtitle: "Lock in Today's Pricing",
    image: "/projects/the-mason-bldg.jpg",
    ctaPrimary: { text: "Browse Projects", link: "/presale-projects" },
    ctaSecondary: { text: "Learn More", link: "/presale-guide" },
  },
  {
    id: 2,
    title: "Move-In Ready",
    subtitle: "New Homes Under 6 Months Old",
    image: "/projects/the-mason-courtyard.jpg",
    ctaPrimary: { text: "View Available", link: "/resale" },
    ctaSecondary: { text: "See on Map", link: "/map-search" },
  },
];

// Product cards data - Tesla-style grid cards
const productCards = [
  {
    id: 1,
    label: "Presale Condos",
    title: "Surrey",
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80",
    link: "/surrey/presale-condos",
  },
  {
    id: 2,
    label: "Presale Townhomes",
    title: "Langley",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
    link: "/langley/presale-townhomes",
  },
  {
    id: 3,
    label: "Move-In Ready",
    title: "Burnaby",
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
    link: "/burnaby/resale",
  },
  {
    id: 4,
    label: "New Construction",
    title: "Vancouver",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
    link: "/vancouver/presale-condos",
  },
];

// Full-screen feature sections
const featureSections = [
  {
    id: 1,
    title: "Investment Calculator",
    subtitle: "Analyze Your ROI in Minutes",
    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1920&q=80",
    ctaPrimary: { text: "Calculate Now", link: "/calculator" },
    ctaSecondary: { text: "Learn More", link: "/roi-calculator" },
  },
  {
    id: 2,
    title: "Expert Guidance",
    subtitle: "Direct Developer Access",
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&q=80",
    ctaPrimary: { text: "Contact Us", link: "/contact" },
    ctaSecondary: { text: "About Us", link: "/about" },
  },
];

export default function TeslaStyleHome() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  // Handle scroll for header transparency
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-advance slides
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  const scrollToContent = () => {
    const windowHeight = window.innerHeight;
    window.scrollTo({ top: windowHeight, behavior: "smooth" });
  };

  return (
    <div className="bg-white text-black">
      {/* Tesla-style Transparent Header */}
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          isScrolled ? "bg-white/95 backdrop-blur-md shadow-sm" : "bg-transparent"
        )}
      >
        <nav className="flex items-center justify-between px-6 lg:px-12 h-14">
          {/* Logo */}
          <Link to="/tesla-home" className="flex items-center">
            <span className={cn(
              "text-xl font-bold tracking-tight transition-colors",
              isScrolled ? "text-black" : "text-white"
            )}>
              PRESALE<span className="text-primary">.</span>
            </span>
          </Link>

          {/* Center Nav */}
          <div className="hidden lg:flex items-center gap-8">
            {["Presale", "Move-In Ready", "Calculator", "Guides", "About"].map((item) => (
              <Link
                key={item}
                to={`/${item.toLowerCase().replace(/\s+/g, "-")}`}
                className={cn(
                  "text-sm font-medium transition-colors hover:opacity-70",
                  isScrolled ? "text-black" : "text-white"
                )}
              >
                {item}
              </Link>
            ))}
          </div>

          {/* Right Nav */}
          <div className="flex items-center gap-6">
            <Link
              to="/contact"
              className={cn(
                "text-sm font-medium transition-colors hover:opacity-70",
                isScrolled ? "text-black" : "text-white"
              )}
            >
              Contact
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section - Full Screen Carousel */}
      <section ref={heroRef} className="relative h-screen w-full overflow-hidden">
        {/* Slides */}
        {heroSlides.map((slide, index) => (
          <div
            key={slide.id}
            className={cn(
              "absolute inset-0 transition-opacity duration-1000",
              index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
            )}
          >
            {/* Background Image */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${slide.image})` }}
            >
              <div className="absolute inset-0 bg-black/30" />
            </div>

            {/* Content */}
            <div className="relative z-10 h-full flex flex-col items-center justify-center text-center text-white px-4">
              <h1 className="text-5xl md:text-7xl font-medium tracking-tight mb-2 animate-fade-in-up">
                {slide.title}
              </h1>
              <p className="text-lg md:text-xl font-light mb-8 opacity-90 animate-fade-in-up animation-delay-100">
                {slide.subtitle}
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up animation-delay-200">
                <Link
                  to={slide.ctaPrimary.link}
                  className="px-12 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors min-w-[200px]"
                >
                  {slide.ctaPrimary.text}
                </Link>
                <Link
                  to={slide.ctaSecondary.link}
                  className="px-12 py-3 bg-white/90 hover:bg-white text-black text-sm font-medium rounded transition-colors min-w-[200px]"
                >
                  {slide.ctaSecondary.text}
                </Link>
              </div>
            </div>
          </div>
        ))}

        {/* Navigation Arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-sm transition-colors"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-sm transition-colors"
          aria-label="Next slide"
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>

        {/* Dots Indicator */}
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                index === currentSlide ? "bg-white w-6" : "bg-white/50"
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Scroll Down Indicator */}
        <button
          onClick={scrollToContent}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 animate-bounce"
          aria-label="Scroll down"
        >
          <ChevronDown className="w-8 h-8 text-white" />
        </button>
      </section>

      {/* Product Cards Grid - Tesla Style */}
      <section className="py-4">
        <div className="grid md:grid-cols-2 gap-4 px-4">
          {productCards.map((card) => (
            <Link
              key={card.id}
              to={card.link}
              className="group relative h-[500px] md:h-[600px] overflow-hidden rounded-lg"
            >
              {/* Background Image */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{ backgroundImage: `url(${card.image})` }}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />
              </div>

              {/* Content */}
              <div className="relative z-10 h-full flex flex-col items-center justify-between py-12 text-white">
                {/* Top - Title */}
                <div className="text-center">
                  <p className="text-sm font-medium uppercase tracking-wider opacity-80 mb-2">
                    {card.label}
                  </p>
                  <h3 className="text-3xl md:text-4xl font-medium">{card.title}</h3>
                </div>

                {/* Bottom - CTAs */}
                <div className="flex gap-4 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                  <span className="px-8 py-2 bg-white/90 text-black text-sm font-medium rounded hover:bg-white transition-colors">
                    Explore
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Full-Screen Feature Sections */}
      {featureSections.map((section) => (
        <section key={section.id} className="relative h-screen w-full">
          {/* Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${section.image})` }}
          >
            <div className="absolute inset-0 bg-black/40" />
          </div>

          {/* Content */}
          <div className="relative z-10 h-full flex flex-col items-center justify-center text-center text-white px-4">
            <h2 className="text-4xl md:text-6xl font-medium tracking-tight mb-2">
              {section.title}
            </h2>
            <p className="text-lg md:text-xl font-light mb-8 opacity-90">
              {section.subtitle}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to={section.ctaPrimary.link}
                className="px-12 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors min-w-[200px]"
              >
                {section.ctaPrimary.text}
              </Link>
              <Link
                to={section.ctaSecondary.link}
                className="px-12 py-3 bg-white/90 hover:bg-white text-black text-sm font-medium rounded transition-colors min-w-[200px]"
              >
                {section.ctaSecondary.text}
              </Link>
            </div>
          </div>
        </section>
      ))}

      {/* Final CTA Section */}
      <section className="relative h-[60vh] w-full">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(https://images.unsplash.com/photo-1449844908441-8829872d2607?w=1920&q=80)`,
          }}
        >
          <div className="absolute inset-0 bg-black/50" />
        </div>

        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center text-white px-4">
          <h2 className="text-3xl md:text-5xl font-medium tracking-tight mb-4">
            Ready to Find Your New Home?
          </h2>
          <p className="text-lg font-light mb-8 opacity-90 max-w-xl">
            Get exclusive access to presale projects and move-in ready homes across Metro Vancouver.
          </p>
          <Link
            to="/contact"
            className="px-12 py-3 bg-white hover:bg-white/90 text-black text-sm font-medium rounded transition-colors"
          >
            Get Started
          </Link>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="bg-black text-white py-12">
        <div className="container px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-medium mb-4">Presale Projects</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/surrey/presale-condos" className="hover:text-white transition-colors">Surrey</Link></li>
                <li><Link to="/langley/presale-townhomes" className="hover:text-white transition-colors">Langley</Link></li>
                <li><Link to="/burnaby/presale-condos" className="hover:text-white transition-colors">Burnaby</Link></li>
                <li><Link to="/vancouver/presale-condos" className="hover:text-white transition-colors">Vancouver</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/presale-guide" className="hover:text-white transition-colors">Presale Guide</Link></li>
                <li><Link to="/calculator" className="hover:text-white transition-colors">ROI Calculator</Link></li>
                <li><Link to="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link to="/mortgage-calculator" className="hover:text-white transition-colors">Mortgage Calculator</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link to="/for-developers" className="hover:text-white transition-colors">For Developers</Link></li>
                <li><Link to="/for-agents" className="hover:text-white transition-colors">For Agents</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>672-258-1100</li>
                <li>info@presaleproperties.com</li>
                <li>Vancouver, BC</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">
              © 2025 Presale Properties. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-gray-500">
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
