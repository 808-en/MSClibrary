const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQaTqPVndPccN9h1-RYUulv59x-Ursqed9lsoDnMfejpp8VoI1DjYFh2Cq5Xr-471I8RcKX7vJ2yJgj/pub?output=csv';
const TOKEN_VALUE = "loggedInIdentifierRNBN480H39A=";
let shouldNavigate = false;

document.addEventListener('DOMContentLoaded', function() {
    setupModalHandlers();
    
    const btnProminentBorrow = document.getElementById('btnProminentBorrow');
    const btnProminentReturn = document.getElementById('btnProminentReturn');
    const openBorrowNav = document.getElementById('openBorrowForm');
    const openReturnNav = document.getElementById('openReturnForm');
    
    if (btnProminentBorrow) btnProminentBorrow.addEventListener('click', (e) => { e.preventDefault(); openModal('borrowChoiceModal'); });
    if (btnProminentReturn) btnProminentReturn.addEventListener('click', (e) => { e.preventDefault(); openModal('returnChoiceModal'); });
    if (openBorrowNav) openBorrowNav.addEventListener('click', (e) => { e.preventDefault(); openModal('borrowChoiceModal'); });
    if (openReturnNav) openReturnNav.addEventListener('click', (e) => { e.preventDefault(); openModal('returnChoiceModal'); });

    setupFormSubmission('borrowIsbnForm', 'Borrow', () => ({
        isbn: document.getElementById('borrowIsbnInput').value,
        title: document.getElementById('borrowAutoTitle').value,
        author: document.getElementById('borrowAutoAuthor').value,
        nameAndRoom: document.getElementById('borrowNameRoom').value,
        signature: document.getElementById('borrowSignature').value
    }), 'borrowIsbnModal');

    setupFormSubmission('returnIsbnForm', 'Return', () => ({
        isbn: document.getElementById('returnIsbnInput').value,
        title: document.getElementById('returnAutoTitle').value,
        author: document.getElementById('returnAutoAuthor').value,
        nameAndRoom: document.getElementById('returnName').value,
        signature: ''
    }), 'returnIsbnModal');

    setupFormSubmission('borrowManualForm', 'Borrow', () => ({
        isbn: 'Manual',
        title: document.getElementById('borrowManualTitle').value,
        author: document.getElementById('borrowManualAuthor').value,
        nameAndRoom: document.getElementById('borrowManualNameRoom').value,
        signature: document.getElementById('borrowManualSignature').value
    }), 'borrowManualModal');

    setupFormSubmission('returnManualForm', 'Return', () => ({
        isbn: 'Manual',
        title: document.getElementById('returnManualTitle').value,
        author: document.getElementById('returnManualAuthor').value,
        nameAndRoom: document.getElementById('returnManualName').value,
        signature: ''
    }), 'returnManualModal');

    setupIsbnLookup('borrowLookupBtn', 'borrowIsbnInput', 'borrowAutoTitle', 'borrowAutoAuthor');
    setupIsbnLookup('returnLookupBtn', 'returnIsbnInput', 'returnAutoTitle', 'returnAutoAuthor');
    setupScanner('startBorrowScanner', 'borrowReader', 'borrowIsbnInput');
    setupScanner('startReturnScanner', 'returnReader', 'returnIsbnInput');

    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });

    const dataContainer = document.getElementById('data-container');
    if (dataContainer) {
        loggedincheck();
        fetchData(dataContainer);
    }
});

function setupFormSubmission(formId, type, dataExtractor, modalId) {
    const form = document.getElementById(formId);
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const extracted = dataExtractor();
            const data = {
                type: type,
                timestamp: new Date().getTime(),
                ...extracted
            };
            submitToGoogleSheet(data);
            form.reset();
            closeModal(modalId);
        });
    }
}

