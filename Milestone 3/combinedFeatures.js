$(document).ready(function () {
    // Updated, combined, and organized JavaScript code for Milestone 3 Book Search SPA

    // 1. Application State

    let currentSearchTerm = "";
    let currentPage = 1;
    let currentLimit = 10;
    let totalResultsFound = 0;
    let previousView = "homeView";
    let searchController = null;
    let detailsController = null;
    let searchRequestNumber = 0;
    let detailsRequestNumber = 0;

    const fallbackCover =
        "https://placehold.co/400x600?text=No+Cover";

    const featuredBookIds = [
        "OL82563W",     // Harry Potter and the Philosopher's Stone
        "OL7924103W",   // The Eye of the World
        "OL2679341W",   // The Magicians
        "OL27482W",     // The Hobbit
        "OL27513W",     // The Fellowship of the Ring
        "OL71037W",     // The Lion, the Witch and the Wardrobe
        "OL5738148W",   // Mistborn: The Final Empire
        "OL59798W",     // A Wizard of Earthsea
        "OL8479867W",   // The Name of the Wind
        "OL16086747W"   // The Night Circus
    ];

    // 2. Navigation

    function showView(viewId) {
        $("#homeView, #searchView, #detailsView")
            .addClass("hidden");
        $("#" + viewId).removeClass("hidden");
    }

    $("#homeNavBtn").on("click", function () {
        showView("homeView");
    });

    $("#searchNavBtn").on("click", function () {
        showView("searchView");
    });

    $("#backBtn").on("click", function () {
        showView(previousView);
    });

    // 3. Book Search

    $("#searchForm").on("submit", function (e) {
        e.preventDefault();
        currentSearchTerm =
            $("#searchInput").val().trim();
        currentLimit =
            parseInt($("#limitSelect").val(), 10) || 10;
        currentPage = 1;
        if (currentSearchTerm) {
            previousView = "searchView";
            showView("searchView");
            fetchBooks();
        }
    });

    // Fetch search results from Open Library
    function fetchBooks() {
        if (searchController) {
            searchController.abort();
        }
        searchController = new AbortController();
        const controller = searchController;
        const requestNumber = ++searchRequestNumber;
        showSearchLoading();
        const searchParams = new URLSearchParams({
            q: currentSearchTerm,
            page: currentPage,
            limit: currentLimit,
            fields: "key,title,author_name,cover_i"
        });
        const apiURL =
            "https://openlibrary.org/search.json?" +
            searchParams.toString();
        const timeoutId = setTimeout(function () {
            controller.abort();
        }, 15000);
        const ajaxRequest = $.ajax({
            url: "https://openlibrary.org/search.json",
            method: "GET",
            dataType: "json",
        data: {
            q: currentSearchTerm,
            page: currentPage,
            limit: currentLimit,
            fields: "key,title,author_name,cover_i"
        },
        timeout: 15000,
        success: function (data) {
            if (requestNumber !== searchRequestNumber) {
                return;
            }
            totalResultsFound =
                data.numFound ?? data.num_found ?? 0;
            renderResults(data.docs || []);
        },

        error: function (xhr, status, error) {
            if (
                status === "abort" ||
                requestNumber !== searchRequestNumber
            ) {
                return;
            }
            console.error("Search Failure:", error);
            if (status === "timeout") {
                showSearchError("The request timed out.");
            } else {
                showSearchError(
                    error || "Unable to retrieve books."
                );
            }
        }
    });

    searchController = {
        abort: function () {
            ajaxRequest.abort();
        }
    };
    }

    // 4. Display Search Results

    function renderResults(books) {
        const grid = $("#resultsGrid");
        grid.empty();
        $("#searchStatus")
            .addClass("hidden")
            .empty();
        if (!books || books.length === 0) {
            $("#searchStatus")
                .text(
                    'No books found matching "' +
                    currentSearchTerm + '".'
                )
                .removeClass("hidden");
            $("#paginationControls")
                .addClass("hidden");
            $("#searchSummary").text("No results found.");
            return;
        }
        $("#searchSummary").text(
            totalResultsFound.toLocaleString() +
            " books found for \"" +
            currentSearchTerm + "\""
        );
        books.forEach(function (book) {
            const title = book.title || "Unknown Title";
            const author = Array.isArray(book.author_name)
                ? book.author_name.join(", ")
                : "Unknown Author";
            const workId = extractWorkId(book.key);
            const coverUrl = book.cover_i
                ? "https://covers.openlibrary.org/b/id/" +
                  book.cover_i + "-M.jpg"
                : fallbackCover;
            const card = $("<button>", {
                type: "button",
                class: "book-card"
            });
            const image = $("<img>", {
                src: coverUrl,
                alt: "Cover for " + title,
                loading: "lazy"
            });
            image.on("error", function () {
                $(this)
                    .off("error")
                    .attr("src", fallbackCover);
            });
            const cardInfo = $("<div>", {
                class: "book-card-info"
            });
            const titleElement = $("<h3>")
                .text(title);
            const authorElement = $("<p>")
                .text(author);
            cardInfo.append(titleElement, authorElement);
            card.append(image, cardInfo);
            card.on("click", function () {
                if (workId) {
                    previousView = "searchView";
                    loadBookDetails(workId);
                }
            });
            if (!workId) {
                card.prop("disabled", true);
            }
            grid.append(card);
        });
        updatePagination();
    }

    // Extract the Open Library work ID
    function extractWorkId(key) {
        if (typeof key !== "string") {
            return null;
        }
        const match = key.match(
            /^\/works\/(OL\d+W)$/i
        );
        return match
            ? match[1].toUpperCase()
            : null;
    }

    // 5. Pagination

    $("#prevBtn").on("click", function () {
        if (currentPage > 1) {
            currentPage--;
            fetchBooks();
        }
    });

    $("#nextBtn").on("click", function () {
        const totalPages = Math.ceil(
            totalResultsFound / currentLimit
        );
        if (currentPage < totalPages) {
            currentPage++;
            fetchBooks();
        }
    });

    $("#limitSelect").on("change", function () {
        currentLimit =
            parseInt($(this).val(), 10) || 10;
        if (currentSearchTerm) {
            currentPage = 1;
            fetchBooks();
        }
    });

    function updatePagination() {
        const totalPages = Math.ceil(
            totalResultsFound / currentLimit
        );

        const pagination = $("#paginationControls");

        if (totalPages <= 1) {
            pagination.addClass("hidden");
            return;
        }
        pagination.removeClass("hidden");
        $("#pageIndicator").text(
            "Page " + currentPage +
            " of " + totalPages
        );
        $("#prevBtn").prop(
            "disabled",
            currentPage <= 1
        );
        $("#nextBtn").prop(
            "disabled",
            currentPage >= totalPages
        );
    }

    // 6. Book Details

    function loadBookDetails(workId) {
        if (!/^OL\d+W$/.test(workId)) {
            showView("detailsView");
            showDetailsError("Invalid book ID.");
            return;
        }

        showView("detailsView");

        $("#bookDetailsContainer")
            .addClass("hidden");

        showDetailsLoading();

        if (detailsController) {
            detailsController.abort();
        }

        detailsController = new AbortController();

        const requestNumber = ++detailsRequestNumber;
        const ajaxRequest = $.ajax({

            url: "https://openlibrary.org/works/" +
                workId + ".json",
        method: "GET",
        dataType: "json",
        timeout: 15000,
        success: function (data) {
            if (requestNumber !== detailsRequestNumber) {
                return;
            }
            renderBookDetails(data, workId);
        },

        error: function (xhr, status, error) {
            if (
                status === "abort" ||
                requestNumber !== detailsRequestNumber
            ) {
                return;
            }
            console.error(
                "Book Details Failure:",
                error
            );

            if (xhr.status === 404) {
                showDetailsError(
                    "Book details were not found."
                );
            } else if (status === "timeout") {
                showDetailsError(
                    "The request timed out."
                );
            } else {
                showDetailsError(
                    error || "Unable to load book details."
                );
            }
        }
    });

    detailsController = {
        abort: function () {
            ajaxRequest.abort();
        }
    };
    }

    // Display book information
    function renderBookDetails(data, workId) {

        const title = data.title || "Untitled Work";

        document.title =
            title + " | Book Search SPA";
        $("#bookTitle").text(title);

        $("#bookWorkId").text(workId);

        let description =
            "No description is available for this book.";

        if (typeof data.description === "string") {
            description = data.description;
        }

        else if (
            data.description &&
            typeof data.description.value === "string"
        ) {
            description = data.description.value;
        }

        $("#bookDescription").text(description);

        if (Array.isArray(data.authors) && data.authors.length > 0) {
            const authorPromises = data.authors.map(function (author) {
                // Get the author's Open Library key
                const authorKey = author.author?.key;
                if (!authorKey) {
                return Promise.resolve("Unknown Author");
                }
                //Author info request
                return $.ajax({
                    url: "https://openlibrary.org" +
                        authorKey + ".json",
                    method: "GET",
                    dataType: "json",
                    timeout: 15000
                })
                .then(function (authorData) {
                    return authorData.name || "Unknown Author";
                })
                .catch(function () {
                    return "Unknown Author";
                });
            });

            Promise.all(authorPromises).then(function (authors) {
                $("#bookAuthors").empty();
                authors.forEach(function (authorName) {
                    $("<p>")
                        .text(authorName)
                        .appendTo("#bookAuthors");
                });
            });
        } else {
            $("#bookAuthors").text("No author information available.");
        }

        // Subjects
        $("#bookSubjects").empty();
        if (Array.isArray(data.subjects) && data.subjects.length > 0) {
            // Only display the first 10 subjects
            const subjects = data.subjects.slice(0, 10);
            subjects.forEach(function (subject) {
                $("<li>")
                .text(subject)
                .appendTo("#bookSubjects");
            });
        } else {

            $("<li>")
                .text("No subjects available.")
                .appendTo("#bookSubjects");
        }

        let coverUrl = fallbackCover;

        if (Array.isArray(data.covers)) {
            const coverId = data.covers.find(function (id) {
                return Number.isInteger(id) && id > 0;
            });

            if (coverId) {
                coverUrl =
                    "https://covers.openlibrary.org/b/id/" +
                    coverId + "-L.jpg";
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

        $("#openLibraryLink").attr(
            "href",
            "https://openlibrary.org/works/" + workId
        );

        $("#detailsStatus").addClass("hidden");

        $("#bookDetailsContainer")
            .removeClass("hidden");
    }
    

    // 7. Featured Books

    async function fetchFeaturedBook(workId) {
        const apiURL =
            "https://openlibrary.org/works/" +
            workId + ".json";

        const data = await $.ajax({

            url: apiURL,

            method: "GET",

            dataType: "json",

            timeout: 15000

        });
        let coverUrl = fallbackCover;

        if (Array.isArray(data.covers)) {
            const coverId = data.covers.find(function (id) {
                return Number.isInteger(id) && id > 0;
            });

            if (coverId) {
                coverUrl =
                    "https://covers.openlibrary.org/b/id/" +
                    coverId + "-M.jpg";
            }
        }

        return {
            id: workId,
            title: data.title || "Untitled Book",
            cover: coverUrl
        };
    }

    // Display a featured book card
    function displayFeaturedBook(book) {
        const card = $("<button>", {
            type: "button",
            class: "featured-book-card"
        });

        const image = $("<img>", {
            src: book.cover,
            alt: "Cover of " + book.title,
            loading: "lazy"
        });

        image.on("error", function () {
            $(this)
                .off("error")
                .attr("src", fallbackCover);
        });

        const title = $("<h3>")
            .text(book.title);
        const caption = $("<p>")
            .text("View Book Details →");
        card.append(image, title, caption);
        card.on("click", function () {
            previousView = "homeView";
            loadBookDetails(book.id);
        });
        $("#featuredGrid").append(card);
    }

    // Load featured collection
    async function loadFeaturedBooks() {
        const results = await Promise.allSettled(
            featuredBookIds.map(function (id) {
                return fetchFeaturedBook(id);
            })
        );

        $("#featuredLoading").addClass("hidden");

        let failedCount = 0;

        results.forEach(function (result) {
            if (result.status === "fulfilled") {
                displayFeaturedBook(result.value);
            }

            else {
                failedCount++;
                console.error(
                    "Featured Book Failure:",
                    result.reason
                );
            }
        });

        if (failedCount > 0) {
            $("#featuredError")
                .text(
                    failedCount +
                    " featured book(s) could not be loaded."
                )
                .removeClass("hidden");
        }

        if ($("#featuredGrid").children().length === 0) {
            $("#featuredError")
                .text(
                    "Featured books could not be loaded. " +
                    "Please check your internet connection."
                )
                .removeClass("hidden");
        }
    }

    // 8. Loading and Error Handling

    function showSearchLoading() {
        $("#resultsGrid").empty();
        $("#paginationControls")
            .addClass("hidden");
        $("#searchStatus")
            .empty()
            .append(
                $("<div>", {
                    class: "loading-spinner"
                }),
                $("<p>").text(
                    "Retrieving books from Open Library..."
                )
            )
            .removeClass("hidden");
    }

    function showSearchError(errorMsg) {
        $("#resultsGrid").empty();
        $("#paginationControls")
            .addClass("hidden");
        $("#searchStatus")
            .empty()
            .append(
                $("<p>")
                    .addClass("error")
                    .text("Unable to retrieve book records."),

                $("<p>").text(errorMsg)
            )
            .removeClass("hidden");
    }

    function showDetailsLoading() {
        $("#detailsStatus")
            .empty()
            .append(
                $("<div>", {
                    class: "loading-spinner"
                }),
                $("<p>").text(
                    "Loading book details..."
                )
            )
            .removeClass("hidden");

    }

    function showDetailsError(errorMsg) {
        $("#bookDetailsContainer")
            .addClass("hidden");
        $("#detailsStatus")
            .empty()
            .append(
                $("<p>")
                    .addClass("error")
                    .text("Unable to load book details."),

                $("<p>").text(errorMsg)
            )
            .removeClass("hidden");
    }

    // 9. Initialization
    loadFeaturedBooks();

});
