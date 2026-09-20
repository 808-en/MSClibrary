function doGet(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Library Catalog");
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
    }
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
    }
    var headers = data[0];
    var books = [];
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var book = { row: i + 1 };
      for (var j = 0; j < headers.length; j++) {
        book[headers[j]] = row[j];
      }
      books.push(book);
    }
    return ContentService.createTextOutput(JSON.stringify(books)).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var postData = JSON.parse(e.postData.contents);
    var action = postData.action || postData.type;

    if (action === "Borrow") {
      var sheet = ss.getSheetByName("Borrow Requests") || ss.insertSheet("Borrow Requests");
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(["Timestamp", "Request ID", "ISBN", "Title", "Author", "Name", "Room Number", "Signature", "Returned"]);
      }
      sheet.appendRow([
        postData.timestamp ? new Date(postData.timestamp) : new Date(),
        postData.requestId || postData.requestID,
        postData.isbn,
        postData.title,
        postData.author,
        postData.name,
        postData.roomNumber,
        postData.signature,
        "N"
      ]);
      return ContentService.createTextOutput(JSON.stringify({ result: "success" })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "Return") {
      var sheet = ss.getSheetByName("Return Requests") || ss.insertSheet("Return Requests");
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(["Timestamp", "Request ID", "ISBN", "Title", "Author", "Name", "Room Number", "Return Method", "Returned"]);
      }
      sheet.appendRow([
        postData.timestamp ? new Date(postData.timestamp) : new Date(),
        postData.requestId || postData.requestID,
        postData.isbn,
        postData.title,
        postData.author,
        postData.name,
        postData.roomNumber,
        postData.returnMethod,
        "Y"
      ]);
      
      var borrowSheet = ss.getSheetByName("Borrow Requests");
      if (borrowSheet) {
        var bData = borrowSheet.getDataRange().getValues();
        for (var i = 1; i < bData.length; i++) {
          if (String(bData[i][1]).trim() === String(postData.requestId || postData.requestID).trim()) {
            borrowSheet.getRange(i + 1, 9).setValue("Y");
            break;
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ result: "success" })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "markReturned") {
      var borrowSheet = ss.getSheetByName("Borrow Requests");
      if (borrowSheet) {
        var bData = borrowSheet.getDataRange().getValues();
        for (var i = 1; i < bData.length; i++) {
          if (String(bData[i][1]).trim() === String(postData.requestId || postData.requestID).trim()) {
            borrowSheet.getRange(i + 1, 9).setValue("Y");
            break;
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ result: "success" })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "addBook") {
      var sheet = ss.getSheetByName("Library Catalog") || ss.insertSheet("Library Catalog");
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(["ISBN", "Title", "Author", "Genre", "Grade Level", "MSC+ Grade Level", "Synopsis", "Cover Image Link", "Quantity"]);
      }
      sheet.appendRow([
        postData.isbn,
        postData.title,
        postData.author,
        postData.genre,
        postData.grade,
        postData.msc,
        postData.synopsis,
        postData.cover,
        postData.quantity || 1
      ]);
      return ContentService.createTextOutput(JSON.stringify({ result: "success" })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "addMass") {
      var sheet = ss.getSheetByName("Library Catalog") || ss.insertSheet("Library Catalog");
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(["ISBN", "Title", "Author", "Genre", "Grade Level", "MSC+ Grade Level", "Synopsis", "Cover Image Link", "Quantity"]);
      }
      var books = postData.books || [];
      for (var k = 0; k < books.length; k++) {
        var b = books[k];
        sheet.appendRow([
          b.isbn,
          b.title,
          b.author,
          b.genre || "",
          b.grade || "",
          b.msc || "",
          b.synopsis || "",
          b.cover || "",
          b.quantity || 1
        ]);
      }
      return ContentService.createTextOutput(JSON.stringify({ result: "success" })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "deleteSelected") {
      var sheet = ss.getSheetByName("Library Catalog");
      if (sheet) {
        var rows = postData.rows || [];
        rows.sort(function(a, b) { return b - a; });
        for (var r = 0; r < rows.length; r++) {
          sheet.deleteRow(rows[r]);
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ result: "success" })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "deleteAll") {
      var sheet = ss.getSheetByName("Library Catalog");
      if (sheet) {
        sheet.clear();
        sheet.appendRow(["ISBN", "Title", "Author", "Genre", "Grade Level", "MSC+ Grade Level", "Synopsis", "Cover Image Link", "Quantity"]);
      }
      return ContentService.createTextOutput(JSON.stringify({ result: "success" })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "updateBotm") {
      var sheet = ss.getSheetByName("BOTM") || ss.insertSheet("BOTM");
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(["Month", "Title", "Author", "ISBN", "Timestamp"]);
      }
      sheet.appendRow([
        postData.month,
        postData.title,
        postData.author,
        postData.isbn || "",
        postData.timestamp ? new Date(postData.timestamp) : new Date()
      ]);
      return ContentService.createTextOutput(JSON.stringify({ result: "success" })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "updateChangelog") {
      var sheet = ss.getSheetByName("Changelog") || ss.insertSheet("Changelog");
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(["Version", "Message", "Timestamp"]);
      }
      sheet.appendRow([
        postData.version,
        postData.message,
        postData.timestamp ? new Date(postData.timestamp) : new Date()
      ]);
      return ContentService.createTextOutput(JSON.stringify({ result: "success" })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ result: "error", message: "Unknown action" })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ result: "error", error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
