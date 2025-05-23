$(document).ready(function () {
    // Wait for all parts to load
    $(document).on("allPartsLoaded", function () {
        console.log("All parts loaded. Initializing menu and project handlers.");

        // Log available project containers
        const $projectContainers = $(".project-container");
        console.log("Found project containers:", $projectContainers.length, $projectContainers.map((i, el) => el.id).get());

        // Menu toggle for workarchive (using event delegation)
        $(document).on("click", "#mainToggle", function () {
            const $menu = $("#menu");
            const $menu2 = $("#menu2");
     
            const $toggle = $(this);
            const isOpening = $menu.css("display") === "none";
            const newDisplay = isOpening ? "flex" : "none";
   
            $menu.css("display", newDisplay);
            $menu2.css("display", "none"); // Close researcharchive menu
          
            $toggle.css("color", newColor);
            $(".project-container").css("display", "none"); // Close all projects

            console.log("Workarchive menu toggled:", newDisplay);
        });

        // Menu toggle for researcharchive (using event delegation)
        $(document).on("click", "#researchToggle", function () {
            const $menu = $("#menu");
            const $menu2 = $("#menu2");
       
            const $toggle = $(this);
            const isOpening = $menu2.css("display") === "none";
            const newDisplay = isOpening ? "flex" : "none";

            $menu2.css("display", newDisplay);
            $menu.css("display", "none"); // Close workarchive menu

            $toggle.css("color", newColor);
            $(".project-container").css("display", "none"); // Close all projects

            console.log("Researcharchive menu toggled:", newDisplay);
        });

        // About me toggle (using event delegation)
        $(document).on("click", "#aboutToggle", function (event) {
            event.stopPropagation(); // Prevent click from bubbling to carousel.js
            const $menu = $("#menu");
            const $menu2 = $("#menu2");
            let $aboutwrapper = $("#about-wrapper"); // Target the loaded content
            const $hpgraphic = $("#hp-graphic");
            const $toggle = $(this);

            // Ensure #about-wrapper exists in the DOM
            if ($aboutwrapper.length === 0) {
                console.warn("About wrapper element not found in DOM. Cannot toggle. Retrying...");
                $aboutwrapper = $("#about-wrapper");
            }

            if ($aboutwrapper.length === 0) {
                console.error("About wrapper element still not found after retry. Cannot toggle.");
                return;
            }

            // Toggle display
            const isOpening = $aboutwrapper.css("display") === "none";
            const newDisplay = isOpening ? "flex" : "none";

            // Debug logs to trace the display state
            console.log("About wrapper display before toggle:", $aboutwrapper.css("display"));
            console.log("HP graphic display before toggle:", $hpgraphic.css("display"));
            console.log("Toggling about wrapper to:", newDisplay);

            // Set the display property with a slight delay to account for DOM updates
            setTimeout(() => {
                $aboutwrapper.css({
                    display: newDisplay
                });
                console.log("About wrapper display after toggle:", $aboutwrapper.css("display"));

                // If toggling #about-wrapper off, restore #hp-graphic if no other sections are open
                if (!isOpening) { // isOpening is true when opening, false when closing
                    const $visibleProjects = $(".project-container").filter(function() {
                        return $(this).css("display") !== "none";
                    });
                    const isMenuOpen = $menu.css("display") !== "none";
                    const isMenu2Open = $menu2.css("display") !== "none";
                    const otherSectionsOpen = $visibleProjects.length > 0 || isMenuOpen || isMenu2Open;

                    if ($hpgraphic.css("display") === "none" && !otherSectionsOpen) {
                        $hpgraphic.css("display", "flex");
                        console.log("Restored HP graphic to display: flex");
                        // Re-enable carousel canvas clicks if no projects are open
                        const canvas = document.getElementById("carouselCanvas");
                        if (canvas) {
                            canvas.style.pointerEvents = "auto";
                            console.log("Re-enabled carousel canvas pointer events.");
                        }
                    } else {
                        console.log("HP graphic not restored. Other sections open:", otherSectionsOpen, "HP graphic display:", $hpgraphic.css("display"));
                    }
                } else {
                    // When opening #about-wrapper, ensure carousel canvas clicks are disabled
                    const canvas = document.getElementById("carouselCanvas");
                    if (canvas) {
                        canvas.style.pointerEvents = "none";
                        console.log("Disabled carousel canvas pointer events while about-wrapper is open.");
                    }
                }

                console.log("HP graphic display after toggle:", $hpgraphic.css("display"));
            }, 100);

            $menu.css("display", "none"); // Close workarchive menu
            $menu2.css("display", "none"); // Close researcharchive menu
            // Do NOT hide hp-graphic; let it stay visible in the background

            $(".project-container").css("display", "none"); // Close all projects

            console.log("About wrapper toggled:", newDisplay);
        });

        // Work-box click handler for both workarchive and researcharchive (using event delegation)
        $(document).on("click", ".work-box", function (event) {
            const $workBox = $(this);
            const $closestContainer = $workBox.closest("#menu, #menu2");

            // Check if the closest menu container is visible
            if ($closestContainer.length && $closestContainer.css("display") === "none") {
                console.log("Ignoring click on .work-box because its menu container is hidden:", $closestContainer.attr("id"));
                return;
            }

            const projectId = $workBox.attr("data-project-id");
            console.log("Work-box clicked with data-project-id:", projectId);

            const $targetProject = $("#" + projectId);
            console.log("Target project found:", $targetProject.length > 0, "ID:", projectId);

            const $menu = $("#menu");
            const $menu2 = $("#menu2");
            const $aboutwrapper = $("#about-wrapper");
            const $hpgraphic = $("#hp-graphic");
            const $form = $("#form");

            // Hide all project containers
            $(".project-container").css("display", "none");
            console.log("Hid all project containers.");

            // Show the selected project
            if ($targetProject.length) {
                $targetProject.css("display", "flex");
                console.log("Showing project:", projectId);

                // Disable carousel canvas clicks when a project is opened
                const canvas = document.getElementById("carouselCanvas");
                if (canvas) {
                    canvas.style.pointerEvents = "none";
                    console.log("Disabled carousel canvas pointer events while project is open.");
                }
            } else {
                console.warn("No project found for ID:", projectId);
            }

            // Close both menus and aboutme
            $menu.css("display", "none");
            $menu2.css("display", "none");
            if ($aboutwrapper.length) {
                $aboutwrapper.css("display", "none");
            }
            // Close the form when opening a project
            if ($form.length) {
                $form.css("display", "none");
                console.log("Closed form when opening project.");
            }
            console.log("Menus and about wrapper closed.");

            // Hide the homepage graphic
            if ($hpgraphic.length) {
                $hpgraphic.css("display", "none");
                console.log("Hid homepage graphic.");
            } else {
                console.warn("Homepage graphic not found.");
            }

            // Reset toggle colors to black
            $("#mainToggle, #researchToggle, #aboutToggle").css("color", "black");
            console.log("Reset all toggle colors to black.");

            // Scroll to the top of the page
            window.scrollTo({ top: 0, behavior: "smooth" });
            console.log("Scrolled to top.");
        });

        // Stop clicks within project containers from bubbling up to the carousel
        $(document).on("click", ".project-container", function (event) {
            event.stopPropagation();
            console.log("Click within project container stopped propagation:", $(this).attr("id"));
        });
    });
});