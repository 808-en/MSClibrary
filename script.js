
  //Copyright Atticus Herr 2024
  //Special Thanks: w3schools.com for outlining of some JS syntax on these webpages

document.addEventListener('DOMContentLoaded', function() {
  const openBorrowFormLink = document.getElementById('openBorrowForm');
  const borrowFormOverlay = document.getElementById('borrowFormOverlay');
  const closeBorrowFormButton = document.getElementById('closeBorrowForm');
  const cancelBorrowFormButton = document.getElementById('cancelBorrowForm');
  const borrowBookForm = document.getElementById('borrowBookForm');

  const openUpdateLogButton = document.getElementById('openUpdateLog');
  const updateLogModal = document.getElementById('updateLogModal');
  const closeUpdateLogButton = document.getElementById('closeUpdateLog');
  const updateLogContent = document.getElementById('updateLogContent');


  if (borrowFormOverlay) {
    borrowFormOverlay.style.display = 'none';
  }

  if (openBorrowFormLink && borrowFormOverlay) {
    openBorrowFormLink.addEventListener('click', function(event) {
      event.preventDefault();
      borrowFormOverlay.style.display = 'flex';

      if (updateLogModal) {
        updateLogModal.style.display = 'none';
      }

      if (signupModal) {
        signupModal.style.display = 'none';
      }
    });
  }

  const closeForm = () => {
    if (borrowFormOverlay) {
      borrowFormOverlay.style.display = 'none';
      if (borrowBookForm) {
        borrowBookForm.reset();
      }
    }
  };

  if (closeBorrowFormButton) {
    closeBorrowFormButton.addEventListener('click', closeForm);
  }

  if (cancelBorrowFormButton) {
    cancelBorrowFormButton.addEventListener('click', closeForm);
  }

  if (borrowBookForm) {
    borrowBookForm.addEventListener('submit', function(event) {
      event.preventDefault();

      const bookName = document.getElementById('bookName').value;
      const genre = document.getElementById('genre').value;
      const borrowerName = document.getElementById('borrowerName').value;
      const borrowDuration = document.getElementById('borrowDuration').value;
      const signature = document.getElementById('signature').value;
      const timestamp = new Date().getTime();

      const newRequest = {
        bookName: bookName,
        genre: genre,
        borrowerName: borrowerName,
        borrowDuration: borrowDuration,
        signature: signature,
        timestamp: timestamp,
        done: false,
        delivered: false
      };

      const storedRequests = JSON.parse(localStorage.getItem('borrowRequests')) || [];
      storedRequests.push(newRequest);
      localStorage.setItem('borrowRequests', JSON.stringify(storedRequests));

      alert('Borrow request submitted!');
      closeForm();
    });
  }

});

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

  alertBox.style.display = 'block';
  overlay.style.display = 'block';

  okButton.onclick = function() {
    shouldNavigate = true;
    alertBox.style.display = 'none';
    overlay.style.display = 'none';
    onlineBooksLink.click();
    window.location.href="onlineBooks.html";
  };

  closeButton.onclick = function() {
    alertBox.style.display = 'none';
    overlay.style.display = 'none';
  };

  getBookButton.onclick = function() {
    window.location.href = 'library.html';
  };

  return false;
}