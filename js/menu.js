$(document).ready(function () {
    // Wait for all parts to load
    $(document).on("allPartsLoaded", function () {
        // Menu toggle (using event delegation)
        $(document).on("click", "#mainToggle", function () {
            const $menu = $("#menu");
            $menu.css("display", $menu.css("display") === "none" ? "flex" : "none");
        });

        // Work-box click handler (using event delegation)
        $(document).on("click", ".work-box", function () {
            const projectId = $(this).attr("data-project-id");
            const $targetProject = $("#" + projectId);
            const $menu = $("#menu");

            // Hide all project containers
            $(".project-container").css("display", "none");

            // Show the selected project
            if ($targetProject.length) {
                $targetProject.css("display", "flex");
            }

            // Close the menu
            $menu.css("display", "none");

            // Scroll to the top of the page
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });
});