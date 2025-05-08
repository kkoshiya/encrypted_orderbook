document.addEventListener('DOMContentLoaded', function() {
  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      
      const targetId = this.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 80, // Offset for fixed header
          behavior: 'smooth'
        });
      }
    });
  });
  
  // Add animation to feature cards on scroll
  const featureCards = document.querySelectorAll('.feature-card');
  const animateOnScroll = function() {
    featureCards.forEach(card => {
      const cardPosition = card.getBoundingClientRect().top;
      const screenPosition = window.innerHeight / 1.3;
      
      if (cardPosition < screenPosition) {
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }
    });
  };
  
  // Set initial state for animation
  featureCards.forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  });
  
  // Run animation on load and scroll
  animateOnScroll();
  window.addEventListener('scroll', animateOnScroll);
  
  // Demo button functionality (placeholder)
  const demoButton = document.querySelector('.demo-button');
  if (demoButton) {
    demoButton.addEventListener('click', function(e) {
      e.preventDefault();
      alert('The demo will be available soon. Please check back later!');
    });
  }
});
