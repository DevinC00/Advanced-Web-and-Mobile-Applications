$(document).ready(function () {
    if (typeof Mustache === "undefined") {
        console.error("Mustache.js failed to load!");
        return;
    }
    // Updated, combined, and organized JavaScript code for Milestone 3 Book Search SPA

    // 1. Application State

    let currentSearchTerm = "";
    let currentPage = 1;
    let currentLimit = 10;
    let totalResultsFound = 0;
    let previousView = "homeSection";
    let searchController = null;
    let detailsController = null;
    let searchRequestNumber = 0;
    let detailsRequestNumber = 0;
    let currentBookView = "grid";
    let selectedQuickViewWorkId = null;
    let quickViewPreviousView = "homeSection";
    let quickViewRequestNumber = 0;

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

    function updateBookView() {

        $(".book-grid").removeClass("list-view");

        if (currentBookView === "list") {
            $(".book-grid").addClass("list-view");
        }

        $(".view-toggle").each(function () {

            const isActive =
                $(this).data("view") === currentBookView;

            $(this)
                .toggleClass("active", isActive)
                .attr("aria-pressed", isActive);

        });
    }

    // Handle Grid/List button clicks
    $(".view-toggle").on("click", function () {

        currentBookView = $(this).data("view");

        updateBookView();

    });

    // 2. Navigation

    function showView(viewId) {
        $("#homeSection, #searchView, #detailsView")
            .addClass("hidden");
        $("#" + viewId).removeClass("hidden");
    }

    $("#homeNavBtn").on("click", function () {
        showView("homeSection");
    });

    $("#searchNavBtn").on("click", function () {
        showView("searchSection");
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
        const template = $("#searchBookTemplate").html();
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
            if (!workId) {
                return;
            }
            const renderedHTML = Mustache.render(template, {
                workId: workId,
                title: title,
                author: author,
                coverUrl: coverUrl
            });
            const card = $(renderedHTML);
            card.on("click", function () {
                loadQuickView(workId, "searchView");
            });
            card.find("img").on("error", function () {
                $(this).attr("src", fallbackCover);
            });
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

    function loadQuickView(workId, sourceView) {
        if (!/^OL\d+W$/.test(workId)) {
            return;
        }

        selectedQuickViewWorkId = String(workId).trim().toUpperCase();
        quickViewPreviousView = sourceView;
        const requestNumber = ++quickViewRequestNumber;
        $("#quickViewMode").data("work-id", selectedQuickViewWorkId);
        $("#quickViewMode").removeClass("hidden");
        $("#quickViewTitle").text("Loading Book...");
        $("#quickViewAuthors").text("Loading Authors...");
        $("#quickViewDescription").text("Loading Description...");

        $("#quickViewCover")
            .attr("src", fallbackCover)
            .attr("alt", "Loading cover...");
        
        $.ajax({
            url: "https://openlibrary.org/works/" +
                workId + ".json",
            method: "GET",
            dataType: "json",
            timeout: 15000,
            success: function (data) {
                if (requestNumber !== quickViewRequestNumber) {
                    return;
                }
                const title = data.title || "Untitled Work";
                $("#quickViewTitle").text(title);
                let description = "No description is available for this book.";
                if (typeof data.description === "string") {
                    description = data.description;
                } else if (
                    data.description &&
                    typeof data.description.value === "string"
                ) {
                    description = data.description.value;
                }
                $("#quickViewDescription").text(description);

                if (Array.isArray(data.covers)) {
                    const coverId = data.covers.find(function (id) {
                        return Number.isInteger(id) && id > 0;
                    });

                    if (coverId) {
                        $("#quickViewCover")
                            .attr("src", "https://covers.openlibrary.org/b/id/" + coverId + "-M.jpg")
                            .attr("alt", "Book cover");
                    }
                }

                if (Array.isArray(data.authors) && data.authors.length > 0) {
                    const authorPromises = data.authors.map(function (author) {
                        const authorKey = author.author?.key;
                        if (!authorKey) {
                            return Promise.resolve("Unknown Author");
                        }
                        return $.ajax({
                            url: "https://openlibrary.org" + authorKey + ".json",
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

                    Promise.all(authorPromises)
                        .then(function (authors) {
                            if (requestNumber !== quickViewRequestNumber) {
                                return;
                            }
                            $("#quickViewAuthors").text("By: " + authors.join(", "));
                        })
                        .catch(function () {
                            $("#quickViewAuthors").text("Error loading author information.");
                    });
                } else {
                    $("#quickViewAuthors").text("No author information available.");
                }
            },
            error: function () {
                if (requestNumber !== quickViewRequestNumber) {
                    return;
                }
                $("#quickViewAuthors").text("Error loading book details.");
                $("#quickViewAuthors").text("");
                $("#quickViewDescription").text("Please try selecting this book again.");
            }
        });
    }

    function closeQuickView() {
        quickViewRequestNumber++;
        $("#quickViewMode").addClass("hidden");
        selectedQuickViewWorkId = null;
    }
    $("#closeQuickView").on("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        closeQuickView();
    });

    $("#quickViewMode").on("click", function (e) {
        if (e.target.id === this) {
            closeQuickView();
        }
    });

    $(document).on("keydown", function (e) {
        if (e.key === "Escape" && !$("#quickViewMode").hasClass("hidden")) {
            closeQuickView();
        }
    });

    $(document).on("click", "#fullDetailsBtn", function (e) {
        e.preventDefault();
        e.stopPropagation();
        console.log("Full Details button clicked!");
        const workId = $("#quickViewMode").data("work-id");
        console.log("Selected Book ID:", workId);
        if (!workId) {
            console.error("No book ID stored in Quick View!");
            return;
        }
        previousView = quickViewPreviousView;
        closeQuickView();
        loadBookDetails(workId);
    });


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
        workId = String(workId || "").trim().toUpperCase();
        console.log("ID received by loadBookDetails:", workId);
        console.log("Raw Work ID:", workId);
        console.log("Work ID Type:", typeof workId);
        console.log("Work ID Length:", workId ? workId.length : 0);
        console.log("Regex Test:", /^OL\d+W$/i.test(String(workId).trim()));

        if (!workId || !/^OL\d+W$/.test(workId)) {
            console.error("Invalid Work ID:", workId);
            showView("detailsView");
            showDetailsError("Invalid book ID.");
            return;
        }

        showView("detailsView");

        $("#bookDetailsContainer").addClass("hidden");

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
        const subjects = Array.isArray(data.subjects)
            ? data.subjects.slice(0, 10)
            : [];

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
        const template = $("#bookDetailsTemplate").html();

        function renderDetails(authors) {

            const bookData = {
                title: title,
                workId: workId,
                authors: authors,
                subjects: subjects,
                description: description,
                coverUrl: coverUrl,
                libraryUrl:
                    "https://openlibrary.org/works/" + workId
            };

            $("#bookDetailsContainer").html(
                Mustache.render(template, bookData)
            );

            $("#bookDetailsContainer")
                .removeClass("hidden");

            $("#detailsStatus").addClass("hidden");

            document.title = title + " | Book Search SPA";

            $("#bookDetailsContainer img").on("error", function () {
                $(this).attr("src", fallbackCover);
            });
        }
        if (Array.isArray(data.authors) && data.authors.length > 0) {
            const authorPromises = data.authors.map(function (author) {
                const authorKey = author.author?.key;
                if (!authorKey) {
                    return Promise.resolve("Unknown Author");
                }
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
                renderDetails(authors);
            });
        } else {
            renderDetails([]);
        }
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
        const template = $("#featuredBookTemplate").html();
        const renderedHTML = Mustache.render(template, {
            workId: book.id,
            title: book.title,
            coverUrl: book.cover
        });
        const card = $(renderedHTML);
        card.on("click", function () {
            loadQuickView(book.id, "homeSection");
        });
        card.find("img").on("error", function () {
            $(this).attr("src", fallbackCover);
        });
        $("#featuredGrid").append(card);
    }

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
            } else {
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
    updateBookView();
    loadFeaturedBooks();

});
