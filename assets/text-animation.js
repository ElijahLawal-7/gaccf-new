const slides = document.querySelectorAll('.slidery-content');
  let currentSlide = 0;

  function showSlide(index) {
    slides.forEach((slide, i) => {
      slide.style.display = i === index ? 'flex' : 'none';
    });
  }

  function nextSlide() {
    currentSlide = (currentSlide + 1) % slides.length;
    showSlide(currentSlide);
  }

  // Initial display
  showSlide(currentSlide);

  // Change slide every 5 seconds
  setInterval(nextSlide, 3000);