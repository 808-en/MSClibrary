// admin_script.js

const requestList = document.getElementById('requestList');
const localStorageKey = 'borrowRequests'; // Key for borrow requests
let storedRequests = [];

function calculatePickupTime(borrowDuration, timestamp) {
    const requestDate = new Date(timestamp);
    let pickupDate = new Date(requestDate);

    switch (borrowDuration) {
        case '1_day':
            pickupDate.setDate(requestDate.getDate() + 1);
            break;
        case '3_days':
            pickupDate.setDate(requestDate.getDate() + 3);
            break;
        case '1_week':
            pickupDate.setDate(requestDate.getDate() + 7);
            break;
        case '2_weeks':
            pickupDate.setDate(requestDate.getDate() + 14);
            break;
        case '3_weeks':
            pickupDate.setDate(requestDate.getDate() + 21);
            break;
        case '4_weeks':
            pickupDate.setDate(requestDate.getDate() + 28);
            break;
        default:
            return null;
    }
    return pickupDate;
}

function updateCountdown(pickupDateCell, pickupDate) {
    const now = new Date();
    const timeLeft = pickupDate.getTime() - now.getTime();

    if (timeLeft <= 0) {
        pickupDateCell.innerHTML = '<span style="color: green; font-weight: bold;">PICK UP TIME!</span>';
        pickupDateCell.parentElement.classList.add('pickup-ready');
    } else {
        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
        pickupDateCell.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    }
}

function toggleDone(requestId, button, flag) {
    storedRequests = JSON.parse(localStorage.getItem(localStorageKey)) || [];

    if (storedRequests[requestId]) {
        storedRequests[requestId].done = !storedRequests[requestId].done;
        localStorage.setItem(localStorageKey, JSON.stringify(storedRequests));
        loadBorrowRequests();
    }
}

function markDelivered(requestId, button, flag) {
    storedRequests = JSON.parse(localStorage.getItem(localStorageKey)) || [];

    if (storedRequests[requestId]) {
        storedRequests[requestId].delivered = !storedRequests[requestId].delivered;
        if (storedRequests[requestId].delivered) {
            storedRequests[requestId].deliveryTimestamp = new Date().getTime();
        } else {
            delete storedRequests[requestId].deliveryTimestamp;
        }
        localStorage.setItem(localStorageKey, JSON.stringify(storedRequests));
        loadBorrowRequests();
    }
}

function updateDeliveryCountdown(deliveredCell, deliveryTimestamp, pickupDate, requestTimestamp) {
    if (deliveryTimestamp && pickupDate) {
        const now = new Date();
        const timeElapsed = now.getTime() - deliveryTimestamp;
        const totalBorrowTime = pickupDate.getTime() - requestTimestamp;

        if (timeElapsed >= totalBorrowTime) {
            deliveredCell.innerHTML = '<span style="color: red; font-weight: bold;">OVERDUE</span>';
        } else {
            const timeLeft = totalBorrowTime - timeElapsed;
            const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
            deliveredCell.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
        }
    } else if (deliveryTimestamp) {
        const now = new Date();
        const timeElapsed = now.getTime() - deliveryTimestamp;
        const days = Math.floor(timeElapsed / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeElapsed % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeElapsed % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeElapsed % (1000 * 60)) / 1000);
        deliveredCell.textContent = `Out for: ${days}d ${hours}h ${minutes}m ${seconds}s`;
    } else {
        deliveredCell.textContent = 'Delivered';
    }
}

