// HYPHEN Skincare Interactive Core Application
// Configuration & DOM Nodes
const frameCount = 40;
const canvas = document.getElementById("scroll-canvas");
const context = canvas ? canvas.getContext("2d") : null;
const hudValue = document.getElementById("hud-value");

// Showcase Drag-to-Rotate 3D Canvas
const showcaseCanvas = document.getElementById("showcase-canvas");
const showcaseContext = showcaseCanvas ? showcaseCanvas.getContext("2d") : null;

// Generate frame image paths
const currentFrame = index => `frames/ezgif-frame-${index.toString().padStart(3, '0')}.jpg`;

// Preload images array
const images = [];
let loadedCount = 0;

// Scroll Animation state
let targetFrameIndex = 0;
let currentFrameIndex = 0;
let lastRenderedIndex = -1;

// Drag Showcase state
let showcaseFrameIndex = 0;
let lastShowcaseRenderedIndex = -1;
let isDragging = false;
let startDragX = 0;
let startFrameIndex = 0;

// High-performance image cover (aspect-fill) drawing function
function drawImageCover(ctx, img) {
  if (!ctx || !img || !img.complete) return;
  
  const canvasWidth = ctx.canvas.width;
  const canvasHeight = ctx.canvas.height;
  const imgWidth = img.width || 1920;
  const imgHeight = img.height || 1080;
  
  const ratio = Math.max(canvasWidth / imgWidth, canvasHeight / imgHeight);
  const newWidth = imgWidth * ratio;
  const newHeight = imgHeight * ratio;
  
  const x = (canvasWidth - newWidth) / 2;
  const y = (canvasHeight - newHeight) / 2;
  
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  ctx.drawImage(img, x, y, newWidth, newHeight);
}

// Preload images into memory
function preloadImages() {
  for (let i = 1; i <= frameCount; i++) {
    const img = new Image();
    img.src = currentFrame(i);
    img.onload = () => {
      loadedCount++;
      if (i === 1) {
        renderFrame(0);
        renderShowcaseFrame(0);
      }
    };
    images.push(img);
  }
}

// Render scroll frame
function renderFrame(index) {
  if (images[index] && images[index].complete && context) {
    drawImageCover(context, images[index]);
    lastRenderedIndex = index;
  }
}

// Render showcase frame
function renderShowcaseFrame(index) {
  if (images[index] && images[index].complete && showcaseContext) {
    drawImageCover(showcaseContext, images[index]);
    lastShowcaseRenderedIndex = index;
  }
}

// Setup responsive canvas dimensions (Retina support)
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  if (canvas) {
    canvas.width = viewportWidth * dpr;
    canvas.height = viewportHeight * dpr;
    if (context) context.setTransform(1, 0, 0, 1, 0, 0);
    renderFrame(Math.round(currentFrameIndex));
  }

  if (showcaseCanvas) {
    const container = showcaseCanvas.parentElement;
    const rect = container.getBoundingClientRect();
    showcaseCanvas.width = rect.width * dpr;
    showcaseCanvas.height = rect.height * dpr;
    if (showcaseContext) showcaseContext.setTransform(1, 0, 0, 1, 0, 0);
    renderShowcaseFrame(showcaseFrameIndex);
  }
}

// Calculate target frame index from scroll position
function handleScroll() {
  const section = document.getElementById("scroll-section");
  if (!section) return;

  const sectionTop = section.offsetTop;
  const sectionHeight = section.offsetHeight;
  const viewportHeight = window.innerHeight;
  const scrollTop = window.scrollY || window.pageYOffset;

  const scrollRange = sectionHeight;
  const relativeScroll = scrollTop - sectionTop;

  let progress = 0;
  if (scrollRange > 0) {
    progress = Math.min(1, Math.max(0, relativeScroll / scrollRange));
  }

  targetFrameIndex = progress * (frameCount - 1);

  // Fade out overlay text as scroll progress increases
  const overlay = document.querySelector(".scroll-anim-overlay");
  if (overlay) {
    overlay.style.opacity = Math.max(0, 1 - progress * 1.5);
    overlay.style.pointerEvents = progress > 0.6 ? "none" : "auto";
  }

  // Hide HUD and canvas once scrolled past
  const hud = document.querySelector(".hud-container");
  if (hud) {
    hud.style.opacity = progress >= 0.99 ? "0" : "1";
    hud.style.pointerEvents = progress >= 0.99 ? "none" : "auto";
  }

  if (canvas) {
    canvas.style.opacity = progress >= 0.99 ? "0" : "1";
    canvas.style.pointerEvents = progress >= 0.99 ? "none" : "auto";
  }
}

