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
            console.warn("Carousel already initialized, skipping...");
            return;
        }
        hasInitialized = true;
        console.log("Initializing 3D carousel...");

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
                initialZ = 13;
                targetZ = -.5;
                cameraY = 10;
                controlsTargetY = 4;
            } else {
                initialZ = 8;
                targetZ = 3;
                cameraY = 20;
                controlsTargetY = -5;
            }

            currentZ = initialZ;
            camera.position.set(0, cameraY, initialZ);
            camera.rotation.order = 'YXZ';
            camera.rotation.set(-Math.PI / 6, 0, 0);

            if (controls) {
                controls.target.set(0, controlsTargetY, 0);
                controls.update();
            }

            // Debug: Log camera details
            console.log("Camera position:", camera.position);
            console.log("Camera projection matrix:", camera.projectionMatrix.elements);
            console.log("Camera matrix world inverse:", camera.matrixWorldInverse.elements);
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
            { id: "project6", image: "./images/cube6.png", title: "Title Example", desc: "SubText", url: "./html/project6.html" }
        ];

        const cards = [];
        const radius = 3.2;
        const cardCount = 6;

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
                    () => {
                        console.log(`Loaded background texture ${index}: ${path}`);
                    },
                    undefined,
                    (err) => console.error(`Failed to load background texture ${index}: ${path}`, err)
                );
                texture.mapping = THREE.EquirectangularReflectionMapping;
                backgroundTextures[index] = texture;
            }
        });

        // Create Birds for backgroundIndex === 1 and 2 using Primitive Geometries (Enhanced Inverted W shape with bird-like features)
        const birds = [];
        const birdCount = 10; // Reduced from 50 to 10 for better performance

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
            label.style.fontSize = isMobile ? '6px' : '12px'; // Half size on mobile (12px to 6px)
            label.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            label.style.padding = '2px 5px';
            label.style.border = '1px solid #00ff00';
            label.style.display = 'none !important';
            label.style.opacity = '1 !important';
            label.style.visibility = 'visible !important';
            label.style.zIndex = '500'; // Inline zIndex: above canvas (1), below project containers (1009)
            label.style.textAlign = 'center';
            label.style.pointerEvents = 'none'; // Prevent interaction
            label.textContent = `Bird ${index} Pos: (0.0, 0.0, 0.0)`;
            document.body.appendChild(label);
            birdGroup.userData.label = label;
            console.log(`Created label for Bird ${index} with z-index: ${label.style.zIndex}, font-size: ${label.style.fontSize}`);

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
                console.log(`Bird ${i} label assigned:`, !!bird.userData.label);
            }
            console.log("Total birds created:", birds.length);
            // Debug: Verify labels are attached
            birds.forEach((bird, index) => {
                console.log(`Bird ${index} has label after creation:`, !!bird.userData.label);
            });
        }

        // Create a test label to confirm DOM rendering
        const testLabel = document.createElement('div');
        testLabel.className = 'test-label';
        testLabel.style.position = 'absolute';
        testLabel.style.left = '10px';
        testLabel.style.top = '10px';
        testLabel.style.color = '#ff0000';
        testLabel.style.fontFamily = 'monospace';
        testLabel.style.fontSize = isMobile ? '7px' : '14px'; // Half size on mobile (14px to 7px)
        testLabel.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
        testLabel.style.padding = '2px 5px';
        testLabel.style.border = '1px solid #ff0000';
        testLabel.style.zIndex = '500'; // Inline zIndex: match bird labels
        testLabel.style.display = 'block !important';
        testLabel.style.visibility = 'visible !important';
        testLabel.style.opacity = '1 !important';
        testLabel.textContent = 'Test Label';
        document.body.appendChild(testLabel);
        console.log("Test label created at top-left corner with z-index:", testLabel.style.zIndex, "font-size:", testLabel.style.fontSize);

        // Create Asteroids for backgroundIndex === 1 (wireframe scene)
        const asteroids = [];
        const asteroidCount = 20;

        function createAsteroid() {
            const geometry = new THREE.IcosahedronGeometry(0.5, 0); // Simple rocky shape
            const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
            const asteroid = new THREE.Mesh(geometry, material);
            const angle = Math.random() * Math.PI * 2;
            const distance = 5 + Math.random() * 3; // Distance between 5 and 8 units
            const height = -6.2 + (Math.random() * 4 - 2); // Height between -8.2 and -4.2
            asteroid.position.set(
                distance * Math.cos(angle),
                height,
                distance * Math.sin(angle)
            );
            asteroid.userData = {
                angle: angle,
                speed: 0.005 + Math.random() * 0.005,
                rotationSpeed: new THREE.Vector3(
                    Math.random() * 0.02 - 0.01,
                    Math.random() * 0.02 - 0.01,
                    Math.random() * 0.02 - 0.01
                )
            };
            asteroid.visible = false;
            scene.add(asteroid);
            asteroids.push(asteroid);
        }

        for (let i = 0; i < asteroidCount; i++) {
            createAsteroid();
        }

        // Create an HTML element for sphere and skybox rotation values
        const rotationLabel = document.createElement('div');
        rotationLabel.className = 'rotation-label';
        rotationLabel.style.position = 'absolute';
        rotationLabel.style.color = '#00ff00';
        rotationLabel.style.fontFamily = 'monospace';
        rotationLabel.style.fontSize = isMobile ? '6px' : '12px'; // Half size on mobile (12px to 6px)
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
            rotationLabel.style.setProperty('display', 'none', 'important');
            rotationLabel.style.setProperty('visibility', 'hidden', 'important');
            rotationLabel.style.setProperty('opacity', '0', 'important');
            console.log(`Rotation label hidden (${source}), display:`, rotationLabel.style.display);
            const computedStyleRot = window.getComputedStyle(rotationLabel);
            console.log(`Rotation label computed display (${source}):`, computedStyleRot.display);
            console.log(`Rotation label computed visibility (${source}):`, computedStyleRot.visibility);
            console.log(`Rotation label computed opacity (${source}):`, computedStyleRot.opacity);
            console.log(`Rotation label computed z-index (${source}):`, computedStyleRot.zIndex);
            // Debug: Log parent element styles
            const parentRot = rotationLabel.parentElement;
            if (parentRot) {
                const parentStyleRot = window.getComputedStyle(parentRot);
                console.log(`Rotation label parent computed display (${source}):`, parentStyleRot.display);
                console.log(`Rotation label parent computed visibility (${source}):`, parentStyleRot.visibility);
                console.log(`Rotation label parent computed opacity (${source}):`, parentStyleRot.opacity);
                console.log(`Rotation label parent computed z-index (${source}):`, parentStyleRot.zIndex);
            }

            birds.forEach(bird => {
                if (bird.userData.label) {
                    bird.userData.label.style.setProperty('display', 'none', 'important');
                    bird.userData.label.style.setProperty('visibility', 'hidden', 'important');
                    bird.userData.label.style.setProperty('opacity', '0', 'important');
                    console.log(`Bird ${birds.indexOf(bird)} label hidden (${source}), display:`, bird.userData.label.style.display);
                    const computedStyleBird = window.getComputedStyle(bird.userData.label);
                    console.log(`Bird ${birds.indexOf(bird)} label computed display (${source}):`, computedStyleBird.display);
                    console.log(`Bird ${birds.indexOf(bird)} label computed visibility (${source}):`, computedStyleBird.visibility);
                    console.log(`Bird ${birds.indexOf(bird)} label computed opacity (${source}):`, computedStyleBird.opacity);
                    console.log(`Bird ${birds.indexOf(bird)} label computed z-index (${source}):`, computedStyleBird.zIndex);
                    // Debug: Log parent element styles
                    const parentBird = bird.userData.label.parentElement;
                    if (parentBird) {
                        const parentStyleBird = window.getComputedStyle(parentBird);
                        console.log(`Bird ${birds.indexOf(bird)} label parent computed display (${source}):`, parentStyleBird.display);
                        console.log(`Bird ${birds.indexOf(bird)} label parent computed visibility (${source}):`, parentStyleBird.visibility);
                        console.log(`Bird ${birds.indexOf(bird)} label parent computed opacity (${source}):`, parentStyleBird.opacity);
                        console.log(`Bird ${birds.indexOf(bird)} label parent computed z-index (${source}):`, parentStyleBird.zIndex);
                    }
                }
            });

            // Hide the test label as well
            testLabel.style.setProperty('display', 'none', 'important');
            testLabel.style.setProperty('visibility', 'hidden', 'important');
            testLabel.style.setProperty('opacity', '0', 'important');
            console.log(`Test label hidden (${source}), display:`, testLabel.style.display);
        }

        // Helper function to show labels (for debugging)
        function showAllLabels(source) {
            rotationLabel.style.setProperty('display', 'block', 'important');
            rotationLabel.style.setProperty('visibility', 'visible', 'important');
            rotationLabel.style.setProperty('opacity', '1', 'important');
            console.log(`Rotation label shown (${source}), display:`, rotationLabel.style.display);

            birds.forEach(bird => {
                if (bird.userData.label) {
                    bird.userData.label.style.setProperty('display', 'block', 'important');
                    bird.userData.label.style.setProperty('visibility', 'visible', 'important');
                    bird.userData.label.style.setProperty('opacity', '1', 'important');
                    console.log(`Bird ${birds.indexOf(bird)} label shown (${source}), display:`, bird.userData.label.style.display);
                }
            });

            testLabel.style.setProperty('display', 'block', 'important');
            testLabel.style.setProperty('visibility', 'visible', 'important');
            testLabel.style.setProperty('opacity', '1', 'important');
            console.log(`Test label shown (${source}), display:`, testLabel.style.display);
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
                // Show birds and asteroids, apply wireframe to birds
                birds.forEach(bird => {
                    bird.visible = true;
                    bird.children.forEach(child => {
                        child.material = child.userData.wireframeMaterial;
                    });
                    // Show the bird's label
                    if (bird.userData.label) {
                        bird.userData.label.style.setProperty('display', 'block', 'important');
                        bird.userData.label.style.setProperty('visibility', 'visible', 'important');
                        bird.userData.label.style.setProperty('opacity', '1', 'important');
                        console.log(`Bird ${birds.indexOf(bird)} label set to visible (wireframe scene), display:`, bird.userData.label.style.display);
                        // Debug: Log computed style
                        const computedStyle = window.getComputedStyle(bird.userData.label);
                        console.log(`Bird ${birds.indexOf(bird)} label computed display (wireframe scene):`, computedStyle.display);
                        console.log(`Bird ${birds.indexOf(bird)} label computed visibility (wireframe scene):`, computedStyle.visibility);
                        console.log(`Bird ${birds.indexOf(bird)} label computed opacity (wireframe scene):`, computedStyle.opacity);
                        console.log(`Bird ${birds.indexOf(bird)} label computed z-index (wireframe scene):`, computedStyle.zIndex);
                    }
                    console.log(`Bird ${birds.indexOf(bird)} set to visible: ${bird.visible}`);
                });
                asteroids.forEach(asteroid => {
                    asteroid.visible = true;
                    console.log(`Asteroid set to visible: ${asteroid.visible}`);
                });
                // Show the rotation label
                rotationLabel.style.setProperty('display', 'block', 'important');
                rotationLabel.style.setProperty('visibility', 'visible', 'important');
                rotationLabel.style.setProperty('opacity', '1', 'important');
                console.log("Rotation label shown (wireframe scene), display:", rotationLabel.style.display);
                const computedStyleRot = window.getComputedStyle(rotationLabel);
                console.log("Rotation label computed display (wireframe scene):", computedStyleRot.display);
                console.log("Rotation label computed visibility (wireframe scene):", computedStyleRot.visibility);
                console.log("Rotation label computed opacity (wireframe scene):", computedStyleRot.opacity);
                console.log("Rotation label computed z-index (wireframe scene):", computedStyleRot.zIndex);
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
                // Show birds (non-wireframed), hide asteroids
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
                    console.log(`Bird ${birds.indexOf(bird)} set to visible (ASCII): ${bird.visible}`);
                });
                asteroids.forEach(asteroid => {
                    asteroid.visible = false;
                    console.log(`Asteroid set to visible: ${asteroid.visible}`);
                });
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
                // Hide birds and asteroids
                birds.forEach(bird => {
                    bird.visible = false;
                    // Reset bird materials to non-wireframe
                    bird.children.forEach(child => {
                        if (child === bird.children[0]) { // Body
                            child.material = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
                        } else { // Beak
                            child.material = new THREE.MeshBasicMaterial({ color: 0xffff00, side: THREE.DoubleSide });
                        }
                        child.userData.wireframeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true, side: THREE.DoubleSide });
                    });
                    console.log(`Bird ${birds.indexOf(bird)} set to visible (default): ${bird.visible}`);
                });
                asteroids.forEach(asteroid => {
                    asteroid.visible = false;
                    console.log(`Asteroid set to visible: ${asteroid.visible}`);
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
                () => {
                    console.log("Loaded sphere texture:", textureUrl);
                    texture.needsUpdate = true;
                },
                undefined,
                (err) => {
                    console.error(`Failed to load sphere texture: ${textureUrl}`, err);
                    // Fallback to a basic material if texture fails
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

                // Animate birds when backgroundIndex === 1 or 2
                if (backgroundIndex === 1 || backgroundIndex === 2) {
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
                }

                // Update HTML labels with sphere/skybox rotations and bird coordinates (only in wireframe scene)
                if (backgroundIndex === 1) {
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
                                const xScreen = (vector.x * 0.5 + 0.5) * window.innerWidth;
                                const yScreen = (-vector.y * 0.5 + 0.5) * window.innerHeight;

                                // Update label text and position
                                bird.userData.label.textContent = `Bird ${index} Pos: (${bird.position.x.toFixed(1)}, ${bird.position.y.toFixed(1)}, ${bird.position.z.toFixed(1)})`;
                                bird.userData.label.style.left = `${xScreen + 10}px`; // Offset to the right to avoid overlap
                                bird.userData.label.style.top = `${yScreen}px`;

                                // Debug: Log position and viewport bounds (only every 10 frames to reduce log spam)
                                if (frameCounter % 10 === 0) {
                                    console.log(`Bird ${index} 3D position: (${bird.position.x.toFixed(1)}, ${bird.position.y.toFixed(1)}, ${bird.position.z.toFixed(1)})`);
                                    console.log(`Bird ${index} label position updated: left=${xScreen + 10}px, top=${yScreen}px`);
                                    console.log(`Viewport: width=${window.innerWidth}px, height=${window.innerHeight}px`);
                                    // Debug: Log computed style
                                    console.log(`Bird ${index} label computed display:`, computedStyle.display);
                                    console.log(`Bird ${index} label computed visibility:`, computedStyle.visibility);
                                    console.log(`Bird ${index} label computed opacity:`, computedStyle.opacity);
                                    console.log(`Bird ${index} label computed z-index:`, computedStyle.zIndex);
                                }
                            }
                        } else {
                            console.warn(`Bird ${index} label missing or bird not visible:`, bird.visible, !!bird.userData.label);
                        }
                    });
                }

                // Animate asteroids when backgroundIndex === 1 (wireframe scene)
                if (backgroundIndex === 1) {
                    asteroids.forEach(asteroid => {
                        asteroid.userData.angle += asteroid.userData.speed;
                        const x = asteroid.userData.distance * Math.cos(asteroid.userData.angle);
                        const z = asteroid.userData.distance * Math.sin(asteroid.userData.angle);
                        asteroid.position.set(x, asteroid.position.y, z);
                        asteroid.rotation.x += asteroid.userData.rotationSpeed.x;
                        asteroid.rotation.y += asteroid.userData.rotationSpeed.y;
                        asteroid.rotation.z += asteroid.userData.rotationSpeed.z;
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

                if (isMenuClick || isProjectClick || isNavigationClick || isAboutWrapperClick || isContactButtonClick || isFormClick) {
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
                    previousBackgroundIndex = backgroundIndex; // Store the current index
                    backgroundIndex = (backgroundIndex + 1) % backgroundPaths.length;
                    console.log("Previous backgroundIndex before sphere click:", previousBackgroundIndex);
                    console.log("New backgroundIndex after sphere click:", backgroundIndex);
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
                        console.log("Navigated to projects page, hiding rotation label and bird coordinate labels");
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