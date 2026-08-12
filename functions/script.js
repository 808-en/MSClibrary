const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQaTqPVndPccN9h1-RYUulv59x-Ursqed9lsoDnMfejpp8VoI1DjYFh2Cq5Xr-471I8RcKX7vJ2yJgj/pub?output=csv';
const TOKEN_VALUE = "loggedInIdentifierRNBN480H39A=";
const ADMIN_DB_URL = "https://script.google.com/macros/s/AKfycbwbPCbZbcoQ6GvIUCjYrY_jU6kM9hXk9LB5Z8vmcgBfbo9kbbzkInrp6n7URJlXuI1Wzw/exec";
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyvHlxSf3NoF8MBZQYiHvJrBmBhYVE6V_GcGhr8iSK6AeKs5SISoUN_Ho4owsjjV0_5Fw/exec';
const PERMISSIONS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSoAFx19CsTSNpMOzTY5hKdRb8zK4xhyaf62-dtZoKuZVNpba7pm8Q7S61PnrhwcldrbXc-vmFJopnr/pub?gid=1165712763&single=true&output=csv';

const specialUids = [
    "VhgEt0B5ngSPNUYoVd1pRJnPrHv2",
    "1VbKdeueO7YnEvAAT3OAVrqmquy2",
    "qe6G5PXPoqTQZVnQmcsJ6ovkq9y2",
    "rdAV8IhU11beQN7hVPhm2IUddFq1",
    "7eJpgkWS6KPXh1vCLI5gJkW698e2",
    "ozb34ly0fiWDRbc6SGHy85GVO4s1",
    "f6ODKfpvzxXzYn6DSE8PfuAmz5q1",
    "Uuy1MIQovXMJVQp3KqOuIpgvKCn1E"
];

function checkForSpecialLogin(user) {
    const userNameElement = document.getElementById('userName');
    if (!userNameElement) return;

    const userName = userNameElement.textContent.trim();

    if (userName === 'Guest') return;

    if (!user || !user.uid) return;

    if (specialUids.includes(user.uid)) {
        window.location.href = 't_admin.html';
    }
}
window.checkForSpecialLogin = checkForSpecialLogin;

let shouldNavigate = false;
let _sessionInterval = null;

