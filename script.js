const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQaTqPVndPccN9h1-RYUulv59x-Ursqed9lsoDnMfejpp8VoI1DjYFh2Cq5Xr-471I8RcKX7vJ2yJgj/pub?output=csv';
const sheetReturnUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQaTqPVndPccN9h1-RYUulv59x-Ursqed9lsoDnMfejpp8VoI1DjYFh2Cq5Xr-471I8RcKX7vJ2yJgj/pub?output=csv&gid=2128186552';
const TOKEN_VALUE = "loggedInIdentifierRNBN480H39A=";
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyvHlxSf3NoF8MBZQYiHvJrBmBhYVE6V_GcGhr8iSK6AeKs5SISoUN_Ho4owsjjV0_5Fw/exec';
const ADMIN_DB_URL = 'https://script.google.com/macros/s/AKfycbyvHlxSf3NoF8MBZQYiHvJrBmBhYVE6V_GcGhr8iSK6AeKs5SISoUN_Ho4owsjjV0_5Fw/exec';

let _sessionInterval = null;
let _borrowRequestsData = [];

function formatTimestamp(value) {
    if (!value) return '';
    let strVal = String(value).trim();
    let num = Number(strVal);
    if (!isNaN(num) && num > 100000000) {
        if (num < 10000000000) num = num * 1000;
        let d = new Date(num);
        if (!isNaN(d.getTime())) {
            let m = d.getMonth() + 1;
            let day = d.getDate();
            let y = d.getFullYear();
            let h = d.getHours();
            let min = String(d.getMinutes()).padStart(2, '0');
            let sec = String(d.getSeconds()).padStart(2, '0');
            return `${m}/${day}/${y} ${h}:${min}:${sec}`;
        }
    }
    return value;
}

