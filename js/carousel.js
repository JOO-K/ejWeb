document.addEventListener("DOMContentLoaded", () => {
    let hasInitialized = false; // Flag to prevent multiple initializations
    const eventTimeout = setTimeout(() => {
        console.warn('"allPartsLoaded" event did not fire within 10 seconds, forcing initialization...');
        if (!hasInitialized) {
            initializeCarousel();
        }
    }, 10000);

    $(document).on("allPartsLoaded", () => {
        clearTimeout(eventTimeout);
        if (!hasInitialized) {
            initializeCarousel();
        }
    });

    function initializeCarousel() {
        if (hasInitialized) {
            return;
        }
        hasInitialized = true;

        if (!window.THREE) {
            console.error("Three.js is not loaded. Please ensure three.min.js is included.");
            return;
        }

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const canvas = document.getElementById("carouselCanvas");
        if (!canvas) {
            console.error("Canvas element with ID 'carouselCanvas' not found.");
            return;
        }

        const initialWidth = window.innerWidth;
        const initialHeight = window.innerHeight;

        const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
        renderer.setSize(initialWidth, initialHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setClearColor(0xe0e0e0, 0);

        // Setup Render Target for Post-Processing (for ASCII effect)
        const renderTarget = new THREE.WebGLRenderTarget(initialWidth, initialHeight, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat,
            stencilBuffer: false
        });

        // Custom ASCII-Like Shader with Color and Transparency Support (for backgroundIndex === 2)
        const asciiShaderMaterial = new THREE.ShaderMaterial({
            uniforms: {
                tDiffuse: { value: renderTarget.texture },
                resolution: { value: new THREE.Vector2(initialWidth, initialHeight) },
                charSize: { value: 15.0 } // Controls the size of the "characters"
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform vec2 resolution;
                uniform float charSize;
                varying vec2 vUv;

                void main() {
                    vec2 pixelSize = charSize / resolution;
                    vec2 cell = floor(vUv / pixelSize) * pixelSize;
                    vec2 cellUv = fract(vUv / pixelSize);

                    // Sample the scene texture
                    vec4 color = texture2D(tDiffuse, cell);

                    // Discard fully transparent pixels to preserve the background
                    if (color.a < 0.01) {
                        discard;
                    }

                    // Quantize each color channel separately to preserve colors
                    vec3 asciiColor = floor(color.rgb * 5.0) / 5.0; // Quantize into 5 levels per channel

                    // Add a simple grid-like pattern to simulate character boundaries
                    float edge = step(0.9, max(cellUv.x, cellUv.y));
                    asciiColor *= (1.0 - edge);

                    gl_FragColor = vec4(asciiColor, color.a);
                }
            `,
            transparent: true
        });

        // Full-screen quad for post-processing (for ASCII effect)
        const asciiScene = new THREE.Scene();
        const asciiCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        const asciiQuad = new THREE.Mesh(
            new THREE.PlaneGeometry(2, 2),
            asciiShaderMaterial
        );
        asciiScene.add(asciiQuad);

        const gl = renderer.getContext();
        const anisotropicExt = gl.getExtension('EXT_texture_filter_anisotropic') || gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic');
        if (anisotropicExt) {
            const maxAnisotropy = gl.getParameter(anisotropicExt.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
            THREE.Texture.DEFAULT_ANISOTROPY = Math.min(maxAnisotropy, 16);
        }

        canvas.style.opacity = "0";
        canvas.style.transition = "opacity 1s ease-in";
        canvas.style.pointerEvents = "none";
        canvas.style.backgroundColor = "#e0e0e0";

        const progressDialog = document.getElementById("progress-dialog");
        const progressIndicator = document.getElementById("progress-indicator");
        if (progressDialog && progressIndicator) {
            progressDialog.style.display = "block";
            progressDialog.style.backgroundColor = "#f0f0f0";
            progressIndicator.value = 0;
        }

        let initialZ, targetZ, currentZ, cameraY, controlsTargetY;
        const isMobile = initialWidth < 800;
        const zoomSpeed = isMobile ? 0.1 : 0.02;

        let controls;
        if (typeof THREE.OrbitControls !== "undefined") {
            controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableZoom = false;
            controls.enableRotate = false;
            controls.enablePan = false;
            controls.maxDistance = 8;
            controls.saveState();
            controls.update();
        }

        function updateCameraSettings() {
            if (isMobile) {
                initialZ = 6; // Start farther to allow zoom-in
                targetZ = 8; // Adjusted for 35-degree angle
                cameraY = 1; // Increased height for better top-down view
                controlsTargetY = -3; // Look at the midpoint of the scene (sphere at y=-6.2, cards at y=-3)
            } else {
                initialZ = 8;
                targetZ = 3;
                cameraY = 20;
                controlsTargetY = -5;
            }

            currentZ = initialZ;
            camera.position.set(0, cameraY, initialZ);
            camera.rotation.order = 'YXZ';
            camera.rotation.set(-(Math.PI / 180 * 35), 0, 0); // 35-degree downward tilt for both mobile and desktop

            if (controls) {
                controls.target.set(0, controlsTargetY, 0);
                controls.update();
            }
        }

        updateCameraSettings();

        const cardGeometry = new THREE.PlaneGeometry(2, 3);
        const geometryAspectRatio = 2 / 3;

        const projects = [
            { id: "project1", image: "./images/cube1.png", title: "3D Gaussian Splat", desc: "2025 Project", url: "./html/project1.html" },
            { id: "project2", image: "./images/cube2.png", title: "Touchdesigner AI", desc: "2024 Project", url: "./html/project2.html" },
            { id: "project3", image: "./images/cube3.png", title: "Title Example", desc: "SubText", url: "./html/project3.html" },
            { id: "project4", image: "./images/cube4.png", title: "Title Example", desc: "SubText", url: "./html/project4.html" },
            { id: "project5", image: "./images/cube5.png", title: "Title Example", desc: "SubText", url: "./html/project5.html" },
            { id: "project6", image: "./images/cube6.png", title: "Title Example", desc: "SubText", url: "./html/project6.html" },
            { id: "reserach1", image: "./images/cube6.png", title: "Project 7 Placeholder", desc: "SubText 7", url: "./html/researchproj.html" },
            { id: "research2", image: "./images/cube6.png", title: "Project 8 Placeholder", desc: "SubText 8", url: "./html/researchproj.html" }
        ];

        const cards = [];
        const radius = 3.2;
        const cardCount = 8;

        let loadedTextures = 0;
        const totalTextures = projects.length;
        let textureLoadTimeout;

        textureLoadTimeout = setTimeout(() => {
            console.warn("Texture loading timed out after 10 seconds, forcing initialization...");
            if (loadedTextures < totalTextures) {
                loadedTextures = totalTextures;
                initializeScene();
            }
        }, 10000);

        projects.forEach((project, index) => {
            let material;
            try {
                const texture = new THREE.TextureLoader().load(
                    project.image,
                    (loadedTexture) => {
                        loadedTextures++;
                        if (progressIndicator) {
                            progressIndicator.value = (loadedTextures / totalTextures) * 100;
                        }

                        const textureAspectRatio = loadedTexture.image.width / loadedTexture.image.height;
                        let scaleX, scaleY, offsetX, offsetY;

                        if (textureAspectRatio > geometryAspectRatio) {
                            scaleY = 1;
                            scaleX = geometryAspectRatio / textureAspectRatio;
                            offsetX = (1 - scaleX) / 2;
                            offsetY = 0;
                        } else {
                            scaleX = 1;
                            scaleY = textureAspectRatio / geometryAspectRatio;
                            offsetX = 0;
                            offsetY = (1 - scaleY) / 2;
                        }

                        loadedTexture.repeat.set(scaleX, scaleY);
                        loadedTexture.offset.set(offsetX, offsetY);
                        loadedTexture.minFilter = THREE.LinearMipmapLinearFilter;
                        loadedTexture.magFilter = THREE.NearestFilter;
                        loadedTexture.needsUpdate = true;

                        if (loadedTextures === totalTextures) {
                            clearTimeout(textureLoadTimeout);
                            initializeScene();
                        }
                    },
                    undefined,
                    (err) => {
                        console.error(`Failed to load texture for ${project.image}:`, err);
                        loadedTextures++;
                        if (progressIndicator) {
                            progressIndicator.value = (loadedTextures / totalTextures) * 100;
                        }
                        if (loadedTextures === totalTextures) {
                            clearTimeout(textureLoadTimeout);
                            initializeScene();
                        }
                    }
                );
                material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
                project.materialBasic = material;
                project.materialPhong = new THREE.MeshPhongMaterial({ map: texture, side: THREE.DoubleSide, flatShading: true });
                project.materialWireframe = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true, side: THREE.DoubleSide });
            } catch (err) {
                console.warn(`Texture loading failed for ${project.image}. Using fallback material.`, err);
                material = new THREE.MeshBasicMaterial({ color: 0x888888, side: THREE.DoubleSide });
                project.materialBasic = material;
                project.materialPhong = new THREE.MeshPhongMaterial({ color: 0x888888, side: THREE.DoubleSide, flatShading: true });
                project.materialWireframe = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true, side: THREE.DoubleSide });
                loadedTextures++;
                if (progressIndicator) {
                    progressIndicator.value = (loadedTextures / totalTextures) * 100;
                }
                if (loadedTextures === totalTextures) {
                    clearTimeout(textureLoadTimeout);
                    initializeScene();
                }
            }
            const card = new THREE.Mesh(cardGeometry, material);
            card.position.set(0, 0, 0);
            card.lookAt(0, -5, 0);
            card.userData = { project };

            // Create an HTML element for the card's coordinates
            const label = document.createElement('div');
            label.className = 'card-coord-label card-label-' + index; // Unique class for specificity
            label.style.position = 'absolute';
            label.style.color = '#00ff00'; // Same green color as bird labels
            label.style.fontFamily = 'monospace';
            label.style.fontSize = isMobile ? '4px' : '12px'; // Match bird label size
            label.style.display = 'none !important'; // Initially hidden
            label.style.opacity = '1 !important';
            label.style.visibility = 'visible !important';
            label.style.zIndex = '500'; // Inline zIndex: above canvas (1), below project containers (1009)
            label.style.textAlign = 'center';
            label.style.pointerEvents = 'none'; // Prevent interaction
            label.textContent = `Card ${index} Pos: (0.0, 0.0, 0.0)`;
            document.body.appendChild(label);
            card.userData.label = label;

            scene.add(card);
            cards.push(card);
        });

        let sphere;
        let skybox;
        let backgroundIndex = 0;
        let previousBackgroundIndex = 0; // Track the previous index for transition logic
        let pointLight1, pointLight2;
        let sphereMaterialBasic, sphereMaterialPhong, sphereMaterialWireframe;
        let skyboxMaterialBasic, skyboxMaterialPhong, skyboxMaterialWireframe;
        const backgroundPaths = [
            null,
            './images/sky3.jpg', // Wireframe scene
            './images/sky1.jpg'  // ASCII scene
        ];
        const backgroundTextures = [];

        const solidColorCanvas = document.createElement('canvas');
        solidColorCanvas.width = 512;
        solidColorCanvas.height = 512;
        const context = solidColorCanvas.getContext('2d');
        if (context) {
            context.fillStyle = '#e0e0e0';
            context.fillRect(0, 0, solidColorCanvas.width, solidColorCanvas.height);
        } else {
            console.error("Failed to get 2D context for solidColorCanvas");
        }
        const solidColorTexture = new THREE.CanvasTexture(solidColorCanvas);
        solidColorTexture.needsUpdate = true;

        backgroundPaths.forEach((path, index) => {
            if (index === 0) {
                backgroundTextures[index] = solidColorTexture;
            } else if (path) {
                const texture = new THREE.TextureLoader().load(
                    path,
                    () => { },
                    undefined,
                    (err) => console.error(`Failed to load background texture ${index}: ${path}`, err)
                );
                texture.mapping = THREE.EquirectangularReflectionMapping;
                backgroundTextures[index] = texture;
            }
        });

        // Create Birds for backgroundIndex === 0, 1, and 2 using Primitive Geometries (Enhanced Inverted W shape with bird-like features)
        const birds = [];
        const birdCount = 20;

        // Create the bird body (excluding the beak) using ShapeGeometry
        function createBirdBody() {
            const shape = new THREE.Shape();
            const scale = 0.3; // Scale down all dimensions
            const wingWidth = 0.3 * scale; // Width of each wing
            const wingHeight = 0.2 * scale; // Height of the wings
            const bodyWidth = 0.1 * scale; // Width of the body
            const headSize = 0.05 * scale; // Size of the head
            const tailLength = 0.1 * scale; // Length of the tail
            const tailWidth = 0.08 * scale; // Width of the tail
            const thickness = 0.04 * scale; // Thickness of the shape

            // Start at the left wingtip (bottom left)
            shape.moveTo(-wingWidth - bodyWidth / 2, -wingHeight);
            // Curve up to the left wing midpoint
            shape.quadraticCurveTo(-wingWidth / 2 - bodyWidth / 2, 0, -bodyWidth / 2, -wingHeight / 2);
            // Dip to the body (middle)
            shape.lineTo(-bodyWidth / 2, 0);
            // Rise to the head (top middle)
            shape.lineTo(-headSize / 2, headSize);
            // Skip the beak (we'll add it separately)
            shape.lineTo(0, headSize);
            shape.lineTo(headSize / 2, headSize);
            shape.lineTo(bodyWidth / 2, 0);
            // Curve up to the right wing midpoint
            shape.quadraticCurveTo(wingWidth / 2 + bodyWidth / 2, 0, wingWidth + bodyWidth / 2, -wingHeight);
            // Back to the body (right side)
            shape.lineTo(bodyWidth / 2, 0);
            // Add the tail (extend backward)
            shape.lineTo(tailWidth / 2, -tailLength);
            shape.lineTo(-tailWidth / 2, -tailLength);
            shape.lineTo(-bodyWidth / 2, 0);
            // Close the shape
            shape.lineTo(-wingWidth - bodyWidth / 2, -wingHeight);

            // Extrude the shape to give it some thickness
            const extrudeSettings = {
                steps: 1,
                depth: thickness,
                bevelEnabled: false
            };
            const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
            const material = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }); // White body
            const wireframeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true, side: THREE.DoubleSide });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.userData = { wireframeMaterial };
            return mesh;
        }

        // Create the beak as a separate ShapeGeometry
        function createBirdBeak() {
            const shape = new THREE.Shape();
            const scale = 0.5; // Scale down all dimensions by 50%
            const headSize = 0.05 * scale; // Size of the head (matches the body)
            const beakLength = 0.01 * scale; // Already 1/3 of original, now scaled down further
            const beakHeight = headSize / 2; // Height of the beak
            const thickness = 0.02 * scale; // Thickness of the shape

            // Define the beak as a triangle
            shape.moveTo(0, headSize); // Base of the beak (center of head)
            shape.lineTo(beakLength, headSize - beakHeight / 2); // Tip of the beak
            shape.lineTo(0, headSize - beakHeight); // Bottom of the beak
            shape.lineTo(0, headSize); // Close the shape

            // Extrude the shape to give it some thickness
            const extrudeSettings = {
                steps: 1,
                depth: thickness,
                bevelEnabled: false
            };
            const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
            const material = new THREE.MeshBasicMaterial({ color: 0xffff00, side: THREE.DoubleSide }); // Yellow beak
            const wireframeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true, side: THREE.DoubleSide });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.userData = { wireframeMaterial };
            return mesh;
        }

        // Create the complete bird by combining the body and beak into a group
        function createBird(index) {
            const birdGroup = new THREE.Group();
            const body = createBirdBody();
            const beak = createBirdBeak();

            // Add the body and beak to the group
            birdGroup.add(body);
            birdGroup.add(beak);

            // Ensure userData is initialized
            birdGroup.userData = birdGroup.userData || {};

            // Create an HTML element for the bird's coordinates
            const label = document.createElement('div');
            label.className = 'bird-coord-label bird-label-' + index; // Unique class for specificity
            label.style.position = 'absolute';
            label.style.color = '#00ff00';
            label.style.fontFamily = 'monospace';
            label.style.fontSize = isMobile ? '4px' : '12px'; // On mobile: 12px / 3 = 4px
            // Removed backgroundColor and border to get rid of the "box"
            label.style.display = 'none !important';
            label.style.opacity = '1 !important';
            label.style.visibility = 'visible !important';
            label.style.zIndex = '500'; // Inline zIndex: above canvas (1), below project containers (1009)
            label.style.textAlign = 'center';
            label.style.pointerEvents = 'none'; // Prevent interaction
            label.textContent = `Bird ${index} Pos: (0.0, 0.0, 0.0)`;
            document.body.appendChild(label);
            birdGroup.userData.label = label;

            return birdGroup;
        }

        // Ensure birds array is only populated once
        if (birds.length === 0) {
            for (let i = 0; i < birdCount; i++) {
                const bird = createBird(i);
                const angle = (i / birdCount) * Math.PI * 2; // Position birds in a circle
                const distance = 1.5 + Math.random() * 0.5; // Vary distance slightly between 1.5 and 2.0
                const height = 1 + Math.random() * 1; // Random height variation
                bird.position.set(
                    distance * Math.cos(angle),
                    -6.2 + height, // Adjust height relative to sphere
                    distance * Math.sin(angle)
                );
                bird.userData = {
                    angle: angle,
                    speed: 0.01 + Math.random() * 0.005, // Speed (0.01 to 0.015)
                    distance: distance,
                    height: height,
                    flapAngle: Math.random() * Math.PI, // Random starting angle for flapping
                    label: bird.userData.label // Explicitly copy the label to the top-level userData
                };
                bird.visible = false; // Initially hidden
                scene.add(bird);
                birds.push(bird);
            }
        }

        // Create Circular Particle Grid with Concentric Rings
        const maxParticles = 800; // Maximum number of particles to handle multiple rings
        const particlesPerRing = 50; // Number of particles per ring
        const maxRadius = 30; // Maximum radius of the rings
        const ringInterval = 30; // Frames between ring spawns (1 second at 60 FPS)
        const particlesGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(maxParticles * 3);
        const velocities = new Float32Array(maxParticles * 3); // For radiating motion
        const opacities = new Float32Array(maxParticles); // For fading effect
        const active = new Float32Array(maxParticles); // 1 if particle is active, 0 if not

        // Initialize all particles as inactive
        for (let i = 0; i < maxParticles; i++) {
            positions[i * 3] = 0;
            positions[i * 3 + 1] = 0;
            positions[i * 3 + 2] = 0;
            velocities[i * 3] = 0;
            velocities[i * 3 + 1] = 0;
            velocities[i * 3 + 2] = 0;
            opacities[i] = 0;
            active[i] = 0;
        }

        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particlesGeometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        particlesGeometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));
        particlesGeometry.setAttribute('active', new THREE.BufferAttribute(active, 1));

        const particlesMaterial = new THREE.PointsMaterial({
            color: 0x000000, // Black for default scene
            size: 0.02,
            sizeAttenuation: true,
            transparent: true,
            opacity: .5,
            vertexColors: false
        });
        const wireframeMaterial = new THREE.PointsMaterial({
            color: 0x00ff00, // Green for wireframe scene
            size: 0.03,
            sizeAttenuation: true,
            transparent: true,
            opacity: 1,
            vertexColors: false
        });
        const phongMaterial = new THREE.PointsMaterial({
            color: 0x000000, // Black for ASCII scene
            size: 0.02,
            sizeAttenuation: true,
            transparent: true,
            opacity: 1,
            vertexColors: false
        });

        const particles = new THREE.Points(particlesGeometry, particlesMaterial);
        particles.userData = {
            wireframeMaterial: wireframeMaterial,
            phongMaterial: phongMaterial
        };

        // Position the particle system behind the carousel sphere and cards
        particles.position.set(0, isMobile ? -12.5 : -15, -5); // z = -5 to be behind all elements, y adjusted for device
        particles.visible = false; // Initially hidden
        scene.add(particles);

        let spawnTimer = 0; // Timer for spawning new rings
        let nextParticleIndex = 0; // Index to assign to the next particle

        // Function to spawn a new ring
        function spawnRing() {
            const angleStep = (2 * Math.PI) / particlesPerRing;
            for (let i = 0; i < particlesPerRing; i++) {
                if (nextParticleIndex >= maxParticles) nextParticleIndex = 0; // Wrap around if we exceed max particles

                const angle = i * angleStep + (Math.random() - 0.5) * 0.3; // Add irregularity to angle
                const radiusOffset = 0.5 + (Math.random() - 0.5) * 0.2; // Ensure particles spawn away from center
                const x = radiusOffset * Math.cos(angle);
                const y = radiusOffset * Math.sin(angle);
                const z = 0;

                // Set position
                positions[nextParticleIndex * 3] = x;
                positions[nextParticleIndex * 3 + 1] = y;
                positions[nextParticleIndex * 3 + 2] = z;

                // Set velocity for outward motion
                const speed = 0.05; // Speed of expansion
                velocities[nextParticleIndex * 3] = speed * Math.cos(angle);
                velocities[nextParticleIndex * 3 + 1] = speed * Math.sin(angle);
                velocities[nextParticleIndex * 3 + 2] = 0;

                // Set opacity and active state
                opacities[nextParticleIndex] = 1;
                active[nextParticleIndex] = 1;

                nextParticleIndex++;
            }
        }

        // Create a test label to confirm DOM rendering
        const testLabel = document.createElement('div');
        testLabel.className = 'test-label';
        testLabel.style.position = 'absolute';
        testLabel.style.left = '10px';
        testLabel.style.top = '10px';
        testLabel.style.color = '#ff0000';
        testLabel.style.fontFamily = 'monospace';
        testLabel.style.fontSize = '14px';
        testLabel.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
        testLabel.style.padding = '2px 5px';
        testLabel.style.border = '1px solid #ff0000';
        testLabel.style.zIndex = '500'; // Inline zIndex: match bird labels
        testLabel.style.display = 'block !important';
        testLabel.style.visibility = 'visible !important';
        testLabel.style.opacity = '1 !important';
        testLabel.textContent = 'Test Label';
        document.body.appendChild(testLabel);

        // Create an HTML element for sphere and skybox rotation values
        const rotationLabel = document.createElement('div');
        rotationLabel.className = 'rotation-label';
        rotationLabel.style.position = 'absolute';
        rotationLabel.style.color = '#00ff00';
        rotationLabel.style.fontFamily = 'monospace';
        rotationLabel.style.fontSize = isMobile ? '4px' : '12px'; // On mobile: 12px / 3 = 4px
        rotationLabel.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        rotationLabel.style.padding = '2px 5px';
        rotationLabel.style.border = '1px solid #00ff00';
        rotationLabel.style.display = 'none'; // Initially hidden
        rotationLabel.style.textAlign = 'center';
        rotationLabel.style.whiteSpace = 'pre-line'; // Allow line breaks
        rotationLabel.style.zIndex = '500'; // Inline zIndex: match bird labels
        rotationLabel.textContent = 'Sphere Rot: (0.00, 0.00, 0.00)\nSkybox Rot: (0.00, 0.00, 0.00)';
        document.body.appendChild(rotationLabel);

        // Helper function to hide all labels
        function hideAllLabels(source) {
            console.log(`Hiding all labels due to: ${source}`);
            rotationLabel.style.setProperty('display', 'none', 'important');
            rotationLabel.style.setProperty('visibility', 'hidden', 'important');
            rotationLabel.style.setProperty('opacity', '0', 'important');

            birds.forEach(bird => {
                if (bird.userData.label) {
                    bird.userData.label.style.setProperty('display', 'none', 'important');
                    bird.userData.label.style.setProperty('visibility', 'hidden', 'important');
                    bird.userData.label.style.setProperty('opacity', '0', 'important');
                }
            });

            cards.forEach(card => {
                if (card.userData.label) {
                    card.userData.label.style.setProperty('display', 'none', 'important');
                    card.userData.label.style.setProperty('visibility', 'hidden', 'important');
                    card.userData.label.style.setProperty('opacity', '0', 'important');
                }
            });

            testLabel.style.setProperty('display', 'none', 'important');
            testLabel.style.setProperty('visibility', 'hidden', 'important');
            testLabel.style.setProperty('opacity', '0', 'important');
        }

        // Helper function to show labels (for debugging)
        function showAllLabels(source) {
            rotationLabel.style.setProperty('display', 'block', 'important');
            rotationLabel.style.setProperty('visibility', 'visible', 'important');
            rotationLabel.style.setProperty('opacity', '1', 'important');

            birds.forEach(bird => {
                if (bird.userData.label) {
                    bird.userData.label.style.setProperty('display', 'block', 'important');
                    bird.userData.label.style.setProperty('visibility', 'visible', 'important');
                    bird.userData.label.style.setProperty('opacity', '1', 'important');
                }
            });

            cards.forEach(card => {
                if (card.userData.label) {
                    card.userData.label.style.setProperty('display', 'block', 'important');
                    bird.userData.label.style.setProperty('visibility', 'visible', 'important');
                    bird.userData.label.style.setProperty('opacity', '1', 'important');
                }
            });

            testLabel.style.setProperty('display', 'block', 'important');
            testLabel.style.setProperty('visibility', 'visible', 'important');
            testLabel.style.setProperty('opacity', '1', 'important');
        }

        // Expose hideAllLabels and showAllLabels globally for menu.js to use
        window.hideAllLabels = hideAllLabels;
        window.showAllLabels = showAllLabels;

        function applyBackground(index) {
            if (backgroundTextures[index]) {
                skybox.material.map = backgroundTextures[index];
                skybox.material.needsUpdate = true;
            }
            // Toggle lighting, materials, effects, and background color based on backgroundIndex
            if (index === 1) {
                // Remove point lights for normal rendering
                if (pointLight1) {
                    scene.remove(pointLight1);
                    pointLight1 = null;
                }
                if (pointLight2) {
                    scene.remove(pointLight2);
                    pointLight2 = null;
                }
                // Switch to wireframe materials for retro computer effect
                cards.forEach(card => {
                    card.material = card.userData.project.materialWireframe;
                });
                sphere.material = sphereMaterialWireframe;
                skybox.material = skyboxMaterialWireframe;
                // Show birds and particles, apply wireframe materials
                birds.forEach(bird => {
                    bird.visible = true;
                    bird.children.forEach(child => {
                        child.material = child.userData.wireframeMaterial;
                    });
                    if (bird.userData.label) {
                        bird.userData.label.style.setProperty('display', 'block', 'important');
                        bird.userData.label.style.setProperty('visibility', 'visible', 'important');
                        bird.userData.label.style.setProperty('opacity', '1', 'important');
                    }
                });
                particles.visible = true;
                particles.material = particles.userData.wireframeMaterial; // Green particles for wireframe scene
                cards.forEach(card => {
                    if (card.userData.label) {
                        card.userData.label.style.setProperty('display', 'block', 'important');
                        card.userData.label.style.setProperty('visibility', 'visible', 'important');
                        card.userData.label.style.setProperty('opacity', '1', 'important');
                    }
                });
                // Show the rotation label
                rotationLabel.style.setProperty('display', 'block', 'important');
                rotationLabel.style.setProperty('visibility', 'visible', 'important');
                rotationLabel.style.setProperty('opacity', '1', 'important');
                // Show the test label
                testLabel.style.setProperty('display', 'block', 'important');
                testLabel.style.setProperty('visibility', 'visible', 'important');
                testLabel.style.setProperty('opacity', '1', 'important');
                // Set background color to very dark grey
                renderer.setClearColor(0x1a1a1a, 1);
            } else if (index === 2) {
                // Add point lights for ASCII effect
                if (!pointLight1) {
                    pointLight1 = new THREE.PointLight(0xffffff, 3, 0, 0);
                    pointLight1.position.set(500, 500, 500);
                    scene.add(pointLight1);
                }
                if (!pointLight2) {
                    pointLight2 = new THREE.PointLight(0xffffff, 1, 0, 0);
                    pointLight2.position.set(-500, -500, -500);
                    scene.add(pointLight2);
                }
                // Switch to MeshPhongMaterial for ASCII effect
                cards.forEach(card => {
                    card.material = card.userData.project.materialPhong;
                });
                sphere.material = sphereMaterialPhong;
                skybox.material = skyboxMaterialBasic;
                // Show birds and particles (non-wireframed)
                birds.forEach(bird => {
                    bird.visible = true;
                    bird.children.forEach(child => {
                        if (child === bird.children[0]) { // Body
                            child.material = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
                        } else { // Beak
                            child.material = new THREE.MeshBasicMaterial({ color: 0xffff00, side: THREE.DoubleSide });
                        }
                        child.userData.wireframeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true, side: THREE.DoubleSide });
                    });
                });
                particles.visible = true;
                particles.material = particles.userData.phongMaterial; // Black particles for ASCII scene
                // Hide all labels
                hideAllLabels("ASCII scene");
                // Set background color to light grey
                renderer.setClearColor(0xe0e0e0, 0);
            } else {
                // Remove point lights for normal rendering
                if (pointLight1) {
                    scene.remove(pointLight1);
                    pointLight1 = null;
                }
                if (pointLight2) {
                    scene.remove(pointLight2);
                    pointLight2 = null;
                }
                // Switch back to MeshBasicMaterial for normal rendering
                cards.forEach(card => {
                    card.material = card.userData.project.materialBasic;
                });
                sphere.material = sphereMaterialBasic;
                skybox.material = skyboxMaterialBasic;
                // Show birds and particles (non-wireframed)
                birds.forEach(bird => {
                    bird.visible = true;
                    bird.children.forEach(child => {
                        if (child === bird.children[0]) { // Body
                            child.material = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
                        } else { // Beak
                            child.material = new THREE.MeshBasicMaterial({ color: 0xffff00, side: THREE.DoubleSide });
                        }
                        child.userData.wireframeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true, side: THREE.DoubleSide });
                    });
                });
                particles.visible = true;
                particles.material = new THREE.PointsMaterial({
                    color: 0x000000, // Black particles for default scene
                    size: 0.05,
                    sizeAttenuation: true,
                    transparent: true,
                    opacity: 1,
                    vertexColors: false
                });
                // Hide all labels
                hideAllLabels("default scene");
                // Set background color to light grey
                renderer.setClearColor(0xe0e0e0, 0);
            }
        }

        function initializeScene() {
            const skyboxRadius = 500;
            const skyboxGeometry = new THREE.SphereGeometry(skyboxRadius, 32, 32);
            skyboxMaterialBasic = new THREE.MeshBasicMaterial({
                side: THREE.BackSide,
                transparent: true,
                opacity: 1
            });
            skyboxMaterialPhong = new THREE.MeshPhongMaterial({
                side: THREE.BackSide,
                transparent: true,
                opacity: 1,
                flatShading: true
            });
            skyboxMaterialWireframe = new THREE.MeshBasicMaterial({
                color: 0x00ff00,
                wireframe: true,
                side: THREE.BackSide,
                transparent: true,
                opacity: 1
            });
            skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterialBasic);
            skybox.rotation.x = Math.PI / -3.5;
            skybox.rotation.y = Math.PI / -7;
            skybox.userData = { rotationSpeed: 0.001 };
            scene.add(skybox);

            const sphereRadius = 1.5;
            const sphereGeometry = new THREE.SphereGeometry(sphereRadius, 32, 32);

            const textureUrl = './images/cube1.png';
            const texture = new THREE.TextureLoader().load(
                textureUrl,
                () => { },
                undefined,
                (err) => {
                    console.error(`Failed to load sphere texture: ${textureUrl}`, err);
                    sphereMaterialBasic = new THREE.MeshBasicMaterial({ color: 0x888888 });
                }
            );
            texture.minFilter = THREE.LinearMipmapLinearFilter;
            texture.magFilter = THREE.NearestFilter;
            sphereMaterialBasic = new THREE.MeshBasicMaterial({ map: texture });
            sphereMaterialPhong = new THREE.MeshPhongMaterial({ map: texture, flatShading: true });
            sphereMaterialWireframe = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });

            sphere = new THREE.Mesh(sphereGeometry, sphereMaterialBasic);
            sphere.position.set(0, -6.2, 0);
            scene.add(sphere);

            sphere.userData = { rotationSpeed: 0.005 };

            cards.forEach((card, index) => {
                const angle = (index / cardCount) * Math.PI * 2 - Math.PI / 2;
                card.position.set(radius * Math.cos(angle), -3, radius * Math.sin(angle));
                card.lookAt(0, -5, 0);
                card.rotation.x = -Math.PI / 12;
            });

            applyBackground(0);

            const ambientLight = new THREE.AmbientLight(0x404040);
            scene.add(ambientLight);
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
            directionalLight.position.set(0, 1, 0);
            scene.add(directionalLight);

            if (progressDialog) {
                progressDialog.style.display = "none";
            }
            canvas.style.opacity = "1";
            canvas.style.pointerEvents = "auto";

            if (controls) controls.update();
            renderer.render(scene, camera);

            window.addEventListener('resize', () => {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
                asciiShaderMaterial.uniforms.resolution.value.set(window.innerWidth, window.innerHeight);
                renderTarget.setSize(window.innerWidth, window.innerHeight);
                renderer.render(scene, camera);
            });

            let frameCounter = 0; // To reduce update frequency for other elements

            function animate() {
                requestAnimationFrame(animate);

                if (currentZ > targetZ) {
                    currentZ -= zoomSpeed * (currentZ - targetZ);
                    if (currentZ < targetZ) currentZ = targetZ;
                    camera.position.z = currentZ;
                }

                if (!isHovering) {
                    targetRotation += autoRotationSpeed;
                }

                currentRotation += (targetRotation - currentRotation) * rotationSpeed;
                cards.forEach((card, index) => {
                    const angle = (index / cardCount) * Math.PI * 2 - Math.PI / 2 + currentRotation;
                    card.position.set(radius * Math.cos(angle), -4, radius * Math.sin(angle));
                    card.lookAt(0, 0, 0);
                    card.rotation.x += 0.0001;
                });

                sphere.rotation.x += sphere.userData.rotationSpeed;
                sphere.rotation.y += sphere.userData.rotationSpeed;

                skybox.rotation.y += skybox.userData.rotationSpeed;

                // Animate birds when backgroundIndex === 0, 1, or 2
                if (backgroundIndex === 0 || backgroundIndex === 1 || backgroundIndex === 2) {
                    birds.forEach(bird => {
                        // Circling motion
                        bird.userData.angle -= bird.userData.speed;
                        const x = bird.userData.distance * Math.cos(bird.userData.angle);
                        const z = bird.userData.distance * Math.sin(bird.userData.angle);
                        bird.position.set(x, -6.2 + bird.userData.height, z);
                        bird.lookAt(x + Math.cos(bird.userData.angle - Math.PI / 2), -6.2 + bird.userData.height, z + Math.sin(bird.userData.angle - Math.PI / 2));

                        // Flapping animation
                        bird.userData.flapAngle += 0.1;
                        const flap = Math.sin(bird.userData.flapAngle) * 0.2; // Simulate wing flapping
                        bird.rotation.x = flap; // Rotate the bird to simulate flapping
                    });

                    // Animate particles
                    spawnTimer++;
                    if (spawnTimer >= ringInterval) {
                        spawnTimer = 0;
                        spawnRing();
                    }

                    const positions = particles.geometry.attributes.position.array;
                    const velocities = particles.geometry.attributes.velocity.array;
                    const opacities = particles.geometry.attributes.opacity.array;
                    const active = particles.geometry.attributes.active.array;

                    for (let i = 0; i < maxParticles; i++) {
                        if (active[i] === 0) continue; // Skip inactive particles

                        // Update position
                        positions[i * 3] += velocities[i * 3];
                        positions[i * 3 + 1] += velocities[i * 3 + 1];
                        positions[i * 3 + 2] += velocities[i * 3 + 2];

                        // Calculate distance from center
                        const x = positions[i * 3];
                        const y = positions[i * 3 + 1];
                        const distance = Math.sqrt(x * x + y * y);

                        // Update opacity based on distance (fade out as it expands)
                        opacities[i] = 1 - (distance / maxRadius);
                        if (opacities[i] < 0) opacities[i] = 0;

                        // Deactivate particle if it reaches max radius
                        if (distance > maxRadius) {
                            active[i] = 0;
                            positions[i * 3] = 1000; // Move far away to prevent rendering
                            positions[i * 3 + 1] = 1000;
                            positions[i * 3 + 2] = 1000;
                            velocities[i * 3] = 0;
                            velocities[i * 3 + 1] = 0;
                            velocities[i * 3 + 2] = 0;
                            opacities[i] = 0;
                        }
                    }

                    particles.geometry.attributes.position.needsUpdate = true;
                    particles.geometry.attributes.opacity.needsUpdate = true;
                    particles.geometry.attributes.active.needsUpdate = true;
                }

                // Check if a project page is open
                const isProjectOpen = $(".project-container").filter(function () {
                    return $(this).css("display") !== "none";
                }).length > 0;

                // Update HTML labels with sphere/skybox rotations, bird coordinates, and card coordinates (only in wireframe scene)
                if (backgroundIndex === 1 && !isProjectOpen) {
                    frameCounter++;
                    // Update sphere and skybox rotation label every 10 frames
                    if (frameCounter % 10 === 0) {
                        const rotationVector = sphere.position.clone();
                        rotationVector.y += 1; // Position above the sphere
                        rotationVector.project(camera);
                        const xScreenRot = (rotationVector.x * 0.5 + 0.5) * window.innerWidth;
                        const yScreenRot = (-rotationVector.y * 0.5 + 0.5) * window.innerHeight;

                        rotationLabel.textContent = `Sphere Rot: (${sphere.rotation.x.toFixed(2)}, ${sphere.rotation.y.toFixed(2)}, ${sphere.rotation.z.toFixed(2)})\nSkybox Rot: (${skybox.rotation.x.toFixed(2)}, ${skybox.rotation.y.toFixed(2)}, ${skybox.rotation.z.toFixed(2)})`;
                        rotationLabel.style.left = `${xScreenRot}px`;
                        rotationLabel.style.top = `${yScreenRot - 20}px`; // Center vertically with two lines
                    }

                    // Update bird coordinate labels every frame to reduce jitter
                    birds.forEach((bird, index) => {
                        if (bird.visible && bird.userData.label) {
                            const computedStyle = window.getComputedStyle(bird.userData.label);
                            if (computedStyle.display !== 'none') {
                                // Project bird position to screen space
                                const vector = bird.position.clone();
                                vector.y += 0.2; // Slight offset above the bird
                                vector.project(camera);
                                let xScreen = (vector.x * 0.5 + 0.5) * window.innerWidth;
                                let yScreen = (-vector.y * 0.5 + 0.5) * window.innerHeight;

                                // Clamp screen coordinates to keep labels on-screen
                                xScreen = Math.max(10, Math.min(xScreen, window.innerWidth - 100)); // Adjust 100 based on label width
                                yScreen = Math.max(10, Math.min(yScreen, window.innerHeight - 20)); // Adjust 20 based on label height

                                // Update label text and position
                                bird.userData.label.textContent = `Bird ${index} Pos: (${bird.position.x.toFixed(1)}, ${bird.position.y.toFixed(1)}, ${bird.position.z.toFixed(1)})`;
                                bird.userData.label.style.left = `${xScreen + 10}px`; // Offset to the right to avoid overlap
                                bird.userData.label.style.top = `${yScreen}px`;
                            }
                        }
                    });

                    // Update card coordinate labels every frame to reduce jitter
                    cards.forEach((card, index) => {
                        if (card.visible && card.userData.label) {
                            const computedStyle = window.getComputedStyle(card.userData.label);
                            if (computedStyle.display !== 'none') {
                                // Project card position to screen space
                                const vector = card.position.clone();
                                vector.y -= 1.7; // Position at the bottom of the card (card height is 3, so -1.5 - 0.2 for spacing)
                                vector.project(camera);
                                let xScreen = (vector.x * 0.5 + 0.5) * window.innerWidth;
                                let yScreen = (-vector.y * 0.5 + 0.5) * window.innerHeight;

                                // Clamp screen coordinates to keep labels on-screen
                                xScreen = Math.max(10, Math.min(xScreen, window.innerWidth - 100)); // Adjust 1based on label width
                                yScreen = Math.max(10, Math.min(yScreen, window.innerHeight - 20)); // Adjust 20 based on label height

                                // Update label text and position
                                card.userData.label.textContent = `Card ${index} Pos: (${card.position.x.toFixed(1)}, ${card.position.y.toFixed(1)}, ${card.position.z.toFixed(1)})`;
                                card.userData.label.style.left = `${xScreen + 10}px`; // Offset to the right to avoid overlap
                                card.userData.label.style.top = `${yScreen}px`;
                            }
                        }
                    });
                }

                if (controls) controls.update();

                // Apply post-processing for backgroundIndex === 2 (ASCII effect)
                if (backgroundIndex === 2) {
                    renderer.setRenderTarget(renderTarget);
                    renderer.clear();
                    renderer.render(scene, camera);
                    renderer.setRenderTarget(null);
                    renderer.clear();
                    renderer.render(asciiScene, asciiCamera);
                } else {
                    renderer.clear();
                    renderer.render(scene, camera);
                }
            }
            animate();

            const raycaster = new THREE.Raycaster();
            const mouse = new THREE.Vector2();
            const infoDiv = document.getElementById("cardInfo");
            const infoImage = document.getElementById("infoImage");
            const infoText = document.getElementById("infoText");

            if (!infoDiv || !infoImage || !infoText) {
                console.error("Card info elements not found. Ensure cardInfo, infoImage, and infoText exist in the DOM.");
                return;
            }

            function onMouseMove(event) {
                const target = event.target;
                const isNavigationHover = target.closest('#navWrapper');
                const isContactButtonHover = target.closest('#contactbutton') || target.closest('#mobilecontactbutton');
                const isFormHover = target.closest('#form');

                if (isNavigationHover || isContactButtonHover || isFormHover) {
                    infoDiv.style.display = "none";
                    isHovering = false;
                    canvas.style.cursor = "default";
                    return;
                }

                mouse.x = (event.clientX / initialWidth) * 2 - 1;
                mouse.y = -(event.clientY / initialHeight) * 2 + 1;
                raycaster.setFromCamera(mouse, camera);

                const sphereIntersects = raycaster.intersectObject(sphere);
                if (sphereIntersects.length > 0) {
                    canvas.style.cursor = "pointer";
                    return;
                }

                const cardIntersects = raycaster.intersectObjects(cards);
                if (cardIntersects.length > 0) {
                    const card = cardIntersects[0].object;
                    infoDiv.style.display = "block";
                    infoImage.src = card.userData.project.image;
                    infoText.innerHTML = `<h2>${card.userData.project.title}</h2><p>${card.userData.project.desc}</p>`;
                    isHovering = true;
                    canvas.style.cursor = "pointer";
                } else {
                    infoDiv.style.display = "none";
                    isHovering = false;
                    canvas.style.cursor = "default";
                }
            }

            function onClick(event) {
                const target = event.target;
                const isMenuClick = target.closest('#menu') || target.closest('#menu2');
                const isProjectClick = target.closest('.project-container');
                const isNavigationClick = target.closest('#navWrapper');
                const isAboutWrapperClick = target.closest('#about-wrapper');
                const isContactButtonClick = target.closest('#contactbutton') || target.closest('#mobilecontactbutton');
                const isFormClick = target.closest('#form');
                const isWorkBoxClick = target.closest('.work-box');

                if (isMenuClick || isProjectClick || isNavigationClick || isAboutWrapperClick || isContactButtonClick || isFormClick || isWorkBoxClick) {
                    return;
                }

                const clientX = event.clientX || (event.changedTouches && event.changedTouches.length > 0 ? event.changedTouches[0].clientX : null);
                const clientY = event.clientY || (event.changedTouches && event.changedTouches.length > 0 ? event.changedTouches[0].clientY : null);

                if (clientX === null || clientY === null) {
                    console.warn("Unable to determine click/touch coordinates.");
                    return;
                }

                mouse.x = (clientX / initialWidth) * 2 - 1;
                mouse.y = -(clientY / initialHeight) * 2 + 1;
                raycaster.setFromCamera(mouse, camera);

                const sphereIntersects = raycaster.intersectObject(sphere);
                if (sphereIntersects.length > 0) {
                    previousBackgroundIndex = backgroundIndex;
                    backgroundIndex = (backgroundIndex + 1) % backgroundPaths.length;
                    applyBackground(backgroundIndex);
                    // Hide labels if transitioning away from the wireframe scene
                    if (previousBackgroundIndex === 1 && backgroundIndex !== 1) {
                        hideAllLabels("sphere click - transition away from wireframe");
                    }
                    renderer.render(scene, camera);
                    return;
                }

                const cardIntersects = raycaster.intersectObjects(cards);
                if (cardIntersects.length > 0) {
                    const card = cardIntersects[0].object;
                    const projectId = card.userData.project.id;
                    const $targetProject = $("#" + projectId);
                    const $menu = $("#menu");
                    const $menu2 = $("#menu2");
                    const $aboutwrapper = $("#about-wrapper");
                    const $hpgraphic = $("#hp-graphic");

                    const $projectContainers = $(".project-container");
                    $projectContainers.css("display", "none");

                    if ($targetProject.length) {
                        $targetProject.css("display", "flex");
                        canvas.style.pointerEvents = "none";
                        // Hide all labels when navigating to the projects page
                        hideAllLabels("project page navigation");
                    } else {
                        console.warn("No project found for ID:", projectId);
                    }

                    $menu.css("display", "none");
                    $menu2.css("display", "none");
                    if ($aboutwrapper.length) {
                        $aboutwrapper.css("display", "none");
                    }

                    if ($hpgraphic.length) {
                        $hpgraphic.css("display", "none");
                    } else {
                        console.warn("Homepage graphic not found.");
                    }

                    $("#mainToggle, #researchToggle, #aboutToggle").css("color", "black");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                }
            }

            // Handle clicks on .work-box elements (Work Archive or Research Archive)
            document.addEventListener("click", (event) => {
                const target = event.target;
                const workBox = target.closest('.work-box');
                if (workBox) {
                    const projectId = workBox.dataset.projectId;
                    const $targetProject = $("#" + projectId);
                    const $menu = $("#menu");
                    const $menu2 = $("#menu2");
                    const $aboutwrapper = $("#about-wrapper");
                    const $hpgraphic = $("#hp-graphic");

                    const $projectContainers = $(".project-container");
                    $projectContainers.css("display", "none");

                    if ($targetProject.length) {
                        $targetProject.css("display", "flex");
                        canvas.style.pointerEvents = "none";
                        // Hide all labels when navigating to the projects page
                        hideAllLabels("work-box navigation");
                    } else {
                        console.warn("No project found for ID:", projectId);
                    }

                    $menu.css("display", "none");
                    $menu2.css("display", "none");
                    if ($aboutwrapper.length) {
                        $aboutwrapper.css("display", "none");
                    }

                    if ($hpgraphic.length) {
                        $hpgraphic.css("display", "none");
                    } else {
                        console.warn("Homepage graphic not found.");
                    }

                    $("#mainToggle, #researchToggle, #aboutToggle").css("color", "black");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                }
            });

            document.getElementById('contactbutton')?.addEventListener('click', (event) => {
                event.stopPropagation();
            });

            document.getElementById('mobilecontactbutton')?.addEventListener('click', (event) => {
                event.stopPropagation();
            });

            document.getElementById('form')?.addEventListener('click', (event) => {
                event.stopPropagation();
            });

            window.addEventListener("click", onClick);
            window.addEventListener("touchend", onClick);
            window.addEventListener("mousemove", onMouseMove);
        }
    }

    let targetRotation = 0;
    let currentRotation = 0;
    const rotationSpeed = 0.1;
    const autoRotationSpeed = 0.003;
    let isHovering = false;
});