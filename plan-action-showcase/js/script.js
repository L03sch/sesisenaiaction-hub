const progressBar = document.querySelector('.scroll-progress');

function updateScrollProgress() {
    const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollableHeight > 0 ? (window.scrollY / scrollableHeight) * 100 : 0;
    if (progressBar) progressBar.style.width = `${progress}%`;
}

window.addEventListener('scroll', updateScrollProgress, { passive: true });
updateScrollProgress();

document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
        const target = document.querySelector(link.getAttribute('href'));
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});

const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal, .feature-card').forEach((element) => revealObserver.observe(element));

if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.classList.add('reduced-motion');
}