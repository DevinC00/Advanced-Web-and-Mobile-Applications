$(document).ready(function () {
    // Extract search
    const urlParams = new URLSearchParams(window.location.search);
    const workId = urlParams.get("id");

    if (!workId) {
        showErrorState("No valid book identifier found in the URL. Please return to the homepage.");
    } else {
        fetchBookDetails(workId);
    }

    // Core API AJAX Operations
    function fetchBookDetails(id) {
        showLoadingState();

        const apiURL = "https://openlibrary.org" + id + ".json";

        fetch(apiURL, {
            method: "GET",
            headers: {
                "Accept": "application/json",
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error("The requested book details record could not be located on the server.");
            }
            return response.json();
        })
        .then(data => {
            renderBookDetails(data, id);
        })
        .catch(error => {
            console.error("Details API Execution Failure:", error);
            showErrorState(error.message || error);
        });
    }

    // Book Information
    function renderBookDetails(data, id) {
        $("#statusMessage").addClass("hidden");
        $("#bookDetailsContainer").removeClass("hidden");

        // 1. Book Title
        const title = data.title ? escapeHtml(data.title) : "Untitled Work";
        $("#bookTitle").text(title);
        document.title = title + " | Book Details"; // Sync browser tab title label

        // 2. Work ID Component
        $("#bookWorkId").text(id);

        // 3. Description
        let description = "No description profile recorded for this volume.";
        if (data.description) {
            if (typeof data.description === "string") {
                description = data.description;
            } else if (data.description.value) {
                description = data.description.value;
            }
        }
        $("#bookDescription").text(description);

        // 4. Cover Image 
        let coverUrl = "https://placehold.co";
        if (data.covers && data.covers.length > 0) {
            const coreCoverId = data.covers[0];
            if (coreCoverId && coreCoverId > 0) {
                coverUrl = "https://openlibrary.org" + coreCoverId + "-L.jpg";
            }
        }
        $("#bookCover").attr("src", coverUrl).attr("alt", "Cover for " + title);

        // 5. open library link
        const externalOlUrl = "https://openlibrary.org" + id;
        $("#openLibraryLink").attr("href", externalOlUrl);
    }

    function showLoadingState() {
        $("#bookDetailsContainer").addClass("hidden");
        $("#statusMessage")
            .html(`
                <div class="flex flex-col items-center justify-center gap-3 py-12">
                    <div class="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <p class="text-base font-medium text-gray-500">Compiling library item profile details...</p>
                </div>
            `)
            .removeClass("hidden");
    }

    function showErrorState(errorMsg) {
        $("#bookDetailsContainer").addClass("hidden");
        $("#statusMessage")
            .html(`
                <div class="bg-red-50 border border-red-200 rounded-xl p-6 text-center max-w-xl mx-auto shadow-sm">
                    <p class="text-red-600 font-bold text-lg mb-1">⚠️ Error Processing View</p>
                    <p class="text-sm text-red-500 font-mono bg-white p-3 border border-red-100 rounded text-left overflow-x-auto mt-2">${escapeHtml(errorMsg)}</p>
                    <a href="index.html" class="inline-block mt-4 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition">← Return to Main Finder</a>
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