function loadBorrowRequests() {
    storedRequests = JSON.parse(localStorage.getItem(localStorageKey)) || [];

    requestList.innerHTML = ''; // Clear current requests

    if (storedRequests.length === 0) {
        const noRequestsRow = requestList.insertRow();
        const noRequestsCell = noRequestsRow.insertCell();
        noRequestsCell.colSpan = 9;
        noRequestsCell.classList.add('no-requests');
        noRequestsCell.textContent = 'No pending borrow requests.';
        return;
    }

    storedRequests.forEach((request, index) => {
        const row = requestList.insertRow();
        row.classList.add('request-row');
        if (request.done) {
            row.classList.add('done-row');
        }

        const actionsCell = row.insertCell();
        const deliveredButton = document.createElement('button');
        deliveredButton.textContent = request.delivered ? 'Mark as DELIVERED' : 'DELIVERED';
        deliveredButton.classList.add('delivered-button');
        const doneButton = document.createElement('button');
        doneButton.textContent = request.done ? 'UNDONE' : 'Mark as DONE';
        doneButton.classList.add('done-button');
        const statusFlag = document.createElement('span');
        statusFlag.classList.add('status-flag');
        statusFlag.innerHTML = '&#x25CB;'; // Empty circle

        if (request.done) {
            statusFlag.classList.add('done');
            statusFlag.innerHTML = '&#x25CF;'; // Filled circle
        } else if (request.delivered) { // Check delivered if not done
            statusFlag.classList.add('delivered');
            statusFlag.innerHTML = '&#x25CF;'; // Filled circle
        }

        deliveredButton.addEventListener('click', () => {
            markDelivered(index, deliveredButton, statusFlag);
        });

        doneButton.addEventListener('click', () => {
            toggleDone(index, doneButton, statusFlag);
        });

        actionsCell.appendChild(deliveredButton);
        actionsCell.appendChild(doneButton);
        actionsCell.appendChild(statusFlag);

        row.insertCell().textContent = index + 1; // Request ID
        row.insertCell().textContent = request.bookName;
        row.insertCell().textContent = request.genre || 'N/A';
        row.insertCell().textContent = request.borrowerName;
        row.insertCell().textContent = request.borrowDuration.replace('_', ' ');
        const pickupDateCell = row.insertCell();
        const pickupDate = calculatePickupTime(request.borrowDuration, request.timestamp);
        if (pickupDate) {
            updateCountdown(pickupDateCell, pickupDate);
            setInterval(() => updateCountdown(pickupDateCell, pickupDate), 1000);
        } else {
            pickupDateCell.textContent = 'Invalid Duration';
        }
        const deliveredCell = row.insertCell();
        updateDeliveryCountdown(deliveredCell, request.deliveryTimestamp, pickupDate, request.timestamp);
        if (request.delivered && pickupDate) {
            setInterval(() => updateDeliveryCountdown(deliveredCell, request.deliveryTimestamp, pickupDate, request.timestamp), 1000);
        }

        row.insertCell().textContent = request.signature;
    });
}

// Initial load of borrow requests when the admin page loads
loadBorrowRequests();

const BOOKS_STORAGE_KEY = 'libraryBooks';

const addBookModal = document.getElementById('addBookModal');
const openAddBookModalBtn = document.getElementById('openAddBookModal');
const closeAddBookModalBtn = document.getElementById('closeAddBookModal');
const addBookFormAdmin = document.getElementById('addBookFormAdmin');

// Get modal elements for Delete Book
const deleteBookModal = document.getElementById('deleteBookModal');
const openDeleteBookModalBtn = document.getElementById('openDeleteBookModal');
const closeDeleteBookModalBtn = document.getElementById('closeDeleteBookModal');
const deleteBookList = document.getElementById('deleteBookList');
const deleteBookFormAdmin = document.getElementById('deleteBookFormAdmin');

// Function to open Add Book Modal
openAddBookModalBtn.addEventListener('click', () => {
    addBookModal.style.display = 'flex'; // Use flex to center
});

// Function to close Add Book Modal
closeAddBookModalBtn.addEventListener('click', () => {
    addBookModal.style.display = 'none';
    addBookFormAdmin.reset(); // Clear form on close
});

// Close modals when clicking outside of them
window.addEventListener('click', (event) => {
    if (event.target == addBookModal) {
        addBookModal.style.display = 'none';
        addBookFormAdmin.reset();
    }
    if (event.target == deleteBookModal) {
        deleteBookModal.style.display = 'none';
    }
});