// Main animation tick loop
function tick() {
  const diff = targetFrameIndex - currentFrameIndex;
  if (Math.abs(diff) > 0.01) {
    currentFrameIndex += diff * 0.15;
  } else {
    currentFrameIndex = targetFrameIndex;
  }
  
  const roundedIndex = Math.round(currentFrameIndex);
  if (roundedIndex !== lastRenderedIndex) {
    renderFrame(roundedIndex);
    if (hudValue) {
      hudValue.textContent = `${(roundedIndex + 1).toString().padStart(2, '0')} / ${frameCount}`;
    }
  }
  
  requestAnimationFrame(tick);
}

// -------------------------------------------------------------
// 3D SHOWCASE DRAG-TO-ROTATE HANDLERS
// -------------------------------------------------------------
function setupShowcaseDrag() {
  const container = document.querySelector(".drag-showcase-container");
  if (!container) return;

  const getX = e => e.touches ? e.touches[0].clientX : e.clientX;

  const startDrag = e => {
    isDragging = true;
    startDragX = getX(e);
    startFrameIndex = showcaseFrameIndex;
    AnalyticsService.logEvent("dragShowcase", { startFrame: startFrameIndex });
  };

  const doDrag = e => {
    if (!isDragging) return;
    const currentX = getX(e);
    const deltaX = currentX - startDragX;
    
    // 15px drag = 1 frame rotation speed
    const frameOffset = Math.round(deltaX / 15);
    showcaseFrameIndex = (startFrameIndex - frameOffset) % frameCount;
    if (showcaseFrameIndex < 0) showcaseFrameIndex += frameCount;
    
    renderShowcaseFrame(showcaseFrameIndex);
  };

  const stopDrag = () => {
    isDragging = false;
  };

  container.addEventListener("mousedown", startDrag);
  window.addEventListener("mousemove", doDrag);
  window.addEventListener("mouseup", stopDrag);

  container.addEventListener("touchstart", startDrag, { passive: true });
  window.addEventListener("touchmove", doDrag, { passive: true });
  window.addEventListener("touchend", stopDrag);
}

// -------------------------------------------------------------
// CART SYSTEM
// -------------------------------------------------------------
let cart = [];

function initCart() {
  cart = JSON.parse(localStorage.getItem("hyphen_cart")) || [];
  updateCartBadge();
  renderCart();
}

function updateCartBadge() {
  const badge = document.getElementById("cart-badge");
  if (badge) {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    badge.textContent = totalItems;
    badge.classList.toggle("hidden", totalItems === 0);
  }
}

function toggleCart(forceOpen) {
  const drawer = document.getElementById("cart-drawer");
  if (drawer) {
    if (forceOpen === true) {
      drawer.classList.add("open");
    } else if (forceOpen === false) {
      drawer.classList.remove("open");
    } else {
      drawer.classList.toggle("open");
    }
  }
}

function addToCart(productId) {
  const product = ProductService.getProductById(productId);
  if (!product) return;

  const existing = cart.find(item => item.productId === productId);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      productId,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1
    });
  }

  localStorage.setItem("hyphen_cart", JSON.stringify(cart));
  updateCartBadge();
  renderCart();
  toggleCart(true); // Slide open cart

  AnalyticsService.logEvent("addToCart", { productId, price: product.price });
}

function updateCartQuantity(productId, delta) {
  const item = cart.find(item => item.productId === productId);
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    cart = cart.filter(i => i.productId !== productId);
  }

  localStorage.setItem("hyphen_cart", JSON.stringify(cart));
  updateCartBadge();
  renderCart();
}

function removeFromCart(productId) {
  cart = cart.filter(item => item.productId !== productId);
  localStorage.setItem("hyphen_cart", JSON.stringify(cart));
  updateCartBadge();
  renderCart();
}

