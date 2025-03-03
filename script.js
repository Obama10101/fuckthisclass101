// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Animate the headline: slide in from the left with a fade
  gsap.from("h1", {
    x: -100, 
    opacity: 0, 
    duration: 1, 
    ease: "power4.out"
  });

  // Animate the description text: slide in from bottom with a fade
  gsap.from("p", {
    y: 50, 
    opacity: 0, 
    duration: 1, 
    delay: 0.3, 
    ease: "power4.out"
  });

  // Animate the CTA button: scale up from zero with a bounce effect
  gsap.from("a.inline-block", {
    scale: 0, 
    opacity: 0, 
    duration: 0.8, 
    delay: 0.6, 
    ease: "back.out(1.7)"
  });

  // Animate the image: pop in from the right with slight rotation
  gsap.from("#hero-image", {
    x: 100, 
    rotation: 5, 
    opacity: 0, 
    duration: 1, 
    delay: 0.8, 
    ease: "power4.out"
  });
});
