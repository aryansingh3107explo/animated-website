// Mock Data Services using LocalStorage

// Default values to seed LocalStorage if empty
const DEFAULT_PRODUCTS = [
  {
    id: "serum-01",
    name: "Golden Hour Glow Serum",
    category: "Serums",
    price: 49.99,
    description: "56% Glow Hyphened™ Serum powered by Kakadu Plum, Niacinamide and Ceramides for an instant glass-skin radiance.",
    rating: 4.8,
    reviewsCount: 154,
    inventory: 45,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBibvmL2LBI31VWchreLuNL1I_mhaREXeXojgPpL3_qTmPYTcAyZusGD13DWbYOsUI9OpdSFjRipBcg27oWY-qeRiv5LWqBMqG6nI7l0aeTSwpi2-mHVOjkM1T7jX4N9i4Hszl_hO9hLltuOyH-tUR2pzmw1aWfwmNYRjG8ipSJUdGzr9lNTEIzSZMiSg0yqhEXe0pwTLnqhLTwrJL3-qDYqf8bnHLiwCFtbikaOefqTQKJvReB4BINRokaw_L-FexYYHwhezpnXnA"
  },
  {
    id: "cleaner-02",
    name: "Hydra Cleanse Gentle Wash",
    category: "Cleansers",
    price: 24.99,
    description: "pH-balanced hydrating cleanser that removes makeup and daily impurities without stripping the skin barrier.",
    rating: 4.6,
    reviewsCount: 89,
    inventory: 60,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBibvmL2LBI31VWchreLuNL1I_mhaREXeXojgPpL3_qTmPYTcAyZusGD13DWbYOsUI9OpdSFjRipBcg27oWY-qeRiv5LWqBMqG6nI7l0aeTSwpi2-mHVOjkM1T7jX4N9i4Hszl_hO9hLltuOyH-tUR2pzmw1aWfwmNYRjG8ipSJUdGzr9lNTEIzSZMiSg0yqhEXe0pwTLnqhLTwrJL3-qDYqf8bnHLiwCFtbikaOefqTQKJvReB4BINRokaw_L-FexYYHwhezpnXnA"
  },
  {
    id: "cream-03",
    name: "Ceramide Barrier Cream",
    category: "Moisturizers",
    price: 38.00,
    description: "Deep nourishing ceramide complex that reinforces and seals the skin lipid barrier, locking in 24h moisture.",
    rating: 4.7,
    reviewsCount: 112,
    inventory: 32,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBibvmL2LBI31VWchreLuNL1I_mhaREXeXojgPpL3_qTmPYTcAyZusGD13DWbYOsUI9OpdSFjRipBcg27oWY-qeRiv5LWqBMqG6nI7l0aeTSwpi2-mHVOjkM1T7jX4N9i4Hszl_hO9hLltuOyH-tUR2pzmw1aWfwmNYRjG8ipSJUdGzr9lNTEIzSZMiSg0yqhEXe0pwTLnqhLTwrJL3-qDYqf8bnHLiwCFtbikaOefqTQKJvReB4BINRokaw_L-FexYYHwhezpnXnA"
  }
];

const DEFAULT_REVIEWS = [
  {
    id: "rev-1",
    productId: "serum-01",
    author: "Sophia M.",
    rating: 5,
    text: "Literally magic in a bottle. My skin has never looked this vibrant and the texture is so much smoother after just a week.",
    verified: true,
    date: "2026-06-15",
    approved: true
  },
  {
    id: "rev-2",
    productId: "serum-01",
    author: "James L.",
    rating: 5,
    text: "The best part is how it feels—non-sticky but super hydrating. It works perfectly under my foundation.",
    verified: true,
    date: "2026-06-18",
    approved: true
  },
  {
    id: "rev-3",
    productId: "serum-01",
    author: "Elena R.",
    rating: 5,
    text: "I've tried everything for my hyperpigmentation. This is the first thing that actually made a noticeable difference.",
    verified: true,
    date: "2026-06-20",
    approved: true
  }
];

