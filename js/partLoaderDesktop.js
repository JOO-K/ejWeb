$(document).ready(function () {
    let loadedCount = 0;
    const totalParts = 1; // Number of $.get calls
    const onAllPartsLoaded = () => {
        if (++loadedCount === totalParts) {
            // Trigger custom event when all parts are loaded
            $(document).trigger("allPartsLoaded");
        }
    };

    $.get("./html/desktopNav.html", function (data) {
        $("#desktopNav-Placeholder").replaceWith(data);
        onAllPartsLoaded();
    });
});