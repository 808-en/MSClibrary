const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQaTqPVndPccN9h1-RYUulv59x-Ursqed9lsoDnMfejpp8VoI1DjYFh2Cq5Xr-471I8RcKX7vJ2yJgj/pub?output=csv';
const TOKEN_VALUE = "loggedInIdentifierRNBN480H39A=";
let shouldNavigate = false;
let _sessionInterval = null;

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
        name: document.getElementById('borrowName').value,
        roomNumber: document.getElementById('borrowRoom').value,
        signature: document.getElementById('borrowSignature').value
    }), 'borrowIsbnModal');

    setupFormSubmission('returnIsbnForm', 'Return', () => {
        const returnMethodElement = document.querySelector('input[name="returnMethodIsbn"]:checked');
        return {
            requestId: document.getElementById('returnRequestId').value,
            isbn: document.getElementById('returnIsbnInput').value,
            title: document.getElementById('returnAutoTitle').value,
            author: document.getElementById('returnAutoAuthor').value,
            name: document.getElementById('returnName').value,
            roomNumber: document.getElementById('returnRoom').value,
            signature: '',
            returnMethod: returnMethodElement ? returnMethodElement.value : ''
        };
    }, 'returnIsbnModal');

    setupFormSubmission('borrowManualForm', 'Borrow', () => ({
        isbn: 'Manual',
        title: document.getElementById('borrowManualTitle').value,
        author: document.getElementById('borrowManualAuthor').value,
        name: document.getElementById('borrowManualName').value,
        roomNumber: document.getElementById('borrowManualRoom').value,
        signature: document.getElementById('borrowManualSignature').value
    }), 'borrowManualModal');

    setupFormSubmission('returnManualForm', 'Return', () => {
        const returnMethodElement = document.querySelector('input[name="returnMethodManual"]:checked');
        return {
            requestId: document.getElementById('returnManualRequestId').value,
            isbn: 'Manual',
            title: document.getElementById('returnManualTitle').value,
            author: document.getElementById('returnManualAuthor').value,
            name: document.getElementById('returnManualName').value,
            roomNumber: document.getElementById('returnManualRoom').value,
            signature: '',
            returnMethod: returnMethodElement ? returnMethodElement.value : ''
        };
    }, 'returnManualModal');

    setupIsbnLookup('borrowLookupBtn', 'borrowIsbnInput', 'borrowAutoTitle', 'borrowAutoAuthor');
    setupIsbnLookup('returnLookupBtn', 'returnIsbnInput', 'returnAutoTitle', 'returnAutoAuthor');
    setupIsbnLookup('botmLookupBtn', 'botmIsbnInput', 'botmTitle', 'botmAuthor');

    const borrowIsbnInput = document.getElementById('borrowIsbnInput');
    if (borrowIsbnInput) {
        borrowIsbnInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                document.getElementById('borrowLookupBtn').click();
            }
        });
    }

    const returnIsbnInput = document.getElementById('returnIsbnInput');
    if (returnIsbnInput) {
        returnIsbnInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                document.getElementById('returnLookupBtn').click();
            }
        });
    }

    const botmIsbnInput = document.getElementById('botmIsbnInput');
    if (botmIsbnInput) {
        botmIsbnInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                document.getElementById('botmLookupBtn').click();
            }
        });
    }

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

    const botmForm = document.getElementById('botmForm');
    if (botmForm) {
        botmForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const data = {
                sheetTarget: "Book of the Month",
                month: document.getElementById('botmMonth').value,
                title: document.getElementById('botmTitle').value,
                author: document.getElementById('botmAuthor').value
            };
            submitAdminData(data, 'updateBotmModal', botmForm);
        });
    }

    const changelogForm = document.getElementById('changelogForm');
    if (changelogForm) {
        changelogForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const data = {
                sheetTarget: "Changelog",
                timestamp: new Date().getTime(),
                version: document.getElementById('changelogVersion').value,
                updateMessage: document.getElementById('changelogMessage').value
            };
            submitAdminData(data, 'updateLatestModal', changelogForm);
        });
    }

    // start session countdown if the element exists
    const countdownEl = document.getElementById('sessionCountdown');
    if (countdownEl) {
        startSessionCountdown('sessionCountdown');
    }
});

