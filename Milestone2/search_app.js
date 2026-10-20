$(document).ready(function () {
    // App State Variables
    let currentSearchTerm = "";
    let currentPage = 1;
    let currentLimit = 60;
    let totalResultsFound = 0;

    // Primary Form Submission Handler
    $("#submitSearchBtn").on("click", function (e) {
        e.preventDefault();
        NewSearch();
    });

    $("#searchForm").on("submit", function (e) {
        e.preventDefault();
        NewSearch();
    });

    function NewSearch() {
        // Capture context state inputs
        currentSearchTerm = $("#searchInput").val().trim();
        currentLimit = parseInt($("#limitSelect").val(), 10);
        // new search resets back to page 1
        currentPage = 1;

        if (currentSearchTerm) {
            fetchBooks();
        }
    }

    // Pagination Click Bindings
    $("#prevBtn").on("click", function () {
        if (currentPage > 1) {
            currentPage--;
            fetchBooks();
        }
    });

    $("#nextBtn").on("click", function () {
        if (currentPage * currentLimit < totalResultsFound) {
            currentPage++;
            fetchBooks();
        }
    });

    // Dropdown Filter Mutation Handler
    $("#limitSelect").on("change", function () {
        currentLimit = parseInt($(this).val(), 10);
        if (currentSearchTerm) {
            currentPage = 1; 
            fetchBooks();
        }
    });
    
    // Core API Fetch Operations
    function fetchBooks() {
        showLoadingState();

        const encodedQuery = encodeURIComponent(currentSearchTerm);

        const targetFields = "key,title,author_name,cover_i";
        const apiURL = "https://openlibrary.org" + encodedQuery + "&page=" + currentPage + "&limit=" + currentLimit + "&fields=" + targetFields;
        fetch(apiURL,{
            method: "GET",
            headers: {
                "Accept": "application/json"
                "User-Agent": "BookFinderSPA/1.0 (educational project)"
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error("HTTP network error! Status: " + response.status);
            }
            return response.json();
        })
        .then(data => {
            totalResultsFound = data.numFound || 0;
            renderResults(data.docs || []);
        })
        .catch(error => {
            console.error("Open Library Query Failure:", error);
            const mockXhr = {status: "Network/Fetch Error" };
            showErrorState(mockXhr, "error", error.message || error);
        });
    }
    // View Rendered results
    function renderResults(books) {
        const grid = $("#resultsGrid");
        const status = $("#statusMessage");
        
        grid.empty();
        status.addClass("hidden").empty();

        if (!books || books.length === 0) {
            status.html(`<p class="text-gray-500 font-medium">No book instances found matching "${escapeHtml(currentSearchTerm)}".</p>`).removeClass("hidden");
            $("#paginationControls").addClass("hidden");
            return;
        }

        books.forEach(function (book) {
            const title = book.title ? escapeHtml(book.title) : "Unknown Title";
            const author = book.author_name ? escapeHtml(book.author_name.join(", ")) : "Unknown Author";
            
            const openLibraryKey = book.key ? book.key.replace("/works/", "") : "";
            const detailsLink = `book-details.html?id=${openLibraryKey}`;

            let coverUrl = "https://placehold.co";
            if (book.cover_i) {
                coverUrl = "https://covers.openlibrary.org/b/id/" + book.cover_i + "-M.jpg";
            }

            const cardHtml = `
                <a href="${detailsLink}" class="group bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-1 transition duration-200 flex flex-col h-full">
                    <div class="aspect-[2/3] w-full bg-gray-100 overflow-hidden relative">
                        <img 
                            src="${coverUrl}" 
                            alt="Cover for ${title}" 
                            class="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                            loading="lazy"
                        >
                    </div>
                    <div class="p-3 flex flex-col flex-grow justify-between">
                        <h3 class="font-bold text-sm text-gray-900 line-clamp-2 group-hover:text-indigo-600 transition" title="${title}">
                            ${title}
                        </h3>
                        <p class="text-xs text-gray-500 truncate mt-1" title="${author}">
                            ${author}
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
        $("#pageIndicator").text("Page" + currentPage + " of " + totalPagesCalculated);

        $("#prevBtn").prop("disabled", currentPage === 1);
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
            .html(`
                <div class="bg-red-50 border border-red-200 rounded-xl p-6 text-center max-w-xl mx-auto">
                    <p class="text-red-600 font-semibold">An error occurred trying to parse library records.</p>
                    <p class="text-xs text-red-500 mt-2 font-mono bg-white p-3 border border-red-100 rounded text-left overflow-x-auto">System Report: ${escapeHtml(errorMsg)}</p>
                </div>
            `)
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
