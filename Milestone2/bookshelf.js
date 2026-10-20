document.addEventListener("DOMContentLoaded", function () {

    // 1. Stores Open Library work IDs in an array
    const bookIds = [
        "OL82563W",   // Harry Potter and the Philosopher's Stone
        "OL893414W",  // Dune
        "OL2679341W"  // The Magicians
    ];

    const bookshelf = document.getElementById("bookshelf");
    const loadingMessage = document.getElementById("loadingMessage");
    const errorMessage = document.getElementById("errorMessage");

    const fallbackCover =
        "https://placehold.co/400x600?text=No+Cover";

    // 2. Fetch one book's information from Open Library
    async function fetchBook(bookId) {
        const apiUrl =
            `https://openlibrary.org/works/${bookId}.json`;

        const response = await fetch(apiUrl, {
            headers: {
                Accept: "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(`Could not load book ${bookId}`);
        }

        const data = await response.json();

        // Get the first valid cover ID
        const coverId = Array.isArray(data.covers)
            ? data.covers.find(
                id => Number.isInteger(id) && id > 0
            )
            : null;

        const coverUrl = coverId
            ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`
            : fallbackCover;

        return {
            id: bookId,
            title: data.title || "Untitled Book",
            cover: coverUrl
        };
    }

    // 3. Create a bookshelf card
    function displayBook(book) {
        const card = document.createElement("article");

        card.className =
            "bg-white rounded-xl shadow-md overflow-hidden " +
            "hover:shadow-xl transition duration-300";

        const link = document.createElement("a");
        link.href =
            `https://openlibrary.org/works/${book.id}`;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.className = "block";

        const imageContainer = document.createElement("div");
        imageContainer.className =
            "h-80 bg-gray-200 flex items-center justify-center p-4";

        const image = document.createElement("img");
        image.src = book.cover;
        image.alt = `Cover of ${book.title}`;
        image.loading = "lazy";
        image.className =
            "h-full max-w-full object-contain rounded shadow";

        image.onerror = function () {
            image.onerror = null;
            image.src = fallbackCover;
        };

        const details = document.createElement("div");
        details.className = "p-5";

        const title = document.createElement("h3");
        title.className =
            "text-xl font-bold text-gray-900 text-center";
        title.textContent = book.title;

        const caption = document.createElement("p");
        caption.className =
            "text-sm text-indigo-600 text-center mt-3";
        caption.textContent = "View on Open Library →";

        imageContainer.appendChild(image);
        details.appendChild(title);
        details.appendChild(caption);

        link.appendChild(imageContainer);
        link.appendChild(details);
        card.appendChild(link);

        bookshelf.appendChild(card);
    }

    // 4. Fetch all books and display them
    async function loadBookshelf() {
        const results = await Promise.allSettled(
            bookIds.map(id => fetchBook(id))
        );

        loadingMessage.classList.add("hidden");

        let failedCount = 0;

        results.forEach(result => {
            if (result.status === "fulfilled") {
                displayBook(result.value);
            } else {
                failedCount++;
                console.error(
                    "Failed to load a book:",
                    result.reason
                );
            }
        });

        if (failedCount > 0) {
            errorMessage.textContent =
                `${failedCount} book(s) could not be loaded. ` +
                "Please refresh the page and try again.";

            errorMessage.classList.remove("hidden");
        }

        if (bookshelf.children.length === 0) {
            errorMessage.textContent =
                "Your bookshelf could not be loaded. " +
                "Check your internet connection and try again.";

            errorMessage.classList.remove("hidden");
        }
    }

    loadBookshelf();

});