document.addEventListener('DOMContentLoaded', function() {
    initSessionTimer();
    setupModalHandlers();
    setupTeacherControls();
    setupBotmForm();
    setupChangelogForm();
    setupReturnSearch();

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

    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });

    const dataContainer = document.getElementById('data-container');
    if (dataContainer) {
        fetchData(dataContainer);
    }

    const dataContainer1 = document.getElementById('data-container1');
    if (dataContainer1) {
        fetchReturnData(dataContainer1);
    }

    const massContainer = document.getElementById('massIsbnContainer');
    if (massContainer) {
        massContainer.innerHTML = '';
        const massInputs = [];
        for (let i = 1; i <= 15; i++) {
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'mass-isbn-input';
            input.placeholder = `ISBN ${i}`;
            input.style.marginBottom = '10px';
            massContainer.appendChild(input);
            massInputs.push(input);
        }
        massInputs.forEach((input, index) => {
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (index + 1 < massInputs.length) {
                        massInputs[index + 1].focus();
                    }
                }
            });
        });
    }

    const addNormalLookupBtn = document.getElementById('addNormalLookupBtn');
    if (addNormalLookupBtn) {
        addNormalLookupBtn.addEventListener('click', async () => {
            const isbn = document.getElementById('addNormalIsbn').value.trim();
            const details = await fetchBookDetailsFromAPI(isbn);
            if (details) {
                if (document.getElementById('addNormalTitle')) document.getElementById('addNormalTitle').value = details.title;
                if (document.getElementById('addNormalAuthor')) document.getElementById('addNormalAuthor').value = details.author;
                if (document.getElementById('addNormalGenre')) document.getElementById('addNormalGenre').value = details.genre;
                if (document.getElementById('addNormalSynopsis')) document.getElementById('addNormalSynopsis').value = details.synopsis;
                if (document.getElementById('addNormalCover')) document.getElementById('addNormalCover').value = details.cover;
            } else {
                alert("Book details not found automatically. You may enter them manually.");
            }
        });
    }

    const normalForm = document.getElementById('addBookNormalForm');
    if (normalForm) {
        normalForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const data = {
                action: "addBook",
                sheetTarget: "Library Catalog",
                isbn: document.getElementById('addNormalIsbn') ? document.getElementById('addNormalIsbn').value : '',
                title: document.getElementById('addNormalTitle').value,
                author: document.getElementById('addNormalAuthor').value,
                genre: document.getElementById('addNormalGenre').value,
                grade: document.getElementById('addNormalGrade').value,
                msc: document.getElementById('addNormalMsc').value,
                synopsis: document.getElementById('addNormalSynopsis').value,
                cover: document.getElementById('addNormalCover').value,
                quantity: document.getElementById('addNormalQuantity').value
            };
            const payload = JSON.stringify(data);
            Promise.all([
                fetch(ADMIN_DB_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: payload }),
                fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: payload })
            ]).then(() => {
                alert("Book added successfully.");
                normalForm.reset();
                closeModal('addBookModal');
            }).catch(() => {
                alert("Book submission attempted. Please check Google Sheet.");
            });
        });
    }

    const massForm = document.getElementById('addBookMassForm');
    if (massForm) {
        massForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const inputs = document.querySelectorAll('.mass-isbn-input');
            const books = [];
            for (let input of inputs) {
                const isbn = input.value.trim();
                if (isbn) {
                    const details = await fetchBookDetailsFromAPI(isbn);
                    if (details) {
                        details.isbn = isbn;
                        books.push(details);
                    } else {
                        books.push({
                            isbn: isbn,
                            title: 'Unknown Title (' + isbn + ')',
                            author: 'Unknown Author',
                            genre: '',
                            grade: '',
                            msc: '',
                            synopsis: '',
                            cover: '',
                            quantity: 1
                        });
                    }
                }
            }
            if (books.length === 0) {
                alert("No valid books found to add.");
                return;
            }
            const data = { action: "addMass", sheetTarget: "Library Catalog", books: books };
            const payload = JSON.stringify(data);
            Promise.all([
                fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: payload })
            ]).then(() => {
                alert(books.length + " books added successfully.");
                massForm.reset();
                closeModal('addBookModal');
            }).catch(() => {
                alert("Books submission attempted. Please check Google Sheet.");
            });
        });
    }

    const searchDel = document.getElementById('deleteSearchInput');
    if (searchDel) {
        searchDel.addEventListener('input', function() {
            const term = this.value.toLowerCase();
            const rows = document.getElementById('deleteBooksBody').querySelectorAll('tr');
            rows.forEach(row => {
                const title = row.cells[1] ? row.cells[1].textContent.toLowerCase() : '';
                const author = row.cells[2] ? row.cells[2].textContent.toLowerCase() : '';
                if (title.includes(term) || author.includes(term)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }

    const selectAllDel = document.getElementById('selectAllDelete');
    if (selectAllDel) {
        selectAllDel.addEventListener('change', function() {
            const checkboxes = document.querySelectorAll('.delete-checkbox');
            checkboxes.forEach(cb => {
                if (cb.closest('tr').style.display !== 'none') {
                    cb.checked = this.checked;
                }
            });
        });
    }

    const btnDelSelected = document.getElementById('btnDeleteSelected');
    if (btnDelSelected) {
        btnDelSelected.addEventListener('click', () => {
            const checked = document.querySelectorAll('.delete-checkbox:checked');
            if (checked.length === 0) {
                alert('No books selected.');
                return;
            }
            const rows = Array.from(checked).map(cb => parseInt(cb.value));
            const payload = JSON.stringify({ action: "deleteSelected", sheetTarget: "Library Catalog", rows: rows });
            Promise.all([
                fetch(ADMIN_DB_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: payload }),
                fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: payload })
            ]).then(() => {
                alert('Deletion requested successfully.');
                setTimeout(fetchDeleteChartData, 1500);
            });
        });
    }

    const btnDelAll = document.getElementById('btnDeleteAll');
    if (btnDelAll) {
        btnDelAll.addEventListener('click', () => {
            if (confirm("Are you sure you want to delete ALL books?")) {
                if (confirm("FINAL WARNING: Click OK to delete the entire library database.")) {
                    const payload = JSON.stringify({ action: "deleteAll", sheetTarget: "Library Catalog" });
                    Promise.all([
                        fetch(ADMIN_DB_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: payload }),
                        fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: payload })
                    ]).then(() => {
                        alert('All books deleted.');
                        setTimeout(fetchDeleteChartData, 1500);
                    });
                }
            }
        });
    }

    const btnRefresh = document.getElementById('btnRefreshDelete');
    if (btnRefresh) {
        btnRefresh.addEventListener('click', fetchDeleteChartData);
    }

    const openBotmBtn = document.getElementById('openUpdateBotmModal');
    if (openBotmBtn) {
        openBotmBtn.addEventListener('click', () => openModal('updateBotmModal'));
    }

    const openChangelogBtn = document.getElementById('openUpdateLatestModal');
    if (openChangelogBtn) {
        openChangelogBtn.addEventListener('click', () => openModal('updateLatestModal'));
    }

    fetchBotm();
    fetchChangelog();
});

