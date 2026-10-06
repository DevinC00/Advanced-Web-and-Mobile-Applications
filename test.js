$(document).ready(function() {
        //  Section 1: SPA Navigation 
        $('.spa-nav button').click(function() {
        $('.spa-nav button').removeClass('active');
        $(this).addClass('active');
        let targetView = $(this).data('target');
        $('.spa-view').removeClass('active');
        $('#' + targetView).addClass('active');
    });

    // Section 2: Single Book
    $.getJSON('openlibrary-book.json', function(book) {
        let firstSentence = book.first_sentence ? book.first_sentence.value : "";
        let firstSentenceHtml = firstSentence ? `<p class="first-sentence">"${firstSentence}"</p>` : '';
        let coverId = (book.covers && book.covers.length > 0) ? book.covers[0] : "-1;";
        let coverUrl = coverId > 0 ? `https://covers.openlibrary.org/b/isbn/${book.isbn_10}-L.jpg` : 'https://placehold.co';
        let openLibraryUrl = `https://openlibrary.org${book.key}`;
        let isbn10 = (book.isbn_10);
        let isbn13 = (book.isbn_13);
        let authorKey = (book.authors[0].key);
        const authorApiUrl = `https://openlibrary.org${authorKey}.json`;

        // Nested API call to fetch author details using the authorKey
        $.getJSON(authorApiUrl, function(authorData) {
            let authorName = authorData.name || authorKey;

            let bookHTML = `
                <div class="book-card">
                    <img class="book-cover" src="${coverUrl}" alt="${book.title} Cover">
                    <div class="book-details">
                        <h2>${book.title}</h2>
                        <p class="author-name" style="font-size: 1.2rem; color: #555; margin: 5px 0 0 0;">by ${authorName}</p>
                        <p class="edition-tag" style="margin-top: 10px;">Featured Single Book</p>
                        ${firstSentenceHtml}
                        <ul class="meta-list">
                            <li><strong>Author Reference:</strong> ${authorName}</li>
                            <li><strong>Publisher:</strong> ${book.publishers ? book.publishers.join(', ') : 'N/A'}</li>
                            <li><strong>Publish Date:</strong> ${book.publish_date || 'N/A'}</li>
                            <li><strong>Page Count:</strong> ${book.number_of_pages || 'N/A'} pages</li>
                            <li><strong>ISBN-10:</strong> ${isbn10}</li>
                            <li><strong>ISBN-13:</strong> ${isbn13}</li>
                            <li><strong>Contributions:</strong> ${book.contributions ? book.contributions.join(', ') : 'None'}</li>
                        </ul>
                        <a href="${openLibraryUrl}" target="_blank" class="ol-link">View Full Record on Open Library →</a>
                    </div>
                </div>
            `;
            $('#single-book-view').html(bookHTML);
        }).fail(function(jqXHR, textStatus, errorThrown) {
            console.error("Error loading author details from Open Library:", textStatus, errorThrown);
            // Fallback render
            renderBookWithFallback(book, coverUrl, openLibraryUrl, firstSentenceHtml, isbn10, isbn13, authorKey);
        });

    }).fail(function(jqXHR, textStatus, errorThrown) {
        console.error("Error loading openlibrary-book.json:", textStatus, errorThrown);
        $('#single-book-view').html('<p style="color:red;">Error loading openlibrary-book.json.</p>');
    });
    // Section 3: Search Results
    $.getJSON('openlibrary-search.json', function(response) {
        $('#results-count').text(`Found ${response.numFound || 0} matching books in database`);
        let searchResultsHtml = '';
        $.each(response.docs, function(index, book) {
            //Fallback cover
            let coverUrl = 'https://placehold.co';
            // Conditions to find cover
            if (book.cover_i) {
                coverUrl = `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`;
            } else if (book.cover_edition_key) {
                coverUrl = `https://covers.openlibrary.org/b/olid/${book.cover_edition_key}-M.jpg`;
            }
            let openLibraryUrl = `https://openlibrary.org${book.key}`;
            searchResultsHtml += `
                <div class="search-item">
                    <img class="search-cover" src="${coverUrl}" alt="${book.title} Cover">
                    <div class="search-details">
                        <h3>${book.title} ${book.subtitle ? `<span class="subtitle">: ${book.subtitle}</span>` : ''}</h3>
                        <p class="author-name">by ${book.author_name ? book.author_name.join(', ') : 'Unknown Author'}</p>
                        <div class="search-meta">
                            <span><strong>First Published:</strong> ${book.first_publish_year || 'N/A'}</span> • <span><strong>Editions:</strong> ${book.edition_count}</span>
                        </div>
                        <a href="${openLibraryUrl}" target="_blank">View Work Profile</a>
                    </div>
                </div>
            `;
        });
        $('#search-results-list').html(searchResultsHtml);
    }).fail(function(jqXHR, textStatus, errorThrown) {
        console.error("Error loading openlibrary-search.json:", textStatus, errorThrown);
        $('#search-results-list').html('<p style="color:red;">Error loading openlibrary-search.json.</p>');
    });
});
