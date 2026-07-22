const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRtBuoQR6ILdtAoCm6yNbDQVtEnWzgg4RJ9DPoqy8pewREj77wwojp_URuetdQW_9_Hyc2-91iQ9uOM/pub?output=csv';
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

  // If valid: do nothing (stay on admin page)
}

window.addEventListener("DOMContentLoaded", loggedincheck);


async function fetchData() {
  try {
    const response = await fetch(sheetUrl);

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const textData = await response.text();
    const rows = textData.split('\n').map(row => row.split(','));

    let tableHtml = '<table>';

    tableHtml += '<thead><tr>';
    rows[0].forEach(header => {
      tableHtml += `<th>${header}</th>`;
    });
    tableHtml += '</tr></thead>';

    tableHtml += '<tbody>';
    rows.slice(1).forEach(rowData => {
      tableHtml += '<tr>';
      rowData.forEach(cell => {
        tableHtml += `<td>${cell}</td>`;
      });
      tableHtml += '</tr>';
    });
    tableHtml += '</tbody>';

    tableHtml += '</table>';

    dataContainer.innerHTML = tableHtml;
  } catch (error) {
    console.error('Error fetching or parsing data:', error);
    dataContainer.innerHTML = '<p>Could not load data.</p>';
  }
}

fetchData();
