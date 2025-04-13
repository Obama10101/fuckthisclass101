// Black hole visualization using Three.js
let scene, camera, renderer;
let blackHole, accretionDisk;
let stars = [];
let particles = [];
let imageObjects = [];
const particleCount = 12000;
let mouseX = 0, mouseY = 0;
let isInChaosMode = false;
let normalGravity = 0.15;
let chaosGravity = 0.5;
let normalDiskSpeed = 0.002;
let chaosDiskSpeed = 0.01;
let normalParticleRespawnRadius = 40;
let chaosParticleRespawnRadius = 20;
let imageTexture;

function init3DBlackHole() {
  // Create scene
  scene = new THREE.Scene();
  
  // Set up camera
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.position.z = 30;
  
  // Set up renderer to cover entire page
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 1); // Pure black background
  document.body.appendChild(renderer.domElement);
  
  // Set renderer to fixed position covering entire page
  renderer.domElement.style.position = 'fixed';
  renderer.domElement.style.top = '0';
  renderer.domElement.style.left = '0';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  renderer.domElement.style.zIndex = '-1';
  renderer.domElement.style.pointerEvents = 'none';
  
  // Load image texture
  const textureLoader = new THREE.TextureLoader();
  textureLoader.load('images/image.png', function(texture) {
    imageTexture = texture;
    
    // Create starfield background
    createStarfield();
    
    // Create black hole
    createBlackHole();
    
    // Create accretion disk
    createAccretionDisk();
    
    // Create swirling particles
    createParticles();
    
    // Add subtle ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(0, 0, 1);
    scene.add(directionalLight);
    
    // Add event listeners
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('mousemove', onMouseMove);
    
    // Start animation
    animate();
  });
}

function createStarfield() {
  // Create a large sphere geometry for stars
  const starGeometry = new THREE.BufferGeometry();
  const starMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.7,
    transparent: true,
    blending: THREE.AdditiveBlending
  });
  
  // Create stars positioned randomly in a sphere
  const starPositions = [];
  const starColors = [];
  
  for (let i = 0; i < 10000; i++) {
    // Create stars in a spherical distribution
    const radius = Math.random() * 1000 + 50;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);
    
    starPositions.push(x, y, z);
    
    // Create different star colors
    const starType = Math.random();
    if (starType > 0.95) {
      // Blue stars
      starColors.push(0.7, 0.8, 1.0);
    } else if (starType > 0.8) {
      // White stars
      starColors.push(1.0, 1.0, 1.0);
    } else if (starType > 0.6) {
      // Yellow stars
      starColors.push(1.0, 0.9, 0.7);
    } else {
      // Red stars
      starColors.push(1.0, 0.7, 0.7);
    }
  }
  
  starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
  starGeometry.setAttribute('color', new THREE.Float32BufferAttribute(starColors, 3));
  starMaterial.vertexColors = true;
  
  const starField = new THREE.Points(starGeometry, starMaterial);
  scene.add(starField);
}

function createBlackHole() {
  // Event horizon (black sphere)
  const blackHoleGeometry = new THREE.SphereGeometry(5, 32, 32);
  const blackHoleMaterial = new THREE.MeshBasicMaterial({ 
    color: 0x000000,
    transparent: true,
    opacity: 0.98
  });
  
  blackHole = new THREE.Mesh(blackHoleGeometry, blackHoleMaterial);
  blackHole.position.set(0, 0, 0);
  scene.add(blackHole);
  
  // Add gravitational lensing effect (distortion sphere)
  const lensGeometry = new THREE.SphereGeometry(7, 32, 32);
  const lensMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.6,
    side: THREE.BackSide
  });
  
  const lensEffect = new THREE.Mesh(lensGeometry, lensMaterial);
  lensEffect.position.set(0, 0, 0);
  scene.add(lensEffect);
}

