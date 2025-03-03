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

// Audio playback on button click
const audio = document.getElementById('bg-music');
const joinBtn = document.querySelector('a.inline-block');  // CTA button

// GSAP chaotic animation
const shockTl = gsap.timeline({ paused: true });

shockTl.to('body', {
  duration: 0.2, x: -10, repeat: 5, yoyo: true, ease: "power2.inOut"
}, 0);

shockTl.to('h1', {
  duration: 0.5, scale: 1.5, rotation: 15, color: "#ff0000",
  ease: "rough({ strength: 2, points: 20, taper: 'none', randomize: true })",
  yoyo: true, repeat: 1
}, 0);

shockTl.to('#flash-overlay', {
  opacity: 1, duration: 0.1, yoyo: true, repeat: 1
}, 0.05);

// Trigger music and animations
joinBtn.addEventListener('click', () => {
  audio.play();
  shockTl.restart();  // always restart to play again if clicked multiple times
});
