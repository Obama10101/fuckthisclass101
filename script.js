let isDefaultBackground = true;

function changeBackground() {
  // Get the button
  const button = document.querySelector('button');
  button.disabled = true;
  
  // Play the audio
  const audio = document.getElementById("myAudio");
  audio.play();
  
  // Create jumpscare element
  createJumpscare();
  
  // Trigger black hole chaos
  triggerBlackHoleChaos();
  
  // Re-enable button after a short delay
  setTimeout(() => {
    button.disabled = false;
  }, 5500);
}

function createJumpscare() {
  // Get button position for initial jumpscare position
  const button = document.querySelector('button');
  const buttonRect = button.getBoundingClientRect();
  
  // Create jumpscare element
  const jumpscare = document.createElement('div');
  jumpscare.style.position = 'fixed';
  jumpscare.style.zIndex = '9999'; // Above everything
  jumpscare.style.left = buttonRect.left + (buttonRect.width / 2) + 'px';
  jumpscare.style.top = buttonRect.top + (buttonRect.height / 2) + 'px';
  jumpscare.style.width = '0px';
  jumpscare.style.height = '0px';
  jumpscare.style.transform = 'translate(-50%, -50%)';
  jumpscare.style.transition = 'all 1.5s cubic-bezier(0.23, 1, 0.32, 1.5)';
  jumpscare.style.backgroundImage = 'url("images/image.png")';
  jumpscare.style.backgroundSize = 'cover';
  jumpscare.style.backgroundPosition = 'center';
  jumpscare.style.pointerEvents = 'none';
  
  // Add to DOM
  document.body.appendChild(jumpscare);
  
  // Force reflow for transition to work
  void jumpscare.offsetWidth;
  
  // Expand to full screen
  requestAnimationFrame(() => {
    jumpscare.style.width = '100vw';
    jumpscare.style.height = '100vh';
    jumpscare.style.left = '50%';
    jumpscare.style.top = '50%';
  });
  
  // After 2.5 seconds, fade out and remove
  setTimeout(() => {
    jumpscare.style.opacity = '0';
    
    // Remove from DOM after fade
    setTimeout(() => {
      document.body.removeChild(jumpscare);
    }, 1000);
  }, 2500);
}

function getRandomColor() {
  return '#' + Math.floor(Math.random()*16777215).toString(16);
}