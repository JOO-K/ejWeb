document.addEventListener("DOMContentLoaded", () => {
    const eventTimeout = setTimeout(() => {
        console.warn('"allPartsLoaded" event did not fire within 10 seconds, forcing initialization...');
        initializeCarousel();
    }, 10000);

    $(document).on("allPartsLoaded", () => {
        clearTimeout(eventTimeout);
        initializeCarousel();
    });

    function initializeCarousel() {
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
        console.log("Fixing canvas view with initial dimensions:", initialWidth, "x", initialHeight);

        const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
        renderer.setSize(initialWidth, initialHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setClearColor(0xe0e0e0); // Set renderer clear color to #e0e0e0
        console.log("Renderer clear color set to:", renderer.getClearColor().getHexString());

        const gl = renderer.getContext();
        const anisotropicExt = gl.getExtension('EXT_texture_filter_anisotropic') || gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic');
        if (anisotropicExt) {
            const maxAnisotropy = gl.getParameter(anisotropicExt.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
            THREE.Texture.DEFAULT_ANISOTROPY = Math.min(maxAnisotropy, 16);
            console.log("Anisotropic filtering enabled with level:", THREE.Texture.DEFAULT_ANISOTROPY);
        }

        canvas.style.opacity = "0";
        canvas.style.transition = "opacity 1s ease-in";
        canvas.style.pointerEvents = "none";
        // Set a fallback background color for the canvas
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
            console.log("OrbitControls initialized with all interactive features disabled. Max distance set to:", controls.maxDistance);
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
                console.log("Camera updated for initial screen width:", initialWidth, "Camera position:", camera.position, "Controls target:", controls.target);
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
                        console.log(`Texture loaded for project ${project.id}, ${loadedTextures}/${totalTextures}`);
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
                material = new THREE.MeshBasicMaterial({ color: 0xffffff, map: texture, side: THREE.DoubleSide });
            } catch (err) {
                console.warn(`Texture loading failed for ${project.image}. Using fallback material.`, err);
                material = new THREE.MeshBasicMaterial({ color: 0x888888, side: THREE.DoubleSide });
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
        let backgroundIndex = 0; // Track the current background state (0 = solid color, 1-3 = skybox textures)
        const backgroundPaths = [
            null, // Will be replaced with a solid color texture
            './images/sky3.jpg',
            './images/sky2.jpg',
            './images/sky1.jpg'
        ];
        const backgroundTextures = [];

        // Create a solid #e0e0e0 texture for the initial background
        const solidColorCanvas = document.createElement('canvas');
        solidColorCanvas.width = 512;
        solidColorCanvas.height = 512;
        const context = solidColorCanvas.getContext('2d');
        context.fillStyle = '#e0e0e0';
        context.fillRect(0, 0, solidColorCanvas.width, solidColorCanvas.height);
        const solidColorTexture = new THREE.CanvasTexture(solidColorCanvas);
        solidColorTexture.needsUpdate = true;
        console.log("Created solid #e0e0e0 texture for initial skybox background");

        // Preload background textures
        backgroundPaths.forEach((path, index) => {
            if (index === 0) {
                // Use the solid color texture for the first background
                backgroundTextures[index] = solidColorTexture;
            } else if (path) {
                const texture = new THREE.TextureLoader().load(
                    path,
                    () => console.log(`Background texture ${index} loaded: ${path}`),
                    undefined,
                    (err) => console.error(`Failed to load background texture ${index}: ${path}`, err)
                );
                texture.mapping = THREE.EquirectangularReflectionMapping;
                backgroundTextures[index] = texture;
            }
        });

        function applyBackground(index) {
            if (backgroundTextures[index]) {
                skybox.material.map = backgroundTextures[index];
                skybox.material.needsUpdate = true;
                if (index === 0) {
                    console.log("Applied solid #e0e0e0 background");
                } else {
                    console.log(`Applied background: ${backgroundPaths[index]}`);
                }
            }
        }

        function initializeScene() {
            cards.forEach((card, index) => {
                const angle = (index / cardCount) * Math.PI * 2 - Math.PI / 2;
                card.position.set(radius * Math.cos(angle), -3, radius * Math.sin(angle));
                card.lookAt(0, -5, 0);
                card.rotation.x = -Math.PI / 12;
            });

            // Create a skybox sphere (large sphere around the scene)
            const skyboxRadius = 500; // Large enough to encompass the scene
            const skyboxGeometry = new THREE.SphereGeometry(skyboxRadius, 32, 32);
            const skyboxMaterial = new THREE.MeshBasicMaterial({
                side: THREE.BackSide, // Render on the inside of the sphere
                transparent: true,
                opacity: 1
            });
            skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterial);
            // Rotate the skybox to align the horizon with the camera's view
            skybox.rotation.x = Math.PI / -3.5; // Align horizon
            skybox.rotation.y = Math.PI / -7; // Initial Y rotation
            skybox.userData = { rotationSpeed: 0.001 }; // Add rotation speed for skybox
            scene.add(skybox);
            console.log("Skybox added to scene with initial rotation:", skybox.rotation.x, skybox.rotation.y);

            // Initially apply the solid color background
            applyBackground(0);

            const sphereRadius = 1.5;
            const sphereGeometry = new THREE.SphereGeometry(sphereRadius, 32, 32);

            const textureUrl = './images/cube1.png';
            const texture = new THREE.TextureLoader().load(
                textureUrl,
                () => console.log(`Sphere texture loaded: ${textureUrl}`),
                undefined,
                (err) => console.error(`Failed to load sphere texture: ${textureUrl}`, err)
            );
            texture.minFilter = THREE.LinearMipmapLinearFilter;
            texture.magFilter = THREE.NearestFilter;
            texture.needsUpdate = true;
            const sphereMaterial = new THREE.MeshBasicMaterial({ map: texture });

            sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
            sphere.position.set(0, -6.2, 0);
            scene.add(sphere);
            console.log("WebGL sphere with single texture added at position:", sphere.position);

            sphere.userData = { rotationSpeed: 0.005 };

            const ambientLight = new THREE.AmbientLight(0x404040);
            scene.add(ambientLight);
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
            directionalLight.position.set(0, 1, 0);
            scene.add(directionalLight);

            if (progressDialog) {
                progressDialog.style.display = "none";
                console.log("Progress dialog closed.");
            }
            canvas.style.opacity = "1";
            canvas.style.pointerEvents = "auto";
            console.log("Canvas faded in and pointer events enabled.");

            if (controls) controls.update();
            renderer.render(scene, camera);

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

                // Rotate the central sphere
                sphere.rotation.x += sphere.userData.rotationSpeed;
                sphere.rotation.y += sphere.userData.rotationSpeed;

                // Rotate the skybox slowly around the Y-axis
                skybox.rotation.y += skybox.userData.rotationSpeed;

                if (controls) controls.update();
                renderer.render(scene, camera);
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

                // Check for sphere hover first
                const sphereIntersects = raycaster.intersectObject(sphere);
                if (sphereIntersects.length > 0) {
                    console.log("Hovering over sphere");
                    canvas.style.cursor = "pointer";
                    return;
                }

                // Check for card hover
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
                    console.log("Click detected on menu, project, navigation, about-wrapper, contact button, or form, ignoring canvas click. Menu:", isMenuClick, "Project:", isProjectClick, "Navigation:", isNavigationClick, "AboutWrapper:", isAboutWrapperClick, "ContactButton:", isContactButtonClick, "Form:", isFormClick);
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

                // Check for sphere click first
                const sphereIntersects = raycaster.intersectObject(sphere);
                if (sphereIntersects.length > 0) {
                    console.log("Sphere clicked, cycling background...");
                    backgroundIndex = (backgroundIndex + 1) % backgroundPaths.length;
                    applyBackground(backgroundIndex);
                    renderer.render(scene, camera);
                    return;
                }

                // Check for card clicks
                const cardIntersects = raycaster.intersectObjects(cards);
                console.log("Raycaster intersects on click/touch:", cardIntersects.length, cardIntersects);

                if (cardIntersects.length > 0) {
                    const card = cardIntersects[0].object;
                    const projectId = card.userData.project.id;
                    console.log("Card clicked with project ID:", projectId);

                    const $targetProject = $("#" + projectId);
                    const $menu = $("#menu");
                    const $menu2 = $("#menu2");
                    const $aboutwrapper = $("#about-wrapper");
                    const $hpgraphic = $("#hp-graphic");

                    console.log("Target project found:", $targetProject.length > 0, "ID:", projectId);

                    const $projectContainers = $(".project-container");
                    console.log("Found project containers:", $projectContainers.length, $projectContainers.map((i, el) => el.id).get());

                    $projectContainers.css("display", "none");
                    console.log("Hid all project containers.");

                    if ($targetProject.length) {
                        $targetProject.css("display", "flex");
                        console.log("Showing project:", projectId);
                        canvas.style.pointerEvents = "none";
                        console.log("Disabled carousel canvas pointer events while project is open.");
                    } else {
                        console.warn("No project found for ID:", projectId);
                    }

                    $menu.css("display", "none");
                    $menu2.css("display", "none");
                    if ($aboutwrapper.length) {
                        $aboutwrapper.css("display", "none");
                        console.log("Closed about-wrapper.");
                    }
                    console.log("Menus and about-wrapper closed.");

                    if ($hpgraphic.length) {
                        $hpgraphic.css("display", "none");
                        console.log("Hid homepage graphic.");
                    } else {
                        console.warn("Homepage graphic not found.");
                    }

                    $("#mainToggle, #researchToggle, #aboutToggle").css("color", "black");
                    console.log("Reset all toggle colors to black.");

                    window.scrollTo({ top: 0, behavior: "smooth" });
                    console.log("Scrolled to top.");
                }
            }

            // Stop clicks on contact buttons from bubbling up to the carousel
            document.getElementById('contactbutton')?.addEventListener('click', (event) => {
                event.stopPropagation();
                console.log("Click on contactbutton stopped propagation.");
            });

            document.getElementById('mobilecontactbutton')?.addEventListener('click', (event) => {
                event.stopPropagation();
                console.log("Click on mobilecontactbutton stopped propagation.");
            });

            // Stop clicks on the form from bubbling up to the carousel
            document.getElementById('form')?.addEventListener('click', (event) => {
                event.stopPropagation();
                console.log("Click on form stopped propagation.");
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