function renderCart() {
  const itemsContainer = document.getElementById("cart-items");
  const subtotalEl = document.getElementById("cart-subtotal");
  if (!itemsContainer || !subtotalEl) return;

  if (cart.length === 0) {
    itemsContainer.innerHTML = `
      <div class="flex flex-col items-center justify-center h-64 text-on-surface-variant">
        <span class="material-symbols-outlined text-5xl mb-4">shopping_bag</span>
        <p class="font-bold text-lg mb-1">Your cart is empty</p>
        <p class="text-sm">Start shopping to fill it up.</p>
      </div>
    `;
    subtotalEl.textContent = "$0.00";
    return;
  }

  itemsContainer.innerHTML = cart.map(item => `
    <div class="flex gap-4 p-4 border-b border-on-background/5">
      <img src="${item.image}" alt="${item.name}" class="w-16 h-16 rounded-xl object-cover bg-secondary-container/20">
      <div class="flex-grow">
        <h4 class="font-bold text-sm leading-tight mb-1 text-on-background">${item.name}</h4>
        <p class="text-xs text-primary font-bold mb-2">$${item.price.toFixed(2)}</p>
        <div class="flex items-center gap-3">
          <button onclick="updateCartQuantity('${item.productId}', -1)" class="w-6 h-6 rounded-full border border-on-background/10 flex items-center justify-center text-sm font-bold hover:bg-primary-container/20 active:scale-95 transition-all">-</button>
          <span class="text-sm font-semibold">${item.quantity}</span>
          <button onclick="updateCartQuantity('${item.productId}', 1)" class="w-6 h-6 rounded-full border border-on-background/10 flex items-center justify-center text-sm font-bold hover:bg-primary-container/20 active:scale-95 transition-all">+</button>
        </div>
      </div>
      <button onclick="removeFromCart('${item.productId}')" class="text-on-surface-variant hover:text-error transition-colors self-start">
        <span class="material-symbols-outlined text-xl">delete</span>
      </button>
    </div>
  `).join("");

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
}

