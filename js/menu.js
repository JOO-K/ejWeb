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
        $(document).on("click", "#aboutToggle", function () {
            const $menu = $("#menu");
            const $menu2 = $("#menu2");
            const $aboutme = $("#aboutme");
            const $hpgraphic = $("#hp-graphic");
            const $toggle = $(this);
            const isOpening = $aboutme.css("display") === "none";
            const newDisplay = isOpening ? "flex" : "none";
      
            const hpGraphicDisplay = isOpening ? "none" : "flex"; // Show hp-graphic when closing aboutme

            $aboutme.css("display", newDisplay);
            $menu.css("display", "none"); // Close workarchive menu
            $menu2.css("display", "none"); // Close researcharchive menu
            $hpgraphic.css("display", hpGraphicDisplay); // Toggle hp-graphic

            $(".project-container").css("display", "none"); // Close all projects

            console.log("About me toggled:", newDisplay);
            console.log("Homepage graphic closed.");
        });

        // Work-box click handler for both workarchive and researcharchive (using event delegation)
        $(document).on("click", ".work-box", function () {
            const projectId = $(this).attr("data-project-id");
            console.log("Work-box clicked with data-project-id:", projectId);

            const $targetProject = $("#" + projectId);
            console.log("Target project found:", $targetProject.length > 0, "ID:", projectId);

            const $menu = $("#menu");
            const $menu2 = $("#menu2");
            const $aboutme = $("#aboutme");
            const $hpgraphic = $("#hp-graphic");

            // Hide all project containers
            $(".project-container").css("display", "none");
            console.log("Hid all project containers.");

            // Show the selected project
            if ($targetProject.length) {
                $targetProject.css("display", "flex");
                console.log("Showing project:", projectId);
            } else {
                console.warn("No project found for ID:", projectId);
            }

            // Close both menus and aboutme
            $menu.css("display", "none");
            $menu2.css("display", "none");
            $aboutme.css("display", "none");
            console.log("Menus and aboutme closed.");

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
    });
});