async function lookupIsbn(isbn, titleInputId, authorInputId) {
    if (!isbn) return;
    try {
        const response = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`);
        const data = await response.json();
        const book = data[`ISBN:${isbn}`];
        if (book) {
            document.getElementById(titleInputId).value = book.title || '';
            document.getElementById(authorInputId).value = book.authors ? book.authors.map(a => a.name).join(', ') : '';
        } else {
            alert("Book details not found automatically. You can proceed with just the ISBN or use Manual Input.");
        }
    } catch (error) {
        console.error(error);
        alert("Error retrieving book information.");
    }
}

function setupIsbnLookup(btnId, isbnInputId, titleInputId, authorInputId) {
    const btn = document.getElementById(btnId);
    if (btn) {
        btn.addEventListener('click', () => {
            const isbn = document.getElementById(isbnInputId).value.trim();
            lookupIsbn(isbn, titleInputId, authorInputId);
        });
    }
}

function setupScanner(btnId, readerId, inputId) {
    const btn = document.getElementById(btnId);
    if (btn && typeof Html5QrcodeScanner !== 'undefined') {
        btn.addEventListener('click', () => {
            const readerDiv = document.getElementById(readerId);
            readerDiv.style.display = 'block';
            const scanner = new Html5QrcodeScanner(readerId, { fps: 10, qrbox: 250 });
            scanner.render((decodedText) => {
                document.getElementById(inputId).value = decodedText;
                scanner.clear();
                readerDiv.style.display = 'none';
            }, (error) => {});
        });
    }
}

function submitToGoogleSheet(data) {
    const scriptUrl = 'https://script.google.com/macros/s/AKfycbyvHlxSf3NoF8MBZQYiHvJrBmBhYVE6V_GcGhr8iSK6AeKs5SISoUN_Ho4owsjjV0_5Fw/exec';
    
    fetch(scriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(() => {
        alert("Request successfully recorded!");
    }).catch(error => {
        console.error('Error!', error.message);
        alert("There was an error saving your request.");
    });
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

function setupModalHandlers() {
    const openAdd = document.getElementById('openAddBookModal');
    const openDel = document.getElementById('openDeleteBookModal');
    const openUpd = document.getElementById('openUpdateBotmModal');

    if(openAdd) openAdd.addEventListener('click', () => openModal('addBookModal'));
    if(openDel) openDel.addEventListener('click', () => { openModal('deleteBookModal'); fetchDeleteChartData(); });
    if(openUpd) openUpd.addEventListener('click', () => openModal('updateBotmModal'));
}

function loggedincheck() {
    const token = localStorage.getItem("loggedInState");
    const expiry = Number(localStorage.getItem("loggedInExpiry"));
    const isValid = token === TOKEN_VALUE && Number.isFinite(expiry) && Date.now() <= expiry;

    if (!isValid) {
        localStorage.removeItem("loggedInState");
        localStorage.removeItem("loggedInExpiry");
        window.location.href = "login.html";
        return;
    }
}

function logout() {
    localStorage.removeItem("loggedInState");
    localStorage.removeItem("loggedInExpiry");
    window.location.href = "index.html";
}

async function fetchData(container) {
    try {
        const response = await fetch(sheetUrl);
        if (!response.ok) throw new Error('Network response was not ok');

        const textData = await response.text();
        const rows = textData.split('\n').map(row => row.split(','));

        let maxCols = 0;
        rows.forEach(row => { if(row.length > maxCols) maxCols = row.length; });

        let tableHtml = '<table><thead><tr>';
        for (let i = 0; i < maxCols; i++) {
            tableHtml += `<th>${rows[0][i] || `Col ${i+1}`}</th>`;
        }
        tableHtml += '</tr></thead><tbody>';

        rows.slice(1).forEach(rowData => {
            const statusIndex = 5; 
            const isReturned = rowData[statusIndex] && rowData[statusIndex].trim() === 'RETURNED';
            const rowStyle = isReturned ? 'text-decoration: line-through; color: #666;' : '';

            tableHtml += `<tr style="${rowStyle}">`;
            
            for (let i = 0; i < maxCols; i++) {
                const cell = rowData[i] || '';
                if (i === statusIndex && isReturned) {
                    tableHtml += `<td style="color: blue; font-weight: bold; font-size: 1.2em; text-decoration: none;">${cell}</td>`;
                } else if (i === statusIndex && cell.trim() === 'BORROWED') {
                    tableHtml += `<td style="color: green; font-weight: bold;">${cell}</td>`;
                } else {
                    tableHtml += `<td>${cell}</td>`; 
                }
            }
            tableHtml += '</tr>';
        });
        tableHtml += '</tbody></table>';

        container.innerHTML = tableHtml;
    } catch (error) {
        console.error('Error fetching data:', error);
        container.innerHTML = '<p>Could not load data.</p>';
    }
}

function alertRec() {
    document.getElementById('alertTitle').textContent = 'Before You Proceed';
    document.getElementById('alertMessage').textContent = 'Before you proceed, remember, reading a physical book is more supplemental than online reading. Do not spend too much time on a screen. We are working on a suggestions update, so that you can suggest online books to be purchased and available in the library. Have fun reading! <3';

    const alertBox = document.getElementById('customAlertBox');
    const overlay = document.getElementById('overlay');
    const okButton = document.getElementById('okButton');
    const closeButton = document.getElementById('closeButton');
    const getBookButton = document.getElementById('getBookButton');
    const onlineBooksLink = document.querySelector('.online-books-button a');

    shouldNavigate = false;

    if(alertBox && overlay) {
        alertBox.style.display = 'block';
        overlay.style.display = 'block';
    }

    if(okButton) okButton.onclick = function() {
        shouldNavigate = true;
        alertBox.style.display = 'none';
        overlay.style.display = 'none';
        if(onlineBooksLink) onlineBooksLink.click();
        window.location.href="onlineBooks.html";
    };

    if(closeButton) closeButton.onclick = function() {
        alertBox.style.display = 'none';
        overlay.style.display = 'none';
    };

    if(getBookButton) getBookButton.onclick = function() {
        window.location.href = 'library.html';
    };

    return false;
}