// Handle Add Book form submission
addBookFormAdmin.addEventListener('submit', (event) => {
    event.preventDefault(); // Prevent default form submission

    const bookCover = document.getElementById('bookCoverImage').value;
    const bookTitle = document.getElementById('bookTitle').value;
    const bookAuthor = document.getElementById('bookAuthor').value;
    const bookGradeLevel = document.getElementById('bookGradeLevel').value;
    const bookGenre = document.getElementById('bookGenre').value;
    const bookDescription = document.getElementById('bookDescription').value;
    const bookMetaName = document.getElementById('bookMetaName').value; // New field

    const newBook = {
        bookCover,
        bookTitle,
        author: bookAuthor,
        gradeLevel: bookGradeLevel,
        genre: bookGenre,
        synopsis: bookDescription,
        metaName: bookMetaName.toLowerCase().replace(/\s/g, '-')
    };

    let existingBooks = JSON.parse(localStorage.getItem(BOOKS_STORAGE_KEY)) || [];
    existingBooks.push(newBook);
    localStorage.setItem(BOOKS_STORAGE_KEY, JSON.stringify(existingBooks));

    alert("Book added successfully!");
    addBookModal.style.display = 'none'; // Hide modal
    addBookFormAdmin.reset(); // Clear the form
});

// Function to open Delete Book Modal
openDeleteBookModalBtn.addEventListener('click', () => {
    displayBooksForDeletion();
    deleteBookModal.style.display = 'flex'; // Use flex to center
});

// Function to close Delete Book Modal
closeDeleteBookModalBtn.addEventListener('click', () => {
    deleteBookModal.style.display = 'none';
});

// Function to display books in the delete modal
function displayBooksForDeletion() {
    let existingBooks = JSON.parse(localStorage.getItem(BOOKS_STORAGE_KEY)) || [];
    deleteBookList.innerHTML = ''; // Clear previous list

    if (existingBooks.length === 0) {
        deleteBookList.innerHTML = '<p class="no-books-delete">No books available for deletion.</p>';
        return;
    }

    existingBooks.forEach((book, index) => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <input type="checkbox" id="book-${index}" value="${index}">
            <label for="book-${index}" class="book-info-delete">
                <strong>${book.bookTitle}</strong> by ${book.author} (${book.genre})
            </label>
            <button type="button" class="delete-item-button" data-index="${index}">
                <i class="fas fa-trash-alt"></i>
            </button>
        `;
        deleteBookList.appendChild(listItem);
    });

    // Add event listeners for individual delete buttons
    document.querySelectorAll('.delete-item-button').forEach(button => {
        button.addEventListener('click', (event) => {
            const indexToDelete = parseInt(event.currentTarget.dataset.index);
            deleteBookByIndex(indexToDelete);
        });
    });
}

// Function to delete a single book by index
function deleteBookByIndex(indexToDelete) {
    let existingBooks = JSON.parse(localStorage.getItem(BOOKS_STORAGE_KEY)) || [];
    if (confirm(`Are you sure you want to delete "${existingBooks[indexToDelete].bookTitle}"?`)) {
        existingBooks.splice(indexToDelete, 1); // Remove the book
        localStorage.setItem(BOOKS_STORAGE_KEY, JSON.stringify(existingBooks));
        displayBooksForDeletion(); // Refresh the list
    }
}


// Handle Delete Selected Books form submission
deleteBookFormAdmin.addEventListener('submit', (event) => {
    event.preventDefault();

    const checkboxes = deleteBookList.querySelectorAll('input[type="checkbox"]:checked');
    const indexesToDelete = Array.from(checkboxes).map(checkbox => parseInt(checkbox.value));

    if (indexesToDelete.length === 0) {
        alert("Please select at least one book to delete.");
        return;
    }

    if (confirm(`Are you sure you want to delete ${indexesToDelete.length} selected book(s)?`)) {
        let existingBooks = JSON.parse(localStorage.getItem(BOOKS_STORAGE_KEY)) || [];
        indexesToDelete.sort((a, b) => b - a);

        indexesToDelete.forEach(index => {
            existingBooks.splice(index, 1);
        });

        localStorage.setItem(BOOKS_STORAGE_KEY, JSON.stringify(existingBooks));
        alert("Selected book(s) deleted successfully!");
        deleteBookModal.style.display = 'none'; // Close modal
    }
});
