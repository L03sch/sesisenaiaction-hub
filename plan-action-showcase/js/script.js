// Logo click to scroll to top
const logoLink = document.getElementById('logo-link');
if (logoLink) {
    logoLink.addEventListener('click', function (e) {
        e.preventDefault();
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Smooth scroll behavior for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Intersection Observer for animations on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver(function (entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe all animatable elements
document.querySelectorAll('.feature-card, .testimonial-card, .pricing-card, .section-title').forEach(el => {
    observer.observe(el);
});

// Navbar scroll effect
let lastScrollTop = 0;
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', function () {
    let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    if (scrollTop > 100) {
        navbar.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
    } else {
        navbar.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
    }
    
    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
});

// CTA Button Interactions
const buttons = document.querySelectorAll('.btn');
buttons.forEach(button => {
    button.addEventListener('mouseenter', function () {
        this.style.transform = 'translateY(-2px)';
    });
    
    button.addEventListener('mouseleave', function () {
        this.style.transform = 'translateY(0)';
    });
});

// Add scroll progress indicator
function updateScrollProgress() {
    const scrollProgress = document.querySelector('.scroll-progress');
    if (!scrollProgress) {
        const progress = document.createElement('div');
        progress.className = 'scroll-progress';
        document.body.appendChild(progress);
        return progress;
    }
    return scrollProgress;
}

const progressBar = updateScrollProgress();

window.addEventListener('scroll', function () {
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = window.scrollY;
    const progress = (scrolled / scrollHeight) * 100;
    
    if (progressBar) {
        progressBar.style.width = progress + '%';
    }
});

// Counter animation for stats (if needed)
function animateCounter(element, target, duration = 2000) {
    let current = 0;
    const increment = target / (duration / 16);
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);
}

// Parallax effect for hero section
const heroSection = document.querySelector('.hero');
if (heroSection) {
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const elements = heroSection.querySelectorAll('.hero-card, .hero-text');
        
        elements.forEach(el => {
            if (el.classList.contains('hero-card')) {
                el.style.transform = `translateY(${scrolled * 0.5}px)`;
            } else if (el.classList.contains('hero-text')) {
                el.style.transform = `translateY(${scrolled * 0.3}px)`;
            }
        });
    });
}

// Form validation (for future contact form)
function setupFormValidation(formSelector) {
    const form = document.querySelector(formSelector);
    if (!form) return;
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        
        // Basic validation
        if (!data.email || !data.email.includes('@')) {
            alert('Por favor, insira um email válido');
            return;
        }
        
        // Here you would typically send the data to a server
        console.log('Form data:', data);
        alert('Obrigado! Sua mensagem foi recebida.');
        form.reset();
    });
}

// Lazy load images
function setupLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.add('loaded');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

// Initialize lazy loading on page load
document.addEventListener('DOMContentLoaded', setupLazyLoading);

// Add active state to nav links based on scroll position
// Commented out as navbar no longer has navigation menu
/*
function updateActiveNavLink() {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-menu a[href^="#"]');
    
    const scrollPosition = window.scrollY + 100;
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        
        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
            const sectionId = section.getAttribute('id');
            
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${sectionId}`) {
                    link.classList.add('active');
                }
            });
        }
    });
}

window.addEventListener('scroll', updateActiveNavLink);
*/

// Copy to clipboard functionality
function setupCopyToClipboard(selector, text) {
    const elements = document.querySelectorAll(selector);
    
    elements.forEach(el => {
        el.addEventListener('click', () => {
            navigator.clipboard.writeText(text);
            const originalText = el.textContent;
            el.textContent = 'Copiado!';
            
            setTimeout(() => {
                el.textContent = originalText;
            }, 2000);
        });
    });
}

// Intersection Observer for creating visible elements on scroll
const visibilityObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, {
    threshold: 0.1
});

// Add performance monitoring
function logPerformance() {
    if (window.performance && window.performance.timing) {
        const perfData = window.performance.timing;
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
        
        console.log(`Page Load Time: ${pageLoadTime}ms`);
        
        if (perfData.loadEventEnd > 3000) {
            console.warn('Page load time is slow. Consider optimizing assets.');
        }
    }
}

window.addEventListener('load', logPerformance);

// Resize observer for responsive adjustments
const resizeObserver = new ResizeObserver(entries => {
    for (let entry of entries) {
        const width = entry.contentRect.width;
        
        if (width < 768) {
            document.body.classList.add('mobile');
        } else {
            document.body.classList.remove('mobile');
        }
    }
});

resizeObserver.observe(document.body);

// Export functions for external use
window.PlanActionUtils = {
    animateCounter,
    setupFormValidation,
    setupLazyLoading,
    setupCopyToClipboard
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('Plan-Action Showcase loaded successfully');
    
    // Add any additional initialization code here
    updateActiveNavLink();
});

// Service Worker registration (optional for PWA functionality)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {
            console.log('Service Worker not registered');
        });
    });
}