function createAccretionDisk() {
  // Create accretion disk
  const diskGeometry = new THREE.RingGeometry(8, 20, 64);
  
  // Create custom shader material for the accretion disk
  const diskMaterial = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      varying vec2 vUv;
      
      void main() {
        // Calculate radius from center (0.5, 0.5)
        float radius = length(vUv - vec2(0.5, 0.5)) * 2.0;
        
        // Angular position
        float angle = atan(vUv.y - 0.5, vUv.x - 0.5);
        
        // Change to darker, more authentic black hole colors
        vec3 innerColor = vec3(0.6, 0.4, 0.1);  // Warm inner glow
        vec3 midColor = vec3(0.3, 0.2, 0.1);    // Dark orange/brown
        vec3 outerColor = vec3(0.1, 0.05, 0.1); // Near black with slight purple
        
        // Interpolate colors based on radius
        vec3 color;
        float normRadius = (radius - 0.4) / 0.6; // Normalize 0.4-1.0 to 0.0-1.0
        if (normRadius < 0.5) {
          color = mix(innerColor, midColor, normRadius * 2.0);
        } else {
          color = mix(midColor, outerColor, (normRadius - 0.5) * 2.0);
        }
        
        // Add turbulent patterns
        float turbulence = sin(angle * 20.0 + time * 2.0) * 0.1 +
                           sin(angle * 15.0 - time * 3.0) * 0.1 +
                           sin(angle * 10.0 + time * 1.0) * 0.1;
        
        // Reduce brightness overall
        float brightness = 0.5 + turbulence;
        
        // Distance-based transparency for inner and outer edges
        float alpha = smoothstep(0.0, 0.1, normRadius) * (1.0 - smoothstep(0.9, 1.0, normRadius));
        alpha *= brightness * 0.8; // Make it more transparent
        
        gl_FragColor = vec4(color * brightness, alpha);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending
  });
  
  accretionDisk = new THREE.Mesh(diskGeometry, diskMaterial);
  accretionDisk.rotation.x = Math.PI / 3; // Tilt the disk
  scene.add(accretionDisk);
}

