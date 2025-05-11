$(document).ready(function () {
    let loadedCount = 0;
    const totalParts = 7; // Number of $.get calls
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

    $.get("./html/backgroundAnimation.html", function (data) {
        $("#backgroundAnimation-Placeholder").replaceWith(data);
        onAllPartsLoaded();
    });

    $.get("./html/desktopAnim.html", function (data) {
        $("#desktopAnim-Placeholder").replaceWith(data);
        onAllPartsLoaded();
    });

    $.get("./html/navigation.html", function (data) {
        $("#navigation").replaceWith(data);
        onAllPartsLoaded();
    });

    $.get("./html/workarchive.html", function (data) {
        $("#workarchive").replaceWith(data);
        onAllPartsLoaded();
    });

    $.get("./archive/projects/exampleproj.html", function (data) {
        $("#exampleproj").replaceWith(data);
        onAllPartsLoaded();
    });

    $.get("./archive/projects/exampleproj2.html", function (data) {
        $("#exampleproj2").replaceWith(data);
        onAllPartsLoaded();
    });

        $.get("./archive/projects/exampleproj3.html", function (data) {
        $("#exampleproj3").replaceWith(data);
        onAllPartsLoaded();
    });
});