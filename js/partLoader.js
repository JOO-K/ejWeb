$(document).ready(function () {
    let loadedCount = 0;
    const totalParts = 18; // Number of $.get calls
    const onAllPartsLoaded = () => {
        if (++loadedCount === totalParts) {
            // Trigger custom event when all parts are loaded
            $(document).trigger("allPartsLoaded");
        }
    };

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

    $.get("./html/researcharchive.html", function (data) {
        $("#researcharchive").replaceWith(data);
        onAllPartsLoaded();
    });

    $.get("./html/aboutme.html", function (data) {
        $("#aboutme").replaceWith(data);
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

            $.get("./archive/projects/exampleproj4.html", function (data) {
        $("#exampleproj4").replaceWith(data);
        onAllPartsLoaded();
    });

            $.get("./archive/projects/exampleproj5.html", function (data) {
        $("#exampleproj5").replaceWith(data);
        onAllPartsLoaded();
    });

            $.get("./archive/projects/exampleproj6.html", function (data) {
        $("#exampleproj6").replaceWith(data);
        onAllPartsLoaded();
    });

                $.get("./archive/research/researchproj.html", function (data) {
        $("#researchproj").replaceWith(data);
        onAllPartsLoaded();
    });

    
                $.get("./archive/research/researchproj2.html", function (data) {
        $("#researchproj2").replaceWith(data);
        onAllPartsLoaded();
    });

    
                $.get("./archive/research/researchproj3.html", function (data) {
        $("#researchproj3").replaceWith(data);
        onAllPartsLoaded();
    });

    
                $.get("./archive/research/researchproj4.html", function (data) {
        $("#researchproj4").replaceWith(data);
        onAllPartsLoaded();
    });

    
                $.get("./archive/research/researchproj5.html", function (data) {
        $("#researchproj5").replaceWith(data);
        onAllPartsLoaded();
    });


    
                $.get("./archive/research/researchproj6.html", function (data) {
        $("#researchproj6").replaceWith(data);
        onAllPartsLoaded();
    });
});