function initSessionTimer() {
    const isAdminPage = window.location.pathname.includes('admin.html');
    const isLoggedIn = sessionStorage.getItem('adminLoggedIn') === 'true';
    const loginTime = parseInt(sessionStorage.getItem('loginTime') || '0', 10);
    const sessionDuration = 20 * 60 * 1000;

    if (isAdminPage) {
        if (!isLoggedIn || !loginTime || (Date.now() - loginTime > sessionDuration)) {
            logout();
            return;
        }

        const countdownEl = document.getElementById('sessionCountdown');
        if (_sessionInterval) clearInterval(_sessionInterval);

        _sessionInterval = setInterval(() => {
            const remainingMs = sessionDuration - (Date.now() - loginTime);
            if (remainingMs <= 0) {
                clearInterval(_sessionInterval);
                alert("Session expired. Automatically logging out.");
                logout();
            } else {
                const totalSec = Math.floor(remainingMs / 1000);
                const mins = Math.floor(totalSec / 60);
                const secs = totalSec % 60;
                if (countdownEl) {
                    countdownEl.textContent = `Session: ${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                }
            }
        }, 1000);
    }
}

function logout() {
    sessionStorage.removeItem('adminLoggedIn');
    sessionStorage.removeItem('loginTime');
    sessionStorage.removeItem('teacherUnlocked');
    window.location.href = "index.html";
}

function setupTeacherControls() {
    const btnTeacher = document.getElementById('btnTeacherControls');
    const unlockedSec = document.getElementById('unlockedTeacherControls');
    const authForm = document.getElementById('teacherAuthForm');

    if (sessionStorage.getItem('teacherUnlocked') === 'true' && unlockedSec) {
        unlockedSec.style.display = 'block';
    }

    if (btnTeacher) {
        btnTeacher.addEventListener('click', () => {
            if (sessionStorage.getItem('teacherUnlocked') === 'true') {
                unlockedSec.style.display = unlockedSec.style.display === 'none' ? 'block' : 'none';
            } else {
                openModal('teacherAuthModal');
            }
        });
    }

    if (authForm) {
        authForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const code = document.getElementById('teacherPinInput').value.trim();
            if (code === "54321") {
                sessionStorage.setItem('teacherUnlocked', 'true');
                closeModal('teacherAuthModal');
                if (unlockedSec) unlockedSec.style.display = 'block';
                alert("Teacher Controls Unlocked!");
            } else {
                alert("Incorrect teacher password.");
            }
        });
    }
}

function setupFormSubmission(formId, type, dataExtractor, modalId) {
    const form = document.getElementById(formId);
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const extracted = dataExtractor();
            const reqId = type === 'Borrow' ? 'REQ-' + Math.random().toString(36).substr(2, 9).toUpperCase() : extracted.requestId;
            const data = {
                requestID: reqId,
                requestId: reqId,
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

async function fetchBookDetailsFromAPI(isbn) {
    if (!isbn) return null;
    const cleanIsbn = isbn.replace(/[^0-9X]/gi, '');
    if (!cleanIsbn) return null;

    try {
        const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanIsbn}`);
        if (response.ok) {
            const data = await response.json();
            if (data.items && data.items.length > 0) {
                const vol = data.items[0].volumeInfo;
                return {
                    title: vol.title || '',
                    author: vol.authors ? vol.authors.join(', ') : '',
                    genre: vol.categories ? vol.categories.join(', ') : '',
                    synopsis: vol.description || '',
                    cover: vol.imageLinks ? (vol.imageLinks.thumbnail || vol.imageLinks.smallThumbnail || '').replace('http:', 'https:') : '',
                    grade: '',
                    msc: '',
                    quantity: 1
                };
            }
        }
    } catch(e) {}

    return null;
}

async function lookupIsbn(isbn, titleInputId, authorInputId) {
    if (!isbn) return;
    const details = await fetchBookDetailsFromAPI(isbn);
    if (details) {
        if (titleInputId && document.getElementById(titleInputId)) {
            document.getElementById(titleInputId).value = details.title;
        }
        if (authorInputId && document.getElementById(authorInputId)) {
            document.getElementById(authorInputId).value = details.author;
        }
    } else {
        alert("Book details not found automatically. You can proceed with standard text entry.");
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
    const payload = JSON.stringify(data);
    Promise.all([
        fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: payload })
    ]).then(() => {
        if (generatedId) {
            alert(`Request successfully recorded! Your Request ID is: ${generatedId}. Please save it for returning.`);
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

    if(openAdd) openAdd.addEventListener('click', () => openModal('addBookModal'));
    if(openDel) openDel.addEventListener('click', () => { openModal('deleteBookModal'); fetchDeleteChartData(); });
}

function parseCSV(text) {
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    return lines.map(line => {
        const row = [];
        let insideQuote = false;
        let cell = '';
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                insideQuote = !insideQuote;
            } else if (char === ',' && !insideQuote) {
                row.push(cell.trim().replace(/^"|"$/g, ''));
                cell = '';
            } else {
                cell += char;
            }
        }
        row.push(cell.trim().replace(/^"|"$/g, ''));
        return row;
    });
}

function renderSheetRows(container, rows) {
    if (!rows || rows.length === 0) {
        container.innerHTML = '<p>No data available.</p>';
        return;
    }

    const headers = rows[0].map(h => h || '');
    let maxCols = headers.length;
    rows.forEach(row => { if (row.length > maxCols) maxCols = row.length; });

    let returnedIndex = headers.findIndex(h => (h || '').toLowerCase().includes('returned'));
    if (returnedIndex === -1) returnedIndex = 8;

    let reqIdIndex = headers.findIndex(h => {
        const lower = (h || '').toLowerCase().trim();
        return lower.includes('request id') || lower.includes('requestid') || lower === 'id';
    });
    if (reqIdIndex === -1) reqIdIndex = 1;

    let tableHtml = '<table><thead><tr>';
    for (let i = 0; i < maxCols; i++) {
        tableHtml += `<th>${headers[i] || `Col ${i+1}`}</th>`;
    }
    tableHtml += '<th>Actions</th>';
    tableHtml += '</tr></thead><tbody>';

    rows.slice(1).forEach(rowData => {
        const returnedVal = (rowData[returnedIndex] || '').toString().trim().toUpperCase();
        const isReturned = returnedVal === 'Y' || returnedVal === 'YES' || returnedVal === 'RETURNED';
        const reqId = rowData[reqIdIndex] || '';
        const rowStyle = isReturned ? 'text-decoration: line-through; color: green; font-weight: bold;' : '';

        tableHtml += `<tr style="${rowStyle}">`;
        
        for (let i = 0; i < maxCols; i++) {
            let cell = rowData[i] || '';
            if (i === 0) {
                cell = formatTimestamp(cell);
            }
            if (i === returnedIndex) {
                cell = isReturned ? 'Y' : cell;
            }
            const safeCell = String(cell).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            tableHtml += `<td>${safeCell}</td>`; 
        }
        
        if (!isReturned) {
            tableHtml += `<td><button class="action-btn return-btn" style="padding: 5px 15px; font-size: 1rem; min-width: auto;" data-reqid="${reqId}">Mark as Returned</button></td>`;
        } else {
            tableHtml += `<td>Completed</td>`;
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
}

async function fetchData(container) {
    try {
        const response = await fetch(sheetUrl);
        if (!response.ok) throw new Error('Network response was not ok');

        const textData = await response.text();
        const rows = parseCSV(textData);

        _borrowRequestsData = [];
        if (rows.length > 1) {
            rows.slice(1).forEach(r => {
                _borrowRequestsData.push({
                    timestamp: r[0] || '',
                    requestId: r[1] || '',
                    isbn: r[2] || '',
                    title: r[3] || '',
                    author: r[4] || '',
                    name: r[5] || '',
                    room: r[6] || ''
                });
            });
        }

        renderSheetRows(container, rows);
    } catch (error) {
        console.error(error);
        if (container) container.innerHTML = '<p>Could not load data.</p>';
    }
}

async function fetchReturnData(container) {
    try {
        const response = await fetch(sheetReturnUrl);
        if (!response.ok) throw new Error('Network response was not ok');

        const textData = await response.text();
        const rows = parseCSV(textData);
        renderSheetRows(container, rows);
    } catch (error) {
        console.error(error);
        if (container) container.innerHTML = '<p>Could not load return data.</p>';
    }
}

function markAsReturned(row, reqId, returnedIndex) {
    const data = {
        sheetTarget: "MarkReturned",
        action: "markReturned",
        type: "Return",
        requestID: reqId,
        requestId: reqId,
        returned: "Y"
    };

    const payload = JSON.stringify(data);

    Promise.all([
        fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: payload }),
        fetch(ADMIN_DB_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: payload })
    ]).then(() => {
        alert("Marked as returned successfully!");
    }).catch(error => {
        console.error(error);
    });

    if (row) {
        row.style.textDecoration = 'line-through';
        row.style.color = 'green';
        row.style.fontWeight = 'bold';

        const cells = row.querySelectorAll('td');
        if (returnedIndex >= 0 && cells[returnedIndex]) {
            cells[returnedIndex].textContent = 'Y';
        }

        const actionCell = cells[cells.length - 1];
        if (actionCell) {
            actionCell.innerHTML = 'Completed';
        }
    }
}

function setupReturnSearch() {
    const attachSearch = (inputId, dropdownId, titleId, authorId, nameId, roomId, isbnId) => {
        const input = document.getElementById(inputId);
        const dropdown = document.getElementById(dropdownId);
        if (!input || !dropdown) return;

        input.addEventListener('input', function() {
            const query = this.value.trim().toLowerCase();
            if (query.length === 0) {
                dropdown.style.display = 'none';
                dropdown.innerHTML = '';
                toggleAutofillStrikethrough(false, [titleId, authorId, nameId, roomId]);
                return;
            }

            const matches = _borrowRequestsData.filter(item => 
                (item.requestId && item.requestId.toLowerCase().includes(query)) ||
                (item.name && item.name.toLowerCase().includes(query)) ||
                (item.title && item.title.toLowerCase().includes(query))
            ).slice(0, 3);

            if (matches.length === 0) {
                dropdown.style.display = 'none';
                return;
            }

            dropdown.innerHTML = '';
            matches.forEach(m => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'search-item';
                itemDiv.innerHTML = `<strong>${m.requestId}</strong> | ${m.title} | ${m.name} <br><small>${formatTimestamp(m.timestamp)}</small>`;
                itemDiv.addEventListener('click', () => {
                    input.value = m.requestId;
                    if (titleId && document.getElementById(titleId)) document.getElementById(titleId).value = m.title;
                    if (authorId && document.getElementById(authorId)) document.getElementById(authorId).value = m.author;
                    if (nameId && document.getElementById(nameId)) document.getElementById(nameId).value = m.name;
                    if (roomId && document.getElementById(roomId)) document.getElementById(roomId).value = m.room;
                    if (isbnId && document.getElementById(isbnId)) document.getElementById(isbnId).value = m.isbn;

                    dropdown.style.display = 'none';
                    toggleAutofillStrikethrough(true, [titleId, authorId, nameId, roomId]);
                });
                dropdown.appendChild(itemDiv);
            });
            dropdown.style.display = 'block';
        });
    };

    attachSearch('returnRequestId', 'returnSearchDropdown', 'returnAutoTitle', 'returnAutoAuthor', 'returnName', 'returnRoom', 'returnIsbnInput');
    attachSearch('returnManualRequestId', 'returnManualSearchDropdown', 'returnManualTitle', 'returnManualAuthor', 'returnManualName', 'returnManualRoom', null);
}

function toggleAutofillStrikethrough(enable, fieldIds) {
    fieldIds.forEach(id => {
        if (!id) return;
        const el = document.getElementById(id);
        if (el) {
            if (enable) el.classList.add('field-strikethrough');
            else el.classList.remove('field-strikethrough');
        }
    });
}

function setupBotmForm() {
    const form = document.getElementById('botmForm');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            const botmData = {
                action: "updateBotm",
                sheetTarget: "BOTM",
                isbn: document.getElementById('botmIsbnInput').value,
                month: document.getElementById('botmMonth').value,
                title: document.getElementById('botmTitle').value,
                author: document.getElementById('botmAuthor').value,
                timestamp: new Date().getTime()
            };

            const payload = JSON.stringify(botmData);
            try {
                await Promise.all([
                    fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: payload }),
                    fetch(ADMIN_DB_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: payload })
                ]);
                alert("Book of the Month updated successfully!");
                form.reset();
                closeModal('updateBotmModal');
            } catch(error) {
                alert("Error updating Book of the Month.");
            }
        });
    }

    const botmLookupBtn = document.getElementById('botmLookupBtn');
    if (botmLookupBtn) {
        botmLookupBtn.addEventListener('click', async () => {
            const isbn = document.getElementById('botmIsbnInput').value.trim();
            if (!isbn) return alert("Please enter an ISBN first.");
            const details = await fetchBookDetailsFromAPI(isbn);
            if (details) {
                document.getElementById('botmTitle').value = details.title;
                document.getElementById('botmAuthor').value = details.author;
            } else {
                alert("Book details not found. Please enter manually.");
            }
        });
    }
}

async function fetchBotm() {
    try {
        const botmContainer = document.getElementById('botmContainer');
        const response = await fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vQaTqPVndPccN9h1-RYUulv59x-Ursqed9lsoDnMfejpp8VoI1DjYFh2Cq5Xr-471I8RcKX7vJ2yJgj/pub?gid=399990247&single=true&output=csv');
        const data = await response.text();
        const lines = data.split('\n').filter(line => line.trim().length > 0);
        
        if (lines.length > 1 && botmContainer) {
            const latest = lines[lines.length - 1].split(',');
            botmContainer.innerHTML = `
                <div class="botm-card">
                    <h3>📚 Book of the Month</h3>
                    <p><strong>${latest[2] || ''}</strong></p>
                    <p>by ${latest[3] || ''}</p>
                    <p>${latest[1] || ''}</p>
                </div>
            `;
        }
    } catch(error) {}
}

function setupChangelogForm() {
    const form = document.getElementById('changelogForm');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            const msgInput = document.getElementById('changelogMessage').value;
            const changelogData = {
                action: "updateChangelog",
                sheetTarget: "Changelog",
                version: document.getElementById('changelogVersion') ? document.getElementById('changelogVersion').value : '1.0.0',
                message: msgInput.substring(0, 300),
                timestamp: new Date().getTime()
            };

            const payload = JSON.stringify(changelogData);
            try {
                await Promise.all([
                    fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: payload }),
                    fetch(ADMIN_DB_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: payload })
                ]);
                alert("Changelog updated successfully!");
                form.reset();
                closeModal('updateLatestModal');
            } catch(error) {
                alert("Error updating Changelog.");
            }
        });
    }
}

