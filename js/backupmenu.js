$(document).ready(function () {
    // Wait for all parts to load
    $(document).on("allPartsLoaded", function () {
        console.log("All parts loaded. Initializing menu and project handlers.");

        // Log available project containers
        const $projectContainers = $(".project-container");
        console.log("Found project containers:", $projectContainers.length, $projectContainers.map((i, el) => el.id).get());

        // Menu toggle (using event delegation)
        $(document).on("click", "#mainToggle", function () {
            const $menu = $("#menu");
            const $toggle = $(this);
            const isOpening = $menu.css("display") === "none";
            const newDisplay = isOpening ? "flex" : "none";
            const newColor = isOpening ? "dodgerblue" : "black";

            $menu.css("display", newDisplay);
            $toggle.css("color", newColor);

            console.log("Menu toggled:", newDisplay, "Toggle color:", newColor);
        });

        // Work-box click handler (using event delegation)
        $(document).on("click", ".work-box", function () {
            const projectId = $(this).attr("data-project-id");
            console.log("Work-box clicked with data-project-id:", projectId);

            const $targetProject = $("#" + projectId);
            console.log("Target project found:", $targetProject.length > 0, "ID:", projectId);

            const $menu = $("#menu");
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

            // Close the menu
            $menu.css("display", "none");
            console.log("Menu closed.");

            // Hide the homepage graphic
            if ($hpgraphic.length) {
                $hpgraphic.css("display", "none");
                console.log("Hid homepage graphic.");
            } else {
                console.warn("Homepage graphic not found.");
            }

            // Reset mainToggle color to black
            $("#mainToggle").css("color", "black");
            console.log("Reset mainToggle color to black.");

            // Scroll to the top of the page
            window.scrollTo({ top: 0, behavior: "smooth" });
            console.log("Scrolled to top.");
        });
    });
});