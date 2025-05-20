document.addEventListener("DOMContentLoaded", () => {
    // Fallback timeout to initialize the carousel if "allPartsLoaded" doesn't fire
    const eventTimeout = setTimeout(() => {
        console.warn('"allPartsLoaded" event did not fire within 10 seconds, forcing initialization...');
        initializeCarousel();
    }, 10000); // 10 seconds timeout

    $(document).on("allPartsLoaded", () => {
        clearTimeout(eventTimeout); // Clear the timeout if the event fires
        initializeCarousel();
    });

    function initializeCarousel() {
        console.log("Initializing 3D carousel...");

        // Check if THREE is loaded
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
        const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true }); // Enable anti-aliasing
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio); // Account for device pixel ratio
        renderer.setClearColor(0xe0e0e0); // Set initial background to #e0e0e0

        // Optionally enable anisotropic filtering if supported
        const gl = renderer.getContext();
        const anisotropicExt = gl.getExtension('EXT_texture_filter_anisotropic') || gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic');
        if (anisotropicExt) {
            const maxAnisotropy = gl.getParameter(anisotropicExt.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
            THREE.Texture.DEFAULT_ANISOTROPY = Math.min(maxAnisotropy, 16); // Set anisotropy to max or 16
            console.log("Anisotropic filtering enabled with level:", THREE.Texture.DEFAULT_ANISOTROPY);
        }

        // Set initial canvas opacity to 0 and disable pointer events to prevent interference
        canvas.style.opacity = "0";
        canvas.style.transition = "opacity 1s ease-in";
        canvas.style.pointerEvents = "none"; // Disable pointer events during loading

        // Setup progress dialog and indicator
        const progressDialog = document.getElementById("progress-dialog");
        const progressIndicator = document.getElementById("progress-indicator");
        if (!progressDialog || !progressIndicator) {
            console.error("Progress dialog or indicator not found in the DOM.");
        } else {
            progressDialog.style.display = "block"; // Ensure dialog is visible
            progressDialog.style.backgroundColor = "#f0f0f0"; // Fallback in case CSS isn’t applied
            progressIndicator.value = 0; // Initialize progress bar
        }

        // Responsive camera settings based on screen width
        let initialZ, targetZ, currentZ, cameraY, controlsTargetY;
        const isMobile = window.innerWidth < 800;
        const zoomSpeed = isMobile ? 0.1 : 0.02; // Faster zoom on mobile (0.1) vs desktop (0.02)

        // Initialize OrbitControls but disable interactive features
        let controls;
        if (typeof THREE.OrbitControls !== "undefined") {
            controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableZoom = false; // Disable zooming
            controls.enableRotate = false; // Disable rotation
            controls.enablePan = false; // Disable panning
            controls.maxDistance = 8; // Set maximum zoom-out distance (still used for camera positioning)
            controls.saveState();
            controls.update();
            console.log("OrbitControls initialized with all interactive features disabled. Max distance set to:", controls.maxDistance);
        } else {
            console.warn("OrbitControls not found. Camera controls disabled.");
        }

        function updateCameraSettings() {
            const isMobile = window.innerWidth < 800;

            if (isMobile) {
                // Settings for screens < 800px
                initialZ = 15;
                targetZ = 0.5;
                cameraY = 1000;
                controlsTargetY = 3;
            } else {
                // Settings for screens ≥ 800px (original settings)
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
                console.log("Camera updated for screen width:", window.innerWidth, "Camera position:", camera.position, "Controls target:", controls.target);
            }
        }

        // Apply initial camera settings (after controls initialization)
        updateCameraSettings();

        // 2D plane geometry for cards
        const cardGeometry = new THREE.PlaneGeometry(2, 3);
        const geometryAspectRatio = 2 / 3; // Width / Height of the plane (2x3)

        // Project data (updated to match workarchive.html with 6 projects)
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

        // Create and position cards with texture loading
        let loadedTextures = 0;
        const totalTextures = projects.length;
        let textureLoadTimeout; // Timeout for texture loading

        // Set a timeout to force initialization if textures don't load within 10 seconds
        textureLoadTimeout = setTimeout(() => {
            console.warn("Texture loading timed out after 10 seconds, forcing initialization...");
            if (loadedTextures < totalTextures) {
                loadedTextures = totalTextures; // Force completion
                initializeScene();
            }
        }, 10000); // 10 seconds timeout

        projects.forEach((project, index) => {
            let material;
            try {
                const texture = new THREE.TextureLoader().load(
                    project.image,
                    (loadedTexture) => {
                        loadedTextures++;
                        console.log(`Texture loaded for project ${project.id}, ${loadedTextures}/${totalTextures}`);
                        // Update progress bar
                        if (progressIndicator) {
                            progressIndicator.value = (loadedTextures / totalTextures) * 100;
                        }

                        // Mimic object-fit: cover by adjusting texture scaling and offset
                        const textureAspectRatio = loadedTexture.image.width / loadedTexture.image.height;
                        let scaleX, scaleY, offsetX, offsetY;

                        if (textureAspectRatio > geometryAspectRatio) {
                            // Texture is wider than geometry: scale to fit height, crop width
                            scaleY = 1; // Fit the height
                            scaleX = geometryAspectRatio / textureAspectRatio;
                            offsetX = (1 - scaleX) / 2;
                            offsetY = 0;
                        } else {
                            // Texture is taller than geometry: scale to fit width, crop height
                            scaleX = 1; // Fit the width
                            scaleY = textureAspectRatio / geometryAspectRatio;
                            offsetX = 0;
                            offsetY = (1 - scaleY) / 2;
                        }

                        loadedTexture.repeat.set(scaleX, scaleY);
                        loadedTexture.offset.set(offsetX, offsetY);
                        // Improve texture filtering for mobile
                        loadedTexture.minFilter = THREE.LinearMipmapLinearFilter; // Better downscaling
                        loadedTexture.magFilter = THREE.NearestFilter; // Sharper upscaling
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
                        // Update progress bar even on error
                        if (progressIndicator) {
                            progressIndicator.value = (loadedTextures / totalTextures) * 100;
                        }
                        if (loadedTextures === totalTextures) {
                            clearTimeout(textureLoadTimeout);
                            initializeScene();
                        }
                    }
                );
                material = new THREE.MeshBasicMaterial({ color: 0xffffff, map: texture, side: THREE.DoubleSide });
            } catch (err) {
                console.warn(`Texture loading failed for ${project.image}. Using fallback material.`, err);
                material = new THREE.MeshBasicMaterial({ color: 0x888888, side: THREE.DoubleSide });
                loadedTextures++;
                // Update progress bar even on error
                if (progressIndicator) {
                    progressIndicator.value = (loadedTextures / totalTextures) * 100;
                }
                if (loadedTextures === totalTextures) {
                    clearTimeout(textureLoadTimeout);
                    initializeScene();
                }
            }
            const card = new THREE.Mesh(cardGeometry, material);
            card.position.set(0, 0, 0); // Temporary position
            card.lookAt(0, -5, 0); // Face the new center
            card.userData = { project };
            scene.add(card);
            cards.push(card);
        });

        function initializeScene() {
            // Initial card positioning
            cards.forEach((card, index) => {
                const angle = (index / cardCount) * Math.PI * 2 - Math.PI / 2;
                card.position.set(radius * Math.cos(angle), -3, radius * Math.sin(angle));
                card.lookAt(0, -5, 0); // Face the new center at y = -5

                // Add slight inward bloom effect
                card.rotation.x = -Math.PI / 12; // 15-degree inward tilt for bloom
            });

            // Add a cube to the center of the carousel using WebGL
            const cubeSize = 2; // Size of the cube (each side is a square)
            const cubeGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize); // Six-sided cube with square faces

            // Load images as textures for each face of the cube
            const cubeTextures = [
                './images/cube1.png', // Front
                './images/cube2.png', // Back
                './images/cube3.png', // Top
                './images/cube4.png', // Bottom
                './images/cube5.png', // Right
                './images/cube6.png'  // Left
            ];

            const cubeMaterials = cubeTextures.map((textureUrl, index) => {
                const texture = new THREE.TextureLoader().load(
                    textureUrl,
                    () => console.log(`Cube face ${index + 1} texture loaded: ${textureUrl}`),
                    undefined,
                    (err) => console.error(`Failed to load cube face ${index + 1} texture: ${textureUrl}`, err)
                );
                // Improve texture filtering for mobile
                texture.minFilter = THREE.LinearMipmapLinearFilter;
                texture.magFilter = THREE.NearestFilter;
                texture.needsUpdate = true;
                return new THREE.MeshBasicMaterial({ map: texture });
            });

            const cube = new THREE.Mesh(cubeGeometry, cubeMaterials);
            cube.position.set(0, -6.2, 0); // Place at the center of the carousel (based on initial lookAt)
            scene.add(cube);
            console.log("WebGL cube with image textures added at position:", cube.position);

            // Make the cube rotate slowly for visual effect (optional)
            cube.userData = { rotationSpeed: 0.01 }; // Store rotation speed for animation

            // Lighting
            const ambientLight = new THREE.AmbientLight(0x404040);
            scene.add(ambientLight);
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
            directionalLight.position.set(0, 1, 0);
            scene.add(directionalLight);

            // Animation and interaction
            let targetRotation = 0;
            let currentRotation = 0;
            const rotationSpeed = 0.1;
            const autoRotationSpeed = 0.003; // Speed of automatic rotation
            let isHovering = false; // Flag to track if mouse is hovering over a card

            // Close progress dialog and fade in the canvas
            if (progressDialog) {
                progressDialog.style.display = "none";
                console.log("Progress dialog closed.");
            }
            // Fade in the canvas and re-enable pointer events
            canvas.style.opacity = "1";
            canvas.style.pointerEvents = "auto";
            console.log("Canvas faded in and pointer events enabled.");

            // Force initial render with correct state
            if (controls) controls.update();
            renderer.render(scene, camera);

            function animate() {
                requestAnimationFrame(animate);

                // Smoothly interpolate camera z position for zoom-in effect
                if (currentZ > targetZ) {
                    currentZ -= zoomSpeed * (currentZ - targetZ);
                    if (currentZ < targetZ) currentZ = targetZ; // Clamp to target
                    camera.position.z = currentZ;
                }

                // Increment targetRotation for continuous rotation if not hovering
                if (!isHovering) {
                    targetRotation += autoRotationSpeed;
                }

                currentRotation += (targetRotation - currentRotation) * rotationSpeed;
                cards.forEach((card, index) => {
                    const angle = (index / cardCount) * Math.PI * 2 - Math.PI / 2 + currentRotation;
                    card.position.set(radius * Math.cos(angle), -4, radius * Math.sin(angle));
                    card.lookAt(0, 0, 0); // Face the new center

                    // Restore bloom effect
                    card.rotation.x += 0.0001;
                });

                // Rotate the cube (optional animation)
                cube.rotation.x += cube.userData.rotationSpeed;
                cube.rotation.y += cube.userData.rotationSpeed;

                if (controls) controls.update();
                renderer.render(scene, camera);
            }
            animate();

            // Handle window resize with breakpoint optimization
            let previousWidth = window.innerWidth;
            window.addEventListener("resize", () => {
                const currentWidth = window.innerWidth;
                renderer.setSize(currentWidth, window.innerHeight);
                renderer.setPixelRatio(window.devicePixelRatio); // Update pixel ratio on resize
                camera.aspect = currentWidth / window.innerHeight;
                camera.updateProjectionMatrix();

                // Only update camera settings if crossing the 800px breakpoint
                const wasMobile = previousWidth < 800;
                const isMobile = currentWidth < 800;
                if (wasMobile !== isMobile) {
                    console.log("Breakpoint crossed at 800px, updating camera settings. Previous width:", previousWidth, "Current width:", currentWidth);
                    updateCameraSettings();
                }
                previousWidth = currentWidth;
            });

            // Interaction: Click or Hover
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
                mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
                mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
                raycaster.setFromCamera(mouse, camera);
                const intersects = raycaster.intersectObjects(cards);
                if (intersects.length > 0) {
                    const card = intersects[0].object;
                    infoDiv.style.display = "block";
                    infoImage.src = card.userData.project.image;
                    infoText.innerHTML = `<h2>${card.userData.project.title}</h2><p>${card.userData.project.desc}</p>`;
                    isHovering = true; // Stop rotation on hover
                    canvas.style.cursor = "pointer"; // Change cursor to pointer on hover
                } else {
                    infoDiv.style.display = "none";
                    isHovering = false; // Resume rotation on mouse out
                    canvas.style.cursor = "default"; // Reset cursor to default
                }
            }

            function onClick(event) {
                // Check if the click target is within #menu, #menu2, a project, or #navWrapper
                const target = event.target;
                const isMenuClick = target.closest('#menu') || target.closest('#menu2');
                const projectIds = ["project1", "project2", "project3", "project4", "project5", "project6"];
                const isProjectClick = projectIds.some(id => target.closest(`#${id}`));
                const isNavigationClick = target.closest('#navWrapper');

                if (isMenuClick || isProjectClick || isNavigationClick) {
                    console.log("Click detected on menu, project, or navigation, ignoring canvas click. Menu:", isMenuClick, "Project:", isProjectClick, "Navigation:", isNavigationClick);
                    return; // Ignore clicks on menus, projects, or navigation elements
                }

                // Handle both mouse clicks and touch events
                const clientX = event.clientX || (event.changedTouches && event.changedTouches.length > 0 ? event.changedTouches[0].clientX : null);
                const clientY = event.clientY || (event.changedTouches && event.changedTouches.length > 0 ? event.changedTouches[0].clientY : null);

                if (clientX === null || clientY === null) {
                    console.warn("Unable to determine click/touch coordinates.");
                    return;
                }

                mouse.x = (clientX / window.innerWidth) * 2 - 1;
                mouse.y = -(clientY / window.innerHeight) * 2 + 1;
                raycaster.setFromCamera(mouse, camera);
                const intersects = raycaster.intersectObjects(cards);
                console.log("Raycaster intersects on click/touch:", intersects.length, intersects);

                if (intersects.length > 0) {
                    const card = intersects[0].object;
                    const projectId = card.userData.project.id;
                    console.log("Card clicked with project ID:", projectId);

                    const $targetProject = $("#" + projectId);
                    const $menu = $("#menu");
                    const $menu2 = $("#menu2");
                    const $aboutme = $("#aboutme");
                    const $hpgraphic = $("#hp-graphic");

                    console.log("Target project found:", $targetProject.length > 0, "ID:", projectId);

                    // Log all project containers for debugging
                    const $projectContainers = $(".project-container");
                    console.log("Found project containers:", $projectContainers.length, $projectContainers.map((i, el) => el.id).get());

                    // Hide all project containers
                    $projectContainers.css("display", "none");
                    console.log("Hid all project containers.");

                    // Show the selected project
                    if ($targetProject.length) {
                        $targetProject.css("display", "flex");
                        console.log("Showing project:", projectId);
                        // Disable canvas pointer events when a project is opened
                        canvas.style.pointerEvents = "none";
                        console.log("Canvas pointer events disabled while project is open.");
                    } else {
                        console.warn("No project found for ID:", projectId);
                    }

                    // Close menus and aboutme (like menu.js)
                    $menu.css("display", "none");
                    $menu2.css("display", "none");
                    $aboutme.css("display", "none");
                    console.log("Menus and aboutme closed.");

                    // Hide hp-graphic (like menu.js)
                    if ($hpgraphic.length) {
                        $hpgraphic.css("display", "none");
                        console.log("Hid homepage graphic.");
                    } else {
                        console.warn("Homepage graphic not found.");
                    }

                    // Reset toggle colors to black (like menu.js)
                    $("#mainToggle, #researchToggle, #aboutToggle").css("color", "black");
                    console.log("Reset all toggle colors to black.");

                    // Scroll to the top of the page
                    window.scrollTo({ top: 0, behavior: "smooth" });
                    console.log("Scrolled to top.");
                }
            }

            // Listen for click (desktop) and touchend (mobile) events
            window.addEventListener("click", onClick);
            window.addEventListener("touchend", onClick);

            window.addEventListener("mousemove", onMouseMove);
        }
    }
});