document.addEventListener('DOMContentLoaded', function() {
    setupModalHandlers();
    updateAccountPermissions(null);
    
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
                const choiceSec = document.getElementById('addBookChoiceSection');
                if (choiceSec) {
                    choiceSec.style.display = 'block';
                    document.getElementById('normalTypeChoiceSection').style.display = 'none';
                    document.getElementById('normalInputSection').style.display = 'none';
                    document.getElementById('massInputSection').style.display = 'none';
                }
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
                fetch(ADMIN_DB_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: payload }),
                fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: payload })
            ]).then(() => {
                alert(books.length + " books added successfully.");
                massForm.reset();
                closeModal('addBookModal');
                const choiceSec = document.getElementById('addBookChoiceSection');
                if (choiceSec) {
                    choiceSec.style.display = 'block';
                    document.getElementById('normalTypeChoiceSection').style.display = 'none';
                    document.getElementById('normalInputSection').style.display = 'none';
                    document.getElementById('massInputSection').style.display = 'none';
                }
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
            if (confirm("Are you sure you want to delete ALL books? This requires extra confirmation and cannot be undone.")) {
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
});

function isActivePeriodValid(activePeriodStr) {
    if (!activePeriodStr) return false;
    const currentYear = new Date().getFullYear();
    if (activePeriodStr.includes(String(currentYear))) return true;
    const years = activePeriodStr.match(/\b20\d\d\b/g);
    if (years && years.length >= 2) {
        const startYear = parseInt(years[0], 10);
        const endYear = parseInt(years[years.length - 1], 10);
        if (currentYear >= startYear && currentYear <= endYear) return true;
    }
    return false;
}

async function updateAccountPermissions(user) {
    const addDelEl = document.getElementById('addDeleteBooksPermission');
    const exportEl = document.getElementById('exportRequestsPermission');
    const botmEl = document.getElementById('updateChangesBotmPermission');
    const teacherEl = document.getElementById('teacherToolsPermission');

    if (!addDelEl && !exportEl && !botmEl && !teacherEl) return;

    const greenY = '<span style="color: green; font-weight: bold;">Y</span>';
    const redN = '<span style="color: red; font-weight: bold;">N</span>';

    let role = 'guest';

    if (user && user.uid) {
        if (specialUids.includes(user.uid)) {
            role = 'teacher';
        } else {
            try {
                const response = await fetch(PERMISSIONS_CSV_URL);
                if (response.ok) {
                    const csvText = await response.text();
                    const lines = csvText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
                    if (lines.length > 1) {
                        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
                        let uidIdx = headers.indexOf('uid');
                        if (uidIdx === -1) uidIdx = 3;
                        let roleIdx = headers.indexOf('role');
                        if (roleIdx === -1) roleIdx = 2;
                        let activeIdx = headers.findIndex(h => h.includes('active'));
                        if (activeIdx === -1) activeIdx = 4;

                        for (let i = 1; i < lines.length; i++) {
                            const cells = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
                            const rowUid = cells[uidIdx] !== undefined ? cells[uidIdx] : (cells[3] || '');
                            const rowRole = cells[roleIdx] !== undefined ? cells[roleIdx] : (cells[2] || '');
                            const rowActive = cells[activeIdx] !== undefined ? cells[activeIdx] : (cells[4] || cells[cells.length - 1] || '');

                            if (rowUid === user.uid && isActivePeriodValid(rowActive)) {
                                const lowerRole = rowRole.toLowerCase();
                                if (lowerRole.includes('teacher')) {
                                    role = 'teacher';
                                } else if (lowerRole.includes('book manager') || lowerRole.includes('librarian') || lowerRole.includes('manager')) {
                                    role = 'librarian';
                                }
                                break;
                            }
                        }
                    }
                }
            } catch (e) {
                console.error(e);
            }
        }
    }

    if (role === 'teacher') {
        if (addDelEl) addDelEl.innerHTML = greenY;
        if (exportEl) exportEl.innerHTML = greenY;
        if (botmEl) botmEl.innerHTML = greenY;
        if (teacherEl) teacherEl.innerHTML = greenY;
    } else if (role === 'librarian') {
        if (addDelEl) addDelEl.innerHTML = greenY;
        if (exportEl) exportEl.innerHTML = greenY;
        if (botmEl) botmEl.innerHTML = greenY;
        if (teacherEl) teacherEl.innerHTML = redN;
    } else {
        if (addDelEl) addDelEl.innerHTML = redN;
        if (exportEl) exportEl.innerHTML = redN;
        if (botmEl) botmEl.innerHTML = redN;
        if (teacherEl) teacherEl.innerHTML = redN;
    }
}

window.updateAccountPermissions = updateAccountPermissions;

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

    try {
        const response = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${cleanIsbn}&format=json&jscmd=data`);
        if (response.ok) {
            const data = await response.json();
            const book = data[`ISBN:${cleanIsbn}`];
            if (book) {
                return {
                    title: book.title || '',
                    author: book.authors ? book.authors.map(a => a.name).join(', ') : '',
                    genre: book.subjects ? book.subjects.map(s => s.name).join(', ') : '',
                    synopsis: typeof book.notes === 'string' ? book.notes : '',
                    cover: book.cover ? (book.cover.large || book.cover.medium || book.cover.small || '') : '',
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
        fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: payload }),
        fetch(ADMIN_DB_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: payload })
    ]).then(() => {
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
    const openPerms = document.getElementById('openPermissions');

    if(openAdd) openAdd.addEventListener('click', () => openModal('addBookModal'));
    if(openDel) openDel.addEventListener('click', () => { openModal('deleteBookModal'); fetchDeleteChartData(); });
    if(openUpd) openUpd.addEventListener('click', () => openModal('updateBotmModal'));
    if(openLatest) openLatest.addEventListener('click', () => openModal('updateLatestModal'));
    if(openPerms) openPerms.addEventListener('click', () => openModal('permissionsModal'));
}

function loggedincheck() {}
function startSessionCountdown(elementId) {}
function logout() {
    if (window.logoutFirebase) {
        window.logoutFirebase();
    }
    window.location.href = "index.html";
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
    const data = {
        sheetTarget: "MarkReturned",
        action: "markReturned",
        type: "Return",
        requestID: reqId,
        requestId: reqId,
        returned: "Y",
        "Returned?": "Y"
    };

    const payload = JSON.stringify(data);

    Promise.all([
        fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: payload }),
        fetch(ADMIN_DB_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: payload })
    ]).then(() => {
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
    const payload = JSON.stringify(data);
    Promise.all([
        fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: payload }),
        fetch(ADMIN_DB_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: payload })
    ]).then(() => {
        alert("Update successfully recorded!");
        if (formElement) formElement.reset();
        closeModal(modalId);
    }).catch(error => {
        console.error(error.message);
        alert("There was an error saving your request.");
    });
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
