$(document).ready(function () {
    // App State Variables
    let currentSearchTerm = "";
    let currentPage = 1;
    let currentLimit = 60;
    let totalResultsFound = 0;

    // Form Submission Handler
    $("#searchForm").on("submit", function (e) {
        e.preventDefault();
        e.stopPropagation();
        console.log("Form submission intercepted");
        newSearch();
        return false;
    });

    function newSearch() {
        // Capture inputs
        currentSearchTerm = $("#searchInput").val().trim();
        currentLimit = parseInt($("#limitSelect").val(), 10 || 60);
        // new search resets back to page 1
        currentPage = 1;

        if (currentSearchTerm) {
            fetchBooks();
        }
    }

    // Pagination 
    $("#prevBtn").on("click", function (e) {
        e.preventDefault();
        if (currentPage > 1) {
            currentPage--;
            fetchBooks();
        }
    });

    $("#nextBtn").on("click", function (e) {
        e.preventDefault();
        if (currentPage * currentLimit < totalResultsFound) {
            currentPage++;
            fetchBooks();
        }
    });

    $("#limitSelect").on("change", function () {
        currentLimit = parseInt($(this).val(), 10);
        if (currentSearchTerm) {
            currentPage = 1; 
            fetchBooks();
        }
    });
    
    // API Fetch from open library
    function fetchBooks() {
        showLoadingState();

        const targetFields = "key,title,author_name,cover_i";
        const searchs = new URLSearchParams({
            q: currentSearchTerm,
            page: currentPage,
            limit:currentLimit,
            fields: targetFields
        });
        const apiURL = "https://openlibrary.org/search.json?" + searchs.toString();
        const controller = new AbortController();
        const timeoutId = setTimeout(function () {
            controller.abort();
        }, 15000);
        fetch(apiURL,{
            method: "GET",
            headers: {
                "Accept": "application/json"
            },
            signal: controller.signal
        })
            .then(function(response) {
                if (!response.ok) {
                    throw new Error(
                        "HTTP network error! Status: " + response.status);
                }
                
                return response.json();
            })
            .then(function (data) {
                totalResultsFound = data.numFound || 0;
                renderResults(data.docs || []);
            })
            .catch(function (error) {
                console.error("Open Library Query Failure:", error);
                if (error.name === "AbortError") {
                    showErrorState("The request timed out." );
                } else {
                    showErrorState(error.message || String(error));
                }
            })
            .finally(function() {
                clearTimeout(timeoutId);
            });
    }
    // View results
    function renderResults(books) {
        const grid = $("#resultsGrid");
        const status = $("#statusMessage");
        
        grid.empty();
        status.addClass("hidden").empty();

        if (!books || books.length === 0) {
            status.text('No books found matching "' + currentSearchTerm + '".').removeClass("hidden");
            $("#paginationControls").addClass("hidden");
            return;
        }

        books.forEach(function (book) {
            const title = book.title || "Unknown Title";
            const author = Array.isArray(book.author_name)
                ? book.author_name.join(", ") 
                : "Unknown Author";
            const safeTitle = escapeHtml(title);
            const safeAuthor = escapeHtml(author);
            
            const openLibraryKey = book.key 
                ? book.key.replace("/works/", "") 
                : "";
            const detailsLink = openLibraryKey
                ? "book-details.html?id=" +
                   encodeURIComponent(openLibraryKey)
                : "#";

            let coverUrl = book.cover_i
                ? "https://covers.openlibrary.org/b/id/" + 
                   encodeURIComponent(book.cover_i) +
                "-M.jpg"
                : "https://placehold.co/300x450?text=No+Cover";

            const cardHtml = `
                <a href="${detailsLink}" class="group bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-1 transition duration-200 flex flex-col h-full">
                    <div class="aspect-[2/3] w-full bg-gray-100 overflow-hidden relative">
                        <img 
                            src="${coverUrl}" 
                            alt="Cover for ${safeTitle}" 
                            class="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                            loading="lazy"
                            onerror="this.onerror=null; this.src='https://placehold.co/300x450?text=No+Cover';"
                        >
                    </div>
                    <div class="p-3 flex flex-col flex-grow justify-between">
                        <h3 class="font-bold text-sm text-gray-900 line-clamp-2 group-hover:text-indigo-600 transition" title="${safeTitle}">
                            ${safeTitle}
                        </h3>
                        <p class="text-xs text-gray-500 truncate mt-1" title="${safeAuthor}">
                            ${safeAuthor}
                        </p>
                    </div>
                </a>
            `;
            grid.append(cardHtml);
        });

        updatePaginationDOM();
    }

    function updatePaginationDOM() {
        const pagination = $("#paginationControls");
        const totalPagesCalculated = Math.ceil(totalResultsFound / currentLimit);

        if (totalPagesCalculated <= 1) {
            pagination.addClass("hidden");
            return;
        }

        pagination.removeClass("hidden");
        $("#pageIndicator").text(`Page ${currentPage} of ${totalPagesCalculated}`);

        $("#prevBtn").prop("disabled", currentPage <= 1);
        $("#nextBtn").prop("disabled", currentPage >= totalPagesCalculated);
    }

    function showLoadingState() {
        $("#resultsGrid").empty();
        $("#paginationControls").addClass("hidden");
        $("#statusMessage")
            .html(`
                <div class="flex flex-col items-center justify-center gap-2">
                    <div class="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <p class="text-sm font-medium text-gray-500">Retrieving catalog records from Open Library...</p>
                </div>
            `)
            .removeClass("hidden");
    }

    function showErrorState(errorMsg) {
        $("#resultsGrid").empty();
        $("#paginationControls").addClass("hidden");
        
        $("#statusMessage")
            .empty()
            .append(
                $("<div>").addClass(
                    "bg-red-50 border border-red-200 rounded-xl " +
                    "p-6 text-center max-w-xl mx-auto"
                ).append(
                    $("<p>")
                        .addClass("text-red-600 font-semibold")
                        .text("Unable to retrieve book records."),
                    $("<p>")
                        .addClass(
                            "text-xs text-red-500 mt-2 font-mono " +
                            "bg-white p-3 border border-red-100 " +
                            "rounded text-left overflow-x-auto"
                        )
                        .text("System Report: " + errorMsg)
                )
            )
            .removeClass("hidden");
    }
    
    function escapeHtml(string) {
        return String(string).replace(/[&<>"']/g, function (s) {
            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            }[s];
        });
    }
});