async function fetchChangelog() {
    try {
        const changelogContainer = document.getElementById('changelogContainer');
        const response = await fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vQaTqPVndPccN9h1-RYUulv59x-Ursqed9lsoDnMfejpp8VoI1DjYFh2Cq5Xr-471I8RcKX7vJ2yJgj/pub?gid=799275151&single=true&output=csv');
        const data = await response.text();
        const lines = data.split('\n').filter(line => line.trim().length > 0);
        
        if (lines.length > 1 && changelogContainer) {
            let changelogHtml = '<div class="changelog-card"><h3>📝 Latest Updates</h3>';
            const recentEntries = lines.slice(Math.max(1, lines.length - 6)).reverse();
            recentEntries.forEach(line => {
                const parts = line.split(',');
                if (parts.length >= 2) {
                    changelogHtml += `<div class="changelog-entry"><p><strong>v${parts[0] || ''}</strong>: ${parts[1] || ''}</p></div>`;
                }
            });
            changelogHtml += '</div>';
            changelogContainer.innerHTML = changelogHtml;
        }
    } catch(error) {}
}

async function fetchDeleteChartData() {
    const bodyEl = document.getElementById('deleteBooksBody');
    if (!bodyEl) return;
    bodyEl.innerHTML = '<tr><td colspan="4" style="text-align:center;">Loading...</td></tr>';
    try {
        const response = await fetch(ADMIN_DB_URL);
        const books = await response.json();
        bodyEl.innerHTML = '';
        if (Array.isArray(books) && books.length > 0) {
            books.forEach(book => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="text-align: center;"><input type="checkbox" class="delete-checkbox" value="${book.row}"></td>
                    <td>${book.title || book['Book Name'] || ''}</td>
                    <td>${book.author || book['Author'] || ''}</td>
                    <td>${book.quantity || book['Quantity'] || 1}</td>
                `;
                bodyEl.appendChild(tr);
            });
        } else {
            bodyEl.innerHTML = '<tr><td colspan="4" style="text-align:center;">No books found.</td></tr>';
        }
    } catch (error) {
        bodyEl.innerHTML = '<tr><td colspan="4" style="text-align:center;">Error loading books.</td></tr>';
    }
}
