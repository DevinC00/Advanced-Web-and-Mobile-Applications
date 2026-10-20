$(document).ready(function () {
    // 1. Extract the book ID from the URl
    const urlParams = new URLSearchParams(window.location.search);
    let workId = urlParams.get("id");

    const fallbackCover =
        "https://placehold.co/400x600?text=No+Cover";

    // 2. Normalize the ID
    if (workId) {
        workId = workId.trim();

        if (/^OL\d+W$/i.test(workId)) {
            workId = "/works/" + workId.toUpperCase();
        } else if (/^\/works\/OL\d+W$/i.test(workId)) {
            workId = workId.toUpperCase();
        }
    }

    // 3. Validate the work ID
    if (!workId || !/^\/works\/OL\d+W$/.test(workId)) {
        showErrorState(
            "Invalid or missing book ID. Please return to the homepage and select a book."
        );
        return;
    }

    // 4. Fetch the book details
    fetchBookDetails(workId);

    async function fetchBookDetails(id) {
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
                        ? "Book details were not found. Please check the book ID."
                        : "Open Library returned HTTP " + response.status
                );
            }

            const data = await response.json();

            renderBookDetails(data, id);

        } catch (error) {
            console.error("Details API Execution Failure:", error);

            let message = error.message;

            if (error instanceof TypeError) {
                message =
                    "Failed to fetch book details. Check your internet connection " +
                    "and make sure Open Library is accessible.";
            }

            showErrorState(message);
        }
    }

    // 5. book information
    function renderBookDetails(data, id) {
        const title = data.title || "Untitled Work";

        // Book title Section
        document.title = title + " | Book Details";
        $("#bookTitle").text(title);

        // Work ID Section
        $("#bookWorkId").text(id);

        // Description Section
        let description =
            "No description is available for this book.";

        if (typeof data.description === "string") {
            description = data.description;
        } else if (
            data.description &&
            typeof data.description.value === "string"
        ) {
            description = data.description.value;
        }

        $("#bookDescription").text(description);

        // Cover image
        let coverUrl = fallbackCover;

        if (Array.isArray(data.covers) && data.covers.length > 0) {
            const coverId = data.covers.find(
                cover => Number.isInteger(cover) && cover > 0
            );

            if (coverId) {
                coverUrl =
                    "https://covers.openlibrary.org/b/id/" +
                    coverId +
                    "-L.jpg";
            }
        }

        $("#bookCover")
            .off("error")
            .attr("src", coverUrl)
            .attr("alt", "Cover for " + title)
            .on("error", function () {
                $(this)
                    .off("error")
                    .attr("src", fallbackCover);
            });

        // Link to the Open Library work page
        $("#openLibraryLink").attr(
            "href",
            "https://openlibrary.org" + id
        );

        // Display the details
        $("#statusMessage").addClass("hidden");
        $("#bookDetailsContainer").removeClass("hidden");
    }

    // 6. Loading state Sectiom
    function showLoadingState() {
        $("#bookDetailsContainer").addClass("hidden");

        $("#statusMessage")
            .html(`
                <div class="flex flex-col items-center justify-center gap-3 py-12">
                    <div class="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>

                    <p class="text-base font-medium text-gray-500">
                        Loading book details...
                    </p>
                </div>
            `)
            .removeClass("hidden");
    }

    // 7. Error state section
    function showErrorState(errorMsg) {
        $("#bookDetailsContainer").addClass("hidden");

        const $status = $("#statusMessage").empty();

        const $container = $("<div>").addClass(
            "bg-red-50 border border-red-200 rounded-xl p-6 text-center max-w-xl mx-auto shadow-sm"
        );

        $("<p>")
            .addClass("text-red-600 font-bold text-lg mb-1")
            .text("Unable to Load Book Details")
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
