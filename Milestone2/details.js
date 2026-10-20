$(document).ready(function () {
    // Extract search
    const urlParams = new URLSearchParams(window.location.search);
    const workId = urlParams.get("id");

    const fallbackCover = 
        "https://placehold.co/400x600?text=No+Cover";
    
    if (!workId || !/^\/works\/OL\d+W$/.test(workId)) {
        showErrorState("No valid book identifier found in the URL. Please return to the homepage.");
        return;
    }
    fetchBookDetails(workId); {
        showLoadingState();

        const apiURL = 
            "https://openlibrary.org" + id + ".json";
        try {
            const response = await fetch(apiURL, {
                method: "GET",
                headers: {
                    Accept: "application/json"
                }
            });

            if (!response.ok) {
                throw new Error(
                    response.status === 404
                        ? "Book details were not found."
                        : "Unable to retrieve book details. Please try again."
                );
            }

            const data = await response.json();

            renderBookDetails(data, id);
        } catch (error) {
            console.error(
                "Details API execution failure:",
                error
            );

            showErrorState(
                error.message ||
                "An unexpected error occurred while loading the book."
            );
        }
    }

    // Book Information
    function renderBookDetails(data, id) {
        // 1. Book Title
        const title = data.title || "Untitled Work";
        
        document.title = title + " | Book Details";
        $("#bookTitle").text(title);
        
        // 2. Work ID Component
        $("#bookWorkId").text(id);

        // 3. Description
        let description = "No description profile recorded for this volume.";
        if (data.description) {
            if (typeof data.description === "string") {
                description = data.description;
            } else if (data.description.value && typeof data.description.value === "string") {
                description = data.description.value;
            }
        }
        $("#bookDescription").text(description);

        // 4. Cover Image 
        let coverUrl = fallbackCover;
        if ( Array.isArray(data.covers && data.covers.length > 0) {
            const coverId = data.covers.find(
                id => Number.isInteger(id) && id > 0
            );
            if (coreCoverId) {
                coverUrl = "https://covers.openlibrary.org/b/id/" + coverId + "-M.jpg";
            }
        }
        $("#bookCover")
            .attr("src", coverUrl)
            .attr("alt", "Cover for " + title)
            .off("error")
            .on("error, function () {
                $(this)
                    .off("error")
                    .attr("src", fallbackCover);
            });

        // 5. open library link
        const externalOlUrl = "https://openlibrary.org" + id;
        $("#openLibraryLink").attr("href", externalOlUrl);
        $("#statusMessage").addClass("hidden");
        $("#bookDetailsContainer").removeClass("hidden");
    }

    function showLoadingState() {
        $("#bookDetailsContainer").addClass("hidden");
        $("#statusMessage")
            .html(`
                <div class="flex flex-col items-center justify-center gap-3 py-12">
                    <div class="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <p class="text-base font-medium text-gray-500">Loading book details...</p>
                </div>
            `)
            .removeClass("hidden");
    }

    function showErrorState(errorMsg) {
        $("#bookDetailsContainer").addClass("hidden");

        const $status = $("#statusMessage").empty();

        const $container = $("<div>")
            .addClass(
                "bg-red-50 border border-red-200 rounded-xl p-6 text-center max-w-xl mx-auto shadow-sm"
            );

        $("<p>")
            .addClass("text-red-600 font-bold text-lg mb-1")
            .text("⚠️ Unable to Load Book Details")
            .appendTo($container);

        $("<p>")
            .addClass(
                "text-sm text-red-500 font-mono bg-white p-3 border border-red-100 rounded text-left overflow-x-auto mt-2"
            )
            .text(errorMsg)
            .appendTo($container);

        $("<a>")
            .attr("href", "index.html")
            .addClass(
                "inline-block mt-4 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition"
            )
            .text("← Return to Main Finder")
            .appendTo($container);

        $status.append($container).removeClass("hidden");
    }
});