function setupFormSubmission(formId, type, dataExtractor, modalId) {
    const form = document.getElementById(formId);
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const extracted = dataExtractor();
            const reqId = type === 'Borrow' ? 'REQ-' + Math.random().toString(36).substr(2, 9).toUpperCase() : extracted.requestId;
            const data = {
                requestID: reqId,
                type: type,
                timestamp: new Date().getTime(),
                ...extracted
            };
            submitToGoogleSheet(data, type === 'Borrow' ? reqId : null);
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

function submitToGoogleSheet(data, generatedId) {
    const scriptUrl = 'https://script.google.com/macros/s/AKfycbyvHlxSf3NoF8MBZQYiHvJrBmBhYVE6V_GcGhr8iSK6AeKs5SISoUN_Ho4owsjjV0_5Fw/exec';
    
    fetch(scriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(() => {
        if (generatedId) {
            alert(`Request successfully recorded! Your Return Request ID is: ${generatedId}. Please store it somewhere safe for when you return the book.`);
        } else {
            alert("Request successfully recorded!");
        }
    }).catch(error => {
        console.error(error.message);
        alert("There was an error saving your request.");
    });
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        if (modalId === 'borrowIsbnModal') {
            setTimeout(() => document.getElementById('borrowIsbnInput').focus(), 100);
        } else if (modalId === 'returnIsbnModal') {
            setTimeout(() => document.getElementById('returnIsbnInput').focus(), 100);
        } else if (modalId === 'updateBotmModal') {
            setTimeout(() => document.getElementById('botmIsbnInput').focus(), 100);
        }
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
    const openLatest = document.getElementById('openUpdateLatestModal');

    if(openAdd) openAdd.addEventListener('click', () => openModal('addBookModal'));
    if(openDel) openDel.addEventListener('click', () => { openModal('deleteBookModal'); fetchDeleteChartData(); });
    if(openUpd) openUpd.addEventListener('click', () => openModal('updateBotmModal'));
    if(openLatest) openLatest.addEventListener('click', () => openModal('updateLatestModal'));
}

function loggedincheck() {
    const token = localStorage.getItem("loggedInState");
    const expiry = Number(localStorage.getItem("loggedInExpiry"));
    const isValid = token === TOKEN_VALUE && Number.isFinite(expiry) && Date.now() <= expiry;

    if (!isValid) {
        localStorage.removeItem("loggedInState");
        localStorage.removeItem("loggedInExpiry");
        // redirect to 401 - forbidden page when the session expires or token is invalid
        window.location.href = "401.html";
        return;
    }
}

function logout() {
    localStorage.removeItem("loggedInState");
    localStorage.removeItem("loggedInExpiry");
    
    window.location.href = "index.html";
}

// Session countdown helper: shows mm:ss and redirects to 401 when expired
function startSessionCountdown(elementId) {
    clearInterval(_sessionInterval);
    const el = document.getElementById(elementId);
    if (!el) return;

    function update() {
        const expiry = Number(localStorage.getItem('loggedInExpiry')) || 0;
        const remaining = expiry - Date.now();
        if (remaining <= 0) {
            el.textContent = 'Session: 00:00';
            localStorage.removeItem('loggedInState');
            localStorage.removeItem('loggedInExpiry');
            clearInterval(_sessionInterval);
            // small delay so the user sees 00:00 for a moment
            setTimeout(() => { window.location.href = '401.html'; }, 3000);
            return;
        }
        const totalSeconds = Math.floor(remaining / 1000);
        const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const seconds = (totalSeconds % 60).toString().padStart(2, '0');
        el.textContent = `Session: ${minutes}:${seconds}`;
    }

    update();
    _sessionInterval = setInterval(update, 1000);
}

async function fetchData(container) {
    try {
        const response = await fetch(sheetUrl);
        if (!response.ok) throw new Error('Network response was not ok');

        const textData = await response.text();
        const lines = textData.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        const rows = lines.map(row => row.split(',').map(cell => cell.trim().replace(/^"|"$/g, '')));

        if (rows.length === 0) {
            container.innerHTML = '<p>No data available.</p>';
            return;
        }

        const headers = rows[0];
        let maxCols = headers.length;
        rows.forEach(row => { if (row.length > maxCols) maxCols = row.length; });

        let returnedIndex = headers.findIndex(h => h.toLowerCase().includes('returned'));
        if (returnedIndex === -1) returnedIndex = 9;

        let reqIdIndex = headers.findIndex(h => h.toLowerCase().includes('request id') || h.toLowerCase().includes('requestid'));
        if (reqIdIndex === -1) reqIdIndex = 1;

        let tableHtml = '<table><thead><tr>';
        for (let i = 0; i < maxCols; i++) {
            tableHtml += `<th>${headers[i] || `Col ${i+1}`}</th>`;
        }
        tableHtml += '<th>Actions</th>';
        tableHtml += '</tr></thead><tbody>';

        rows.slice(1).forEach(rowData => {
            const returnedVal = rowData[returnedIndex] ? rowData[returnedIndex].trim().toUpperCase() : '';
            const isReturned = returnedVal === 'Y' || returnedVal === 'YES' || returnedVal === 'RETURNED';
            const reqId = rowData[reqIdIndex] || '';
            const rowStyle = isReturned ? 'text-decoration: line-through; color: green; font-weight: bold;' : '';

            tableHtml += `<tr style="${rowStyle}">`;
            
            for (let i = 0; i < maxCols; i++) {
                let cell = rowData[i] || '';
                if (i === returnedIndex) {
                    cell = isReturned ? 'Y' : cell;
                }
                tableHtml += `<td>${cell}</td>`; 
            }
            
            if (!isReturned) {
                tableHtml += `<td><button class="action-btn return-btn" style="padding: 5px 15px; font-size: 1rem; min-width: auto;" data-reqid="${reqId}">Mark as Returned</button></td>`;
            } else {
                tableHtml += `<td></td>`;
            }
            
            tableHtml += '</tr>';
        });
        tableHtml += '</tbody></table>';

        container.innerHTML = tableHtml;

        const returnBtns = container.querySelectorAll('.return-btn');
        returnBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const reqId = this.getAttribute('data-reqid');
                const row = this.closest('tr');
                markAsReturned(row, reqId, returnedIndex);
            });
        });
    } catch (error) {
        console.error(error);
        container.innerHTML = '<p>Could not load data.</p>';
    }
}