// Helper functions for LocalStorage interactions
function getItem(key, defaultVal) {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(defaultVal));
    return defaultVal;
  }
  return JSON.parse(data);
}

function setItem(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

// 1. PRODUCT SERVICE
class ProductService {
  static getProducts() {
    return getItem("hyphen_products", DEFAULT_PRODUCTS);
  }

  static getProductById(id) {
    return this.getProducts().find(p => p.id === id);
  }

  static saveProduct(product) {
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === product.id);
    if (index >= 0) {
      products[index] = { ...products[index], ...product };
    } else {
      product.id = "prod-" + Date.now();
      products.push(product);
    }
    setItem("hyphen_products", products);
    return product;
  }

  static deleteProduct(id) {
    const products = this.getProducts().filter(p => p.id !== id);
    setItem("hyphen_products", products);
  }
}

// 2. REVIEW SERVICE
class ReviewService {
  static getReviews() {
    return getItem("hyphen_reviews", DEFAULT_REVIEWS);
  }

  static addReview(review) {
    const reviews = this.getReviews();
    const newReview = {
      id: "rev-" + Date.now(),
      date: new Date().toISOString().split("T")[0],
      approved: false, // Moderation by default
      verified: true,
      ...review
    };
    reviews.push(newReview);
    setItem("hyphen_reviews", reviews);
    return newReview;
  }

  static approveReview(id) {
    const reviews = this.getReviews();
    const index = reviews.findIndex(r => r.id === id);
    if (index >= 0) {
      reviews[index].approved = true;
      setItem("hyphen_reviews", reviews);
    }
  }

  static deleteReview(id) {
    const reviews = this.getReviews().filter(r => r.id !== id);
    setItem("hyphen_reviews", reviews);
  }
}

// 3. CONTACT SERVICE
class ContactService {
  static getSubmissions() {
    return getItem("hyphen_contact_submissions", []);
  }

  static submitContactForm(data) {
    const submissions = this.getSubmissions();
    const submission = {
      id: "contact-" + Date.now(),
      date: new Date().toISOString(),
      ...data
    };
    submissions.push(submission);
    setItem("hyphen_contact_submissions", submissions);
    return submission;
  }

  static deleteSubmission(id) {
    const submissions = this.getSubmissions().filter(s => s.id !== id);
    setItem("hyphen_contact_submissions", submissions);
  }
}

// 4. ANALYTICS SERVICE
class AnalyticsService {
  static getEvents() {
    return getItem("hyphen_analytics_events", []);
  }

  static logEvent(type, metadata = {}) {
    const events = this.getEvents();
    events.push({
      type,
      timestamp: new Date().toISOString(),
      metadata
    });
    setItem("hyphen_analytics_events", events);
  }

  static getStats() {
    const events = this.getEvents();
    
    const pageViews = events.filter(e => e.type === "pageView").length;
    const dragShowcase = events.filter(e => e.type === "dragShowcase").length;
    const quizStart = events.filter(e => e.type === "quizStart").length;
    const quizComplete = events.filter(e => e.type === "quizComplete").length;
    const cartAdds = events.filter(e => e.type === "addToCart").length;
    const purchases = events.filter(e => e.type === "checkout").length;

    // Quiz Recommendations Distribution
    const recommendations = {};
    events.filter(e => e.type === "quizComplete").forEach(e => {
      const rec = e.metadata.recommendedProduct || "unknown";
      recommendations[rec] = (recommendations[rec] || 0) + 1;
    });

    return {
      pageViews: pageViews + 120, // Add base number for styling
      dragShowcase: dragShowcase + 45,
      quizStart: quizStart + 22,
      quizComplete: quizComplete + 14,
      cartAdds: cartAdds + 18,
      purchases: purchases + 3,
      conversionRate: pageViews > 0 ? ((purchases / pageViews) * 100).toFixed(1) : "2.5",
      recommendations
    };
  }

  static clearStats() {
    setItem("hyphen_analytics_events", []);
  }
}

// Export services globally for app.js usage
window.ProductService = ProductService;
window.ReviewService = ReviewService;
window.ContactService = ContactService;
window.AnalyticsService = AnalyticsService;
