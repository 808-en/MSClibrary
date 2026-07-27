const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRtBuoQR6ILdtAoCm6yNbDQVtEnWzgg4RJ9DPoqy8pewREj77wwojp_URuetdQW_9_Hyc2-91iQ9uOM/pub?output=csv';
const TOKEN_VALUE = "loggedInIdentifierRNBN480H39A=";

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

    const borrowIsbnForm = document.getElementById('borrowIsbnForm');
    const returnIsbnForm = document.getElementById('returnIsbnForm');

    if (borrowIsbnForm) {
        borrowIsbnForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const data = {
                type: 'Borrow',
                isbn: document.getElementById('borrowIsbnInput').value,
                nameAndRoom: document.getElementById('borrowNameRoom').value,
                signature: document.getElementById('borrowSignature').value,
                timestamp: new Date().getTime()
            };
            submitToGoogleSheet(data);
            borrowIsbnForm.reset();
            closeModal('borrowIsbnModal');
        });
    }

    if (returnIsbnForm) {
        returnIsbnForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const data = {
                type: 'Return',
                isbn: document.getElementById('returnIsbnInput').value,
                nameAndRoom: document.getElementById('returnName').value,
                signature: '',
                timestamp: new Date().getTime()
            };
            submitToGoogleSheet(data);
            returnIsbnForm.reset();
            closeModal('returnIsbnModal');
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
});

function submitToGoogleSheet(data) {
    // URL updated with your custom apps script
    const scriptUrl = 'https://script.google.com/macros/s/AKfycbwFx6ZQAM6HihvByM3TUzWivwIGfyZBH29hZG6Z7vsWFVcxZKaNaVwzXhRxxUm265bh/exec';
    
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

        let tableHtml = '<table><thead><tr>';
        rows[0].forEach(header => { tableHtml += `<th>${header}</th>`; });
        tableHtml += '</tr></thead><tbody>';

        rows.slice(1).forEach(rowData => {
            tableHtml += '<tr>';
            rowData.forEach(cell => { tableHtml += `<td>${cell}</td>`; });
            tableHtml += '</tr>';
        });
        tableHtml += '</tbody></table>';

        container.innerHTML = tableHtml;
    } catch (error) {
        console.error('Error fetching data:', error);
        container.innerHTML = '<p>Could not load data.</p>';
    }
}

let shouldNavigate = false;

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
