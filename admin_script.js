const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRtBuoQR6ILdtAoCm6yNbDQVtEnWzgg4RJ9DPoqy8pewREj77wwojp_URuetdQW_9_Hyc2-91iQ9uOM/pub?output=csv';
const deleteSheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTDCoxrGYZskgPlRCATngUMAaCUZ_thcbpB3iOMVyECsv46MiFh9zge2oybZ6mzcugBnsC-HHIj3bUT/pub?output=csv';

const dataContainer = document.getElementById('data-container');
const TOKEN_VALUE = "loggedInIdentifierRNBN480H39A=";

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

window.addEventListener("DOMContentLoaded", () => {
  loggedincheck();
  setupModalHandlers();
});

function logout() {
  localStorage.removeItem("loggedInState");
  localStorage.removeItem("loggedInExpiry");
  window.location.href = "index.html";
}

async function fetchData() {
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

    dataContainer.innerHTML = tableHtml;
  } catch (error) {
    console.error('Error fetching data:', error);
    dataContainer.innerHTML = '<p>Could not load data.</p>';
  }
}

fetchData();

async function fetchDeleteChartData() {
  const container = document.getElementById('deleteChartContainer');
  container.innerHTML = '<p>Loading collection data...</p>';

  try {
    const response = await fetch(deleteSheetUrl);
    if (!response.ok) throw new Error('Network response was not ok');

    const textData = await response.text();
    const rows = textData.split('\n').map(row => row.split(','));

    let tableHtml = '<table><thead><tr>';
    rows[0].forEach(header => { tableHtml += `<th>${header}</th>`; });
    tableHtml += '</tr></thead><tbody>';

    rows.slice(1).forEach(rowData => {
      if (rowData.join('').trim() === '') return;
      tableHtml += '<tr>';
      rowData.forEach(cell => { tableHtml += `<td>${cell}</td>`; });
      tableHtml += '</tr>';
    });
    tableHtml += '</tbody></table>';

    container.innerHTML = tableHtml;
  } catch (error) {
    console.error('Error fetching delete CSV:', error);
    container.innerHTML = '<p>Could not load collection data.</p>';
  }
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
  document.getElementById('openAddBookModal').addEventListener('click', () => {
    openModal('addBookModal');
  });

  document.getElementById('openDeleteBookModal').addEventListener('click', () => {
    openModal('deleteBookModal');
    fetchDeleteChartData();
  });

  document.getElementById('openUpdateBotmModal').addEventListener('click', () => {
    openModal('updateBotmModal');
  });

  window.addEventListener('click', (event) => {
    if (event.target.classList.contains('modal')) {
      event.target.style.display = 'none';
    }
  });
}