function checkoutCart() {
  if (cart.length === 0) return;

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  AnalyticsService.logEvent("checkout", { total, itemCount: cart.length });

  // Simulate successful checkout
  cart = [];
  localStorage.setItem("hyphen_cart", JSON.stringify(cart));
  updateCartBadge();
  renderCart();

  const container = document.getElementById("cart-items");
  if (container) {
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center h-64 text-center px-6">
        <span class="material-symbols-outlined text-6xl text-primary mb-4 animate-bounce">check_circle</span>
        <h4 class="font-bold text-xl mb-2 text-on-background">Order Placed!</h4>
        <p class="text-sm text-on-surface-variant">Your order has been simulated successfully. Thank you for shopping with HYPHEN.</p>
      </div>
    `;
  }
  const subtotalEl = document.getElementById("cart-subtotal");
  if (subtotalEl) subtotalEl.textContent = "$0.00";
}

// -------------------------------------------------------------
// DARK / LIGHT THEME TOGGLE
// -------------------------------------------------------------
function initTheme() {
  const savedTheme = localStorage.getItem("hyphen_theme") || "light";
  applyTheme(savedTheme);
}

function toggleTheme() {
  const isDark = document.documentElement.classList.contains("dark");
  const newTheme = isDark ? "light" : "dark";
  applyTheme(newTheme);
}

function applyTheme(theme) {
  const isDark = theme === "dark";
  document.documentElement.classList.toggle("dark", isDark);
  localStorage.setItem("hyphen_theme", theme);
  
  // Update icons and visual variables
  const toggles = document.querySelectorAll(".theme-toggle-icon");
  toggles.forEach(icon => {
    icon.textContent = isDark ? "light_mode" : "dark_mode";
  });

  AnalyticsService.logEvent("changeTheme", { theme });
}

// -------------------------------------------------------------
// AI SKIN RECOMMENDATION SYSTEM
// -------------------------------------------------------------
const QUIZ_QUESTIONS = [
  {
    question: "What is your primary skin type?",
    options: [
      { text: "Dry / Flaky", score: { cream: 3, serum: 1, cleaner: 1 } },
      { text: "Oily / Shiny", score: { serum: 3, cleaner: 2, cream: 1 } },
      { text: "Combination", score: { serum: 2, cream: 2, cleaner: 2 } },
      { text: "Sensitive / Red", score: { cream: 3, cleaner: 2, serum: 1 } }
    ]
  },
  {
    question: "What is your main skin concern?",
    options: [
      { text: "Dullness / Hyperpigmentation", score: { serum: 5, cleaner: 1, cream: 1 } },
      { text: "Dehydration / Tightness", score: { cream: 4, serum: 2, cleaner: 1 } },
      { text: "Clogged Pores / Texture", score: { cleaner: 4, serum: 2, cream: 1 } },
      { text: "Redness / Weak Barrier", score: { cream: 5, cleaner: 2, serum: 1 } }
    ]
  },
  {
    question: "What environment do you spend most of your day in?",
    options: [
      { text: "Air-conditioned Indoor", score: { cream: 3, serum: 2 } },
      { text: "Outdoor Humidity / Pollution", score: { cleaner: 4, serum: 2 } },
      { text: "Dry / Cold climate", score: { cream: 5, serum: 2 } },
      { text: "Balanced Indoors", score: { serum: 3, cream: 2 } }
    ]
  }
];

let currentQuestionIndex = 0;
let quizScores = { serum: 0, cleaner: 0, cream: 0 };

function openQuiz() {
  currentQuestionIndex = 0;
  quizScores = { serum: 0, cleaner: 0, cream: 0 };
  
  const backdrop = document.getElementById("quiz-backdrop");
  const modal = document.getElementById("quiz-modal");
  if (backdrop && modal) {
    backdrop.classList.add("open");
    modal.classList.add("open");
    renderQuizQuestion();
  }
  AnalyticsService.logEvent("quizStart");
}

function closeQuiz() {
  const backdrop = document.getElementById("quiz-backdrop");
  const modal = document.getElementById("quiz-modal");
  if (backdrop && modal) {
    backdrop.classList.remove("open");
    modal.classList.remove("open");
  }
}

function renderQuizQuestion() {
  const questionEl = document.getElementById("quiz-question");
  const optionsEl = document.getElementById("quiz-options");
  const progressEl = document.getElementById("quiz-progress");
  
  if (!questionEl || !optionsEl || !progressEl) return;

  const current = QUIZ_QUESTIONS[currentQuestionIndex];
  progressEl.style.width = `${((currentQuestionIndex) / QUIZ_QUESTIONS.length) * 100}%`;
  
  questionEl.textContent = current.question;
  optionsEl.innerHTML = current.options.map((opt, i) => `
    <button onclick="handleQuizAnswer(${i})" class="w-full text-left p-5 rounded-2xl border border-on-background/10 hover:border-primary hover:bg-primary-container/10 active:scale-[0.99] transition-all font-medium text-sm md:text-base text-on-background flex justify-between items-center group">
      <span>${opt.text}</span>
      <span class="material-symbols-outlined text-primary opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
    </button>
  `).join("");
}

function handleQuizAnswer(optionIndex) {
  const option = QUIZ_QUESTIONS[currentQuestionIndex].options[optionIndex];
  
  // Aggregate scores
  for (const key in option.score) {
    quizScores[key] = (quizScores[key] || 0) + option.score[key];
  }

  currentQuestionIndex++;
  if (currentQuestionIndex < QUIZ_QUESTIONS.length) {
    renderQuizQuestion();
  } else {
    showQuizResult();
  }
}

function showQuizResult() {
  const questionEl = document.getElementById("quiz-question");
  const optionsEl = document.getElementById("quiz-options");
  const progressEl = document.getElementById("quiz-progress");
  
  if (!questionEl || !optionsEl || !progressEl) return;

  progressEl.style.width = "100%";
  questionEl.textContent = "Your Skin Profile Analysis Complete!";

  // Determine highest score product
  let recommendedId = "serum-01"; // Default
  let reason = "";

  const maxScore = Math.max(quizScores.serum, quizScores.cleaner, quizScores.cream);
  if (maxScore === quizScores.cleaner) {
    recommendedId = "cleaner-02";
    reason = "Your skin concern points to texture or impurity buildup. We recommend starting with our Hydra Cleanse Wash to balance your pores.";
  } else if (maxScore === quizScores.cream) {
    recommendedId = "cream-03";
    reason = "Your barrier exhibits dehydration or signs of irritation. The Ceramide Barrier Cream will lock in hydration and restore skin layers.";
  } else {
    recommendedId = "serum-01";
    reason = "You seek unparalleled brightness and hydration boost! The Golden Hour Glow Serum powered by Niacinamide & Kakadu Plum is your perfect match.";
  }

  const recommendedProduct = ProductService.getProductById(recommendedId);
  AnalyticsService.logEvent("quizComplete", { recommendedProduct: recommendedProduct.name });

  optionsEl.innerHTML = `
    <div class="flex flex-col items-center text-center p-4">
      <div class="w-24 h-24 bg-primary-container/20 rounded-full flex items-center justify-center mb-6">
        <span class="material-symbols-outlined text-primary text-5xl animate-pulse">spa</span>
      </div>
      <h3 class="font-bold text-lg mb-2 text-on-background">Recommended Product:</h3>
      <h4 class="font-display-lg text-2xl text-primary font-bold mb-4">${recommendedProduct.name}</h4>
      <p class="text-sm text-on-surface-variant max-w-md leading-relaxed mb-6">${reason}</p>
      <div class="flex flex-col sm:flex-row gap-4 w-full">
        <button onclick="addToCart('${recommendedProduct.id}'); closeQuiz();" class="flex-grow bg-primary-container text-on-primary-container text-label-caps font-bold px-8 py-3 rounded-full hover:shadow-lg transition-all">Add Recommended to Cart</button>
        <button onclick="closeQuiz()" class="border border-on-background/10 text-label-caps font-bold px-8 py-3 rounded-full hover:bg-on-background/5 transition-all text-on-background">Close Quiz</button>
      </div>
    </div>
  `;
}

// -------------------------------------------------------------
// CONTACT FORM SUBMISSION
// -------------------------------------------------------------
function handleContactForm(event) {
  event.preventDefault();
  const form = event.target;
  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const message = form.message.value.trim();

  if (!name || !email || !message) return;

  ContactService.submitContactForm({ name, email, message });
  AnalyticsService.logEvent("contactSubmit", { name, email });

  form.reset();
  const formContainer = document.getElementById("contact-form-container");
  if (formContainer) {
    formContainer.innerHTML = `
      <div class="flex flex-col items-center justify-center p-12 text-center h-[350px] glass-card rounded-3xl border border-primary-container/30">
        <span class="material-symbols-outlined text-5xl text-primary mb-4 animate-bounce">check_circle</span>
        <h3 class="text-2xl font-bold text-on-background mb-2">Message Sent!</h3>
        <p class="text-sm text-on-surface-variant max-w-sm mb-6">Thank you for reaching out. A HYPHEN expert will respond to your query shortly.</p>
        <button onclick="resetContactForm()" class="bg-primary text-white text-label-caps font-bold px-8 py-3 rounded-full hover:shadow-lg transition-all active:scale-95">Send Another Message</button>
      </div>
    `;
  }
}

function resetContactForm() {
  const formContainer = document.getElementById("contact-form-container");
  if (formContainer) {
    formContainer.innerHTML = `
      <form class="space-y-6" onsubmit="handleContactForm(event)">
        <div>
          <label class="block text-sm font-semibold mb-2 text-on-background" for="contact-name">Name</label>
          <input class="w-full bg-white/50 border border-on-background/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-primary focus:bg-white transition-all text-on-background" id="contact-name" name="name" placeholder="John Doe" type="text" required>
        </div>
        <div>
          <label class="block text-sm font-semibold mb-2 text-on-background" for="contact-email">Email</label>
          <input class="w-full bg-white/50 border border-on-background/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-primary focus:bg-white transition-all text-on-background" id="contact-email" name="email" placeholder="john@example.com" type="email" required>
        </div>
        <div>
          <label class="block text-sm font-semibold mb-2 text-on-background" for="contact-message">Message</label>
          <textarea class="w-full bg-white/50 border border-on-background/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-primary focus:bg-white transition-all text-on-background h-32 resize-none" id="contact-message" name="message" placeholder="How can we help you?" required></textarea>
        </div>
        <button class="w-full bg-primary-container text-on-primary-container text-label-caps font-bold py-4 rounded-full hover:shadow-lg active:scale-95 transition-all text-center">Send Message</button>
      </form>
    `;
  }
}

// -------------------------------------------------------------
// ADMIN PANEL DASHBOARD LOGIC
// -------------------------------------------------------------
function toggleAdmin(forceOpen) {
  const backdrop = document.getElementById("admin-backdrop");
  const modal = document.getElementById("admin-modal");
  if (backdrop && modal) {
    if (forceOpen === true) {
      backdrop.classList.add("open");
      modal.classList.add("open");
      renderAdminDashboard();
    } else if (forceOpen === false) {
      backdrop.classList.remove("open");
      modal.classList.remove("open");
    } else {
      const isOpen = modal.classList.contains("open");
      backdrop.classList.toggle("open", !isOpen);
      modal.classList.toggle("open", !isOpen);
      if (!isOpen) renderAdminDashboard();
    }
  }
}

function renderAdminDashboard() {
  const content = document.getElementById("admin-content");
  if (!content) return;

  const stats = AnalyticsService.getStats();
  const contacts = ContactService.getSubmissions();
  const reviews = ReviewService.getReviews();

  content.innerHTML = `
    <!-- Top Stats Badges -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div class="p-4 rounded-2xl bg-secondary-container/10 border border-on-background/5 text-center">
        <span class="text-xs text-on-surface-variant block uppercase font-bold mb-1">Page Views</span>
        <span class="text-2xl font-bold text-on-background">${stats.pageViews}</span>
      </div>
      <div class="p-4 rounded-2xl bg-secondary-container/10 border border-on-background/5 text-center">
        <span class="text-xs text-on-surface-variant block uppercase font-bold mb-1">3D Rotations</span>
        <span class="text-2xl font-bold text-on-background">${stats.dragShowcase}</span>
      </div>
      <div class="p-4 rounded-2xl bg-secondary-container/10 border border-on-background/5 text-center">
        <span class="text-xs text-on-surface-variant block uppercase font-bold mb-1">Cart Adds</span>
        <span class="text-2xl font-bold text-on-background">${stats.cartAdds}</span>
      </div>
      <div class="p-4 rounded-2xl bg-secondary-container/10 border border-on-background/5 text-center">
        <span class="text-xs text-on-surface-variant block uppercase font-bold mb-1">Purchases</span>
        <span class="text-2xl font-bold text-on-background">${stats.purchases}</span>
      </div>
    </div>

    <!-- Charts Section -->
    <div class="mb-8 p-6 rounded-2xl border border-on-background/5 bg-secondary-container/5">
      <div class="flex justify-between items-center mb-6">
        <h4 class="font-bold text-base text-on-background">Analytical Conversions</h4>
        <span class="text-xs bg-primary-container text-on-primary-container px-3 py-1 rounded-full font-bold">Conversion: ${stats.conversionRate}%</span>
      </div>
      <div class="w-full h-48 relative flex items-end gap-2 justify-between">
        <!-- SVG Vector bar graph simulation -->
        <div class="flex flex-col items-center w-full">
          <div class="w-full bg-primary/20 rounded-t-lg transition-all duration-1000" style="height: 100px;"></div>
          <span class="text-[10px] text-on-surface-variant mt-2 font-bold">Views</span>
        </div>
        <div class="flex flex-col items-center w-full">
          <div class="w-full bg-primary-container/80 rounded-t-lg transition-all duration-1000" style="height: ${Math.min(100, (stats.dragShowcase/stats.pageViews)*300)}px;"></div>
          <span class="text-[10px] text-on-surface-variant mt-2 font-bold">Interact</span>
        </div>
        <div class="flex flex-col items-center w-full">
          <div class="w-full bg-primary rounded-t-lg transition-all duration-1000" style="height: ${Math.min(100, (stats.cartAdds/stats.pageViews)*350)}px;"></div>
          <span class="text-[10px] text-on-surface-variant mt-2 font-bold">Cart</span>
        </div>
        <div class="flex flex-col items-center w-full">
          <div class="w-full bg-[#ba1a1a] rounded-t-lg transition-all duration-1000" style="height: ${Math.min(100, (stats.purchases/stats.pageViews)*400)}px;"></div>
          <span class="text-[10px] text-on-surface-variant mt-2 font-bold">Sales</span>
        </div>
      </div>
    </div>

    <!-- Review Moderation Section -->
    <div class="mb-8">
      <h4 class="font-bold text-base mb-4 text-on-background flex justify-between items-center">
        <span>Review Moderation</span>
        <span class="text-xs font-semibold text-on-surface-variant">Total: ${reviews.length}</span>
      </h4>
      <div class="space-y-4 max-h-60 overflow-y-auto pr-2">
        ${reviews.length === 0 ? '<p class="text-sm text-on-surface-variant">No reviews found.</p>' : reviews.map(r => `
          <div class="p-4 rounded-xl border border-on-background/5 bg-background flex justify-between items-start">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="font-bold text-sm text-on-background">${r.author}</span>
                <span class="text-[10px] text-primary font-bold bg-primary-container/20 px-2 py-0.5 rounded-full">${r.rating}★</span>
                ${r.approved ? '<span class="text-[9px] text-[#5e6100] border border-[#5e6100]/30 px-1.5 py-0.2 rounded-full font-bold">Approved</span>' : '<span class="text-[9px] text-error border border-error/30 px-1.5 py-0.2 rounded-full font-bold">Pending</span>'}
              </div>
              <p class="text-xs text-on-surface-variant">${r.text}</p>
            </div>
            <div class="flex gap-2 ml-4">
              ${!r.approved ? `<button onclick="approveAdminReview('${r.id}')" class="text-[10px] bg-primary text-white font-bold px-3 py-1 rounded-full active:scale-95 transition-all">Approve</button>` : ''}
              <button onclick="deleteAdminReview('${r.id}')" class="text-[10px] border border-error text-error font-bold px-3 py-1 rounded-full active:scale-95 transition-all">Delete</button>
            </div>
          </div>
        `).join("")}
      </div>
    </div>

    <!-- Contact Submissions Section -->
    <div class="mb-4">
      <h4 class="font-bold text-base mb-4 text-on-background flex justify-between items-center">
        <span>Contact Messages</span>
        <span class="text-xs font-semibold text-on-surface-variant">Total: ${contacts.length}</span>
      </h4>
      <div class="space-y-4 max-h-60 overflow-y-auto pr-2">
        ${contacts.length === 0 ? '<p class="text-sm text-on-surface-variant">No contact form messages.</p>' : contacts.map(c => `
          <div class="p-4 rounded-xl border border-on-background/5 bg-background flex justify-between items-start">
            <div>
              <p class="font-bold text-sm text-on-background mb-1">${c.name} <span class="font-normal text-xs text-on-surface-variant">(${c.email})</span></p>
              <p class="text-xs text-on-surface-variant">${c.message}</p>
              <span class="text-[9px] text-on-surface-variant opacity-60 block mt-2">${new Date(c.date).toLocaleString()}</span>
            </div>
            <button onclick="deleteAdminContact('${c.id}')" class="text-[10px] border border-error text-error font-bold px-3 py-1 rounded-full active:scale-95 transition-all ml-4">Delete</button>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function approveAdminReview(id) {
  ReviewService.approveReview(id);
  renderAdminDashboard();
}

function deleteAdminReview(id) {
  ReviewService.deleteReview(id);
  renderAdminDashboard();
}

function deleteAdminContact(id) {
  ContactService.deleteSubmission(id);
  renderAdminDashboard();
}

// Map clicks to window handlers
window.toggleCart = toggleCart;
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateCartQuantity = updateCartQuantity;
window.checkoutCart = checkoutCart;
window.toggleTheme = toggleTheme;
window.openQuiz = openQuiz;
window.closeQuiz = closeQuiz;
window.handleQuizAnswer = handleQuizAnswer;
window.handleContactForm = handleContactForm;
window.resetContactForm = resetContactForm;
window.toggleAdmin = toggleAdmin;
window.approveAdminReview = approveAdminReview;
window.deleteAdminReview = deleteAdminReview;
window.deleteAdminContact = deleteAdminContact;

// -------------------------------------------------------------
// APPLICATION INITIALIZATION
// -------------------------------------------------------------
function init() {
  preloadImages();
  resizeCanvas();
  handleScroll();
  requestAnimationFrame(tick);
  
  // Custom Modules Setup
  setupShowcaseDrag();
  initCart();
  initTheme();
  
  // Track page view event
  AnalyticsService.logEvent("pageView");
}

window.addEventListener("resize", resizeCanvas);
window.addEventListener("scroll", handleScroll);

// Kick off initialization
init();