function markAsReturned(row, reqId, returnedIndex) {
    const scriptUrl = 'https://script.google.com/macros/s/AKfycbyvHlxSf3NoF8MBZQYiHvJrBmBhYVE6V_GcGhr8iSK6AeKs5SISoUN_Ho4owsjjV0_5Fw/exec';
    const data = {
        sheetTarget: "MarkReturned",
        type: "Return",
        requestID: reqId,
        returned: "Y"
    };

    fetch(scriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(() => {
        alert("Marked as returned successfully!");
    }).catch(error => {
        console.error(error.message);
    });


    row.style.textDecoration = 'line-through';
    row.style.color = 'green';
    row.style.fontWeight = 'bold';


    const cells = row.querySelectorAll('td');
    if (cells[returnedIndex]) {
        cells[returnedIndex].textContent = 'Y';
    }

    const actionCell = cells[cells.length - 1];
    if (actionCell) {
        actionCell.innerHTML = '';
    }
}

function submitAdminData(data, modalId, formElement) {
    const scriptUrl = 'https://script.google.com/macros/s/AKfycbyvHlxSf3NoF8MBZQYiHvJrBmBhYVE6V_GcGhr8iSK6AeKs5SISoUN_Ho4owsjjV0_5Fw/exec';
    
    fetch(scriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(() => {
        alert("Update successfully recorded!");
        formElement.reset();
        closeModal(modalId);
    }).catch(error => {
        console.error(error.message);
        alert("There was an error saving your request.");
    });
}