function createParticles() {
  // Create particles that flow into the black hole
  const particleGeometry = new THREE.BufferGeometry();
  
  // Arrays for particle attributes
  const positions = new Float32Array(particleCount * 3);
  const velocities = new Float32Array(particleCount * 3);
  const accelerations = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);
  const colors = new Float32Array(particleCount * 3);
  
  // Initialize particles in a spherical distribution
  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    
    // Position particles in a spherical shell
    const radius = 15 + Math.random() * 30;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    
    positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i3 + 2] = radius * Math.cos(phi);
    
    // Initial velocities - tangential to create orbit
    const orbitSpeed = 0.02 + Math.random() * 0.03;
    
    // Create velocity perpendicular to radius vector for orbital motion
    velocities[i3] = -positions[i3 + 1] * orbitSpeed;
    velocities[i3 + 1] = positions[i3] * orbitSpeed;
    velocities[i3 + 2] = 0;
    
    // Particle sizes
    sizes[i] = Math.random() * 0.5 + 0.1;
    
    // Particle colors based on distance
    const colorType = Math.random();
    if (colorType > 0.8) {
      // White/yellow stars
      colors[i3] = 0.9;
      colors[i3 + 1] = 0.9;
      colors[i3 + 2] = 0.8;
    } else if (colorType > 0.5) {
      // Warm yellow/orange
      colors[i3] = 0.8;
      colors[i3 + 1] = 0.6;
      colors[i3 + 2] = 0.2;
    } else {
      // Darker reddish
      colors[i3] = 0.6;
      colors[i3 + 1] = 0.3;
      colors[i3 + 2] = 0.2;
    }
    
    // Store reference to particle data
    particles.push({
      position: [positions[i3], positions[i3 + 1], positions[i3 + 2]],
      velocity: [velocities[i3], velocities[i3 + 1], velocities[i3 + 2]],
      acceleration: [0, 0, 0],
      size: sizes[i],
      color: [colors[i3], colors[i3 + 1], colors[i3 + 2]],
      index: i3
    });
  }
  
  // Set attributes
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  
  // Custom shader material for particles
  const particleMaterial = new THREE.ShaderMaterial({
    uniforms: {
      pointTexture: { value: createParticleTexture() }
    },
    vertexShader: `
      attribute float size;
      attribute vec3 color;
      varying vec3 vColor;
      
      void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (200.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform sampler2D pointTexture;
      varying vec3 vColor;
      
      void main() {
        gl_FragColor = vec4(vColor, 1.0) * texture2D(pointTexture, gl_PointCoord);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  
  const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particleSystem);
}

function createParticleTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  
  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.3, 'rgba(255,255,255,0.8)');
  gradient.addColorStop(0.7, 'rgba(200,200,255,0.3)');
  gradient.addColorStop(1, 'rgba(100,100,200,0)');
  
  context.fillStyle = gradient;
  context.fillRect(0, 0, 64, 64);
  
  const texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function onMouseMove(event) {
  // Calculate mouse position in normalized device coordinates
  mouseX = (event.clientX / window.innerWidth) * 2 - 1;
  mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function updateParticles() {
  const positions = scene.children[3].geometry.attributes.position.array;
  
  // Use appropriate gravity based on mode
  const gravitationalBase = isInChaosMode ? chaosGravity : normalGravity;
  const respawnRadius = isInChaosMode ? chaosParticleRespawnRadius : normalParticleRespawnRadius;
  
  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    const particle = particles[i];
    
    // Current position
    const x = positions[i3];
    const y = positions[i3 + 1];
    const z = positions[i3 + 2];
    
    // Distance to black hole
    const distanceToCenter = Math.sqrt(x*x + y*y + z*z);
    
    // Calculate gravitational acceleration toward black hole
    // Gravity increases as particles get closer
    const gravitationalStrength = gravitationalBase / Math.max(0.5, distanceToCenter);
    
    // Direction to black hole
    const dx = -x;
    const dy = -y;
    const dz = -z;
    
    // Normalize direction
    const invDist = 1 / distanceToCenter;
    const dirX = dx * invDist;
    const dirY = dy * invDist;
    const dirZ = dz * invDist;
    
    // Set acceleration toward black hole
    particle.acceleration[0] = dirX * gravitationalStrength;
    particle.acceleration[1] = dirY * gravitationalStrength;
    particle.acceleration[2] = dirZ * gravitationalStrength;
    
    // Add chaos if in chaos mode
    if (isInChaosMode) {
      // Add random forces
      particle.acceleration[0] += (Math.random() - 0.5) * 0.05;
      particle.acceleration[1] += (Math.random() - 0.5) * 0.05;
      particle.acceleration[2] += (Math.random() - 0.5) * 0.05;
    }
    
    // Update velocity with acceleration
    particle.velocity[0] += particle.acceleration[0];
    particle.velocity[1] += particle.acceleration[1];
    particle.velocity[2] += particle.acceleration[2];
    
    // Update position
    positions[i3] += particle.velocity[0];
    positions[i3 + 1] += particle.velocity[1];
    positions[i3 + 2] += particle.velocity[2];
    
    // If particle is too close to the black hole, respawn it
    if (distanceToCenter < 5) {
      // Respawn particle at a random position far from black hole
      const radius = respawnRadius + Math.random() * 10;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);
      
      // Reset velocity
      const orbitSpeed = 0.02 + Math.random() * 0.03;
      particle.velocity[0] = -positions[i3 + 1] * orbitSpeed;
      particle.velocity[1] = positions[i3] * orbitSpeed;
      particle.velocity[2] = 0;
    }
  }
  
  // Update the particle positions in the geometry
  scene.children[3].geometry.attributes.position.needsUpdate = true;
}

// Function to create a 3D plane with the image texture
function createImageObject(position, velocity, angularVelocity) {
  const size = 3 + Math.random() * 3;
  const planeGeometry = new THREE.PlaneGeometry(size, size);
  const planeMaterial = new THREE.MeshBasicMaterial({
    map: imageTexture,
    transparent: true,
    side: THREE.DoubleSide
  });
  
  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.position.set(position.x, position.y, position.z);
  
  // Store image object data
  const imageObject = {
    mesh: plane,
    velocity: velocity,
    angularVelocity: angularVelocity
  };
  
  imageObjects.push(imageObject);
  scene.add(plane);
  
  return imageObject;
}

// Create multiple image objects
function spawnImageObjects(count) {
  // Remove old image objects
  for (let i = imageObjects.length - 1; i >= 0; i--) {
    scene.remove(imageObjects[i].mesh);
  }
  imageObjects = [];
  
  // Create new image objects
  for (let i = 0; i < count; i++) {
    // Position images in a spherical shell around black hole
    const radius = 15 + Math.random() * 10;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    
    const position = {
      x: radius * Math.sin(phi) * Math.cos(theta),
      y: radius * Math.sin(phi) * Math.sin(theta),
      z: radius * Math.cos(phi)
    };
    
    // Random velocity
    const velocity = {
      x: (Math.random() - 0.5) * 0.5,
      y: (Math.random() - 0.5) * 0.5,
      z: (Math.random() - 0.5) * 0.5
    };
    
    // Random rotation
    const angularVelocity = {
      x: (Math.random() - 0.5) * 0.1,
      y: (Math.random() - 0.5) * 0.1,
      z: (Math.random() - 0.5) * 0.1
    };
    
    createImageObject(position, velocity, angularVelocity);
  }
}

// Update images
function updateImageObjects() {
  for (let i = 0; i < imageObjects.length; i++) {
    const obj = imageObjects[i];
    
    // Update position
    obj.mesh.position.x += obj.velocity.x;
    obj.mesh.position.y += obj.velocity.y;
    obj.mesh.position.z += obj.velocity.z;
    
    // Update rotation
    obj.mesh.rotation.x += obj.angularVelocity.x;
    obj.mesh.rotation.y += obj.angularVelocity.y;
    obj.mesh.rotation.z += obj.angularVelocity.z;
    
    // Apply gravitational pull toward black hole
    const distance = Math.sqrt(
      obj.mesh.position.x * obj.mesh.position.x +
      obj.mesh.position.y * obj.mesh.position.y +
      obj.mesh.position.z * obj.mesh.position.z
    );
    
    const gravityStrength = isInChaosMode ? 0.02 : 0.005;
    const gravity = gravityStrength / Math.max(1, distance);
    
    // Direction toward black hole
    const dx = -obj.mesh.position.x;
    const dy = -obj.mesh.position.y;
    const dz = -obj.mesh.position.z;
    
    // Normalize and apply gravity
    const invDist = 1 / distance;
    obj.velocity.x += dx * invDist * gravity;
    obj.velocity.y += dy * invDist * gravity;
    obj.velocity.z += dz * invDist * gravity;
    
    // Respawn if too close to black hole
    if (distance < 6) {
      // Position far from black hole
      const radius = 40 + Math.random() * 10;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      obj.mesh.position.x = radius * Math.sin(phi) * Math.cos(theta);
      obj.mesh.position.y = radius * Math.sin(phi) * Math.sin(theta);
      obj.mesh.position.z = radius * Math.cos(phi);
      
      // Reset velocity
      obj.velocity.x = (Math.random() - 0.5) * 0.5;
      obj.velocity.y = (Math.random() - 0.5) * 0.5;
      obj.velocity.z = (Math.random() - 0.5) * 0.5;
    }
  }
}

function animate() {
  requestAnimationFrame(animate);
  
  // Rotate accretion disk
  const diskSpeed = isInChaosMode ? 0.01 : 0.002;
  accretionDisk.rotation.z += diskSpeed;
  
  // Update accretion disk shader time
  accretionDisk.material.uniforms.time.value += isInChaosMode ? 0.05 : 0.01;
  
  // Rotate black hole
  blackHole.rotation.y += isInChaosMode ? 0.005 : 0.001;
  
  // Camera shake during chaos
  if (isInChaosMode) {
    camera.position.x += (Math.random() - 0.5) * 0.5;
    camera.position.y += (Math.random() - 0.5) * 0.5;
  }
  
  // Update particles
  if (scene.children.length > 3) {
    updateParticles();
  }
  
  // Update image objects
  updateImageObjects();
  
  // Slightly move camera based on mouse
  camera.position.x += (mouseX * (isInChaosMode ? 4 : 2) - camera.position.x) * 0.01;
  camera.position.y += (mouseY * (isInChaosMode ? 4 : 2) - camera.position.y) * 0.01;
  camera.lookAt(scene.position);
  
  renderer.render(scene, camera);
}

// Trigger black hole chaos mode
function triggerBlackHoleChaos() {
  isInChaosMode = true;
  console.log("Black hole chaos triggered!");
  
  // Spawn a bunch of image objects
  spawnImageObjects(30);
  
  // Add explosion effect
  createExplosion();
  
  // Return to normal after 5 seconds
  setTimeout(() => {
    isInChaosMode = false;
  }, 5000);
}

// Create explosion effect
function createExplosion() {
  // Create burst particles from center
  const burstCount = 100;
  const burstGeometry = new THREE.BufferGeometry();
  const burstPositions = new Float32Array(burstCount * 3);
  const burstSizes = new Float32Array(burstCount);
  const burstColors = new Float32Array(burstCount * 3);
  
  // Initialize burst particles
  for (let i = 0; i < burstCount; i++) {
    const i3 = i * 3;
    // Start at center
    burstPositions[i3] = 0;
    burstPositions[i3 + 1] = 0;
    burstPositions[i3 + 2] = 0;
    
    // Large sizes
    burstSizes[i] = Math.random() * 2 + 1;
    
    // Change from blue to orange/yellow for more authentic accretion look
    burstColors[i3] = 0.8;     // More red
    burstColors[i3 + 1] = 0.5; // Medium green
    burstColors[i3 + 2] = 0.2; // Less blue
  }
  
  // Set attributes
  burstGeometry.setAttribute('position', new THREE.BufferAttribute(burstPositions, 3));
  burstGeometry.setAttribute('size', new THREE.BufferAttribute(burstSizes, 1));
  burstGeometry.setAttribute('color', new THREE.BufferAttribute(burstColors, 3));
  
  // Material
  const burstMaterial = new THREE.PointsMaterial({
    size: 2,
    color: 0xffaa00,
    transparent: true,
    blending: THREE.AdditiveBlending
  });
  
  const burstSystem = new THREE.Points(burstGeometry, burstMaterial);
  scene.add(burstSystem);
  
  // Animate burst
  const burstVelocities = [];
  for (let i = 0; i < burstCount; i++) {
    // Random direction
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const vx = Math.sin(phi) * Math.cos(theta);
    const vy = Math.sin(phi) * Math.sin(theta);
    const vz = Math.cos(phi);
    
    // High speed
    const speed = Math.random() * 2 + 1;
    burstVelocities.push({
      x: vx * speed,
      y: vy * speed,
      z: vz * speed
    });
  }
  
  // Animation function
  let burstFrame = 0;
  function animateBurst() {
    if (burstFrame > 60) { // Remove after 60 frames
      scene.remove(burstSystem);
      return;
    }
    
    burstFrame++;
    const positions = burstSystem.geometry.attributes.position.array;
    const sizes = burstSystem.geometry.attributes.size.array;
    
    for (let i = 0; i < burstCount; i++) {
      const i3 = i * 3;
      
      // Update position
      positions[i3] += burstVelocities[i].x;
      positions[i3 + 1] += burstVelocities[i].y;
      positions[i3 + 2] += burstVelocities[i].z;
      
      // Shrink particles
      sizes[i] *= 0.98;
    }
    
    burstSystem.geometry.attributes.position.needsUpdate = true;
    burstSystem.geometry.attributes.size.needsUpdate = true;
    
    requestAnimationFrame(animateBurst);
  }
  
  animateBurst();
}

// Initialize immediately on DOMContentLoaded
window.addEventListener('DOMContentLoaded', init3DBlackHole);