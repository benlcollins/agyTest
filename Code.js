/**
 * Adds a custom menu to the active spreadsheet.
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Prompt Manager')
    .addItem('Add New Prompt', 'showAddPromptDialog')
    .addItem('Setup Setup', 'setupSheets') // Helper to init sheets
    .addToUi();
}

/**
 * Ensures the 'Library' and 'History' sheets exist with correct headers.
 */
function setupSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Library Sheet
  var librarySheet = ss.getSheetByName('Library');
  if (!librarySheet) {
    librarySheet = ss.insertSheet('Library');
    // Headers: Prompt ID, Name, Description, Category, Prompt Text, Version, Last Updated, Owner
    librarySheet.appendRow(['Prompt ID', 'Name', 'Description', 'Category', 'Prompt Text', 'Version', 'Last Updated', 'Owner']);
    librarySheet.setFrozenRows(1);
  }

  // 2. History Sheet
  var historySheet = ss.getSheetByName('History');
  if (!historySheet) {
    historySheet = ss.insertSheet('History');
    // Headers: Prompt ID, Name, Version, Prompt Text, Date Archived, Editor
    historySheet.appendRow(['Prompt ID', 'Name', 'Version', 'Prompt Text', 'Date Archived', 'Editor']);
    historySheet.setFrozenRows(1);
  }
}

/**
 * Opens the Add Prompt dialog.
 */
function showAddPromptDialog() {
  var html = HtmlService.createHtmlOutputFromFile('AddPrompt')
    .setWidth(400)
    .setHeight(500);
  SpreadsheetApp.getUi().showModalDialog(html, 'Add New Prompt');
}

/**
 * server-side function called by the HTML form to add a new prompt.
 * @param {Object} formObject - The form data object.
 */
function processForm(formObject) {
  setupSheets(); // Ensure existence before adding

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var librarySheet = ss.getSheetByName('Library');

  // Generate ID
  var lastRow = librarySheet.getLastRow();
  var newId = 'PR-1001'; // Default start

  if (lastRow > 1) {
    // Try to get the last ID and increment
    var lastIdVal = librarySheet.getRange(lastRow, 1).getValue();
    // Assuming format PR-XXXX
    var match = lastIdVal.match(/PR-(\d+)/);
    if (match) {
      var nextNum = parseInt(match[1], 10) + 1;
      newId = 'PR-' + nextNum;
    }
  }

  var version = 1;
  var lastUpdated = new Date();
  var owner = Session.getActiveUser().getEmail();

  // Append to Library
  // Order: Prompt ID, Name, Description, Category, Prompt Text, Version, Last Updated, Owner
  librarySheet.appendRow([
    newId,
    formObject.name,
    formObject.description,
    formObject.category,
    formObject.promptText,
    version,
    lastUpdated,
    owner
  ]);
}

/**
 * onEdit trigger to handle versioning.
 * @param {Object} e - The event object.
 */
function onEdit(e) {
  var sheet = e.range.getSheet();
  if (sheet.getName() !== 'Library') return;

  var range = e.range;
  var col = range.getColumn();
  var row = range.getRow();

  // Only trigger if editing "Prompt Text" (Column E -> 5) and not the header
  if (col !== 5 || row === 1) return;

  // Avoid re-entry if we are updating other columns in this function
  // (Though technically we only update cols 6,7,8 so it shouldn't loop on col 5)

  // Get the row data BEFORE the edit? 
  // onEdit(e) gives e.value (new) and e.oldValue (old).
  // But e.oldValue is only present if the cell was edited manually and had a value.
  // For safety, let's assume we want to archive the *previous* state.
  // However, e.oldValue doesn't give us the ID, Name etc.

  // To get the full row context, we read the spreadsheet. 
  // CRITICAL: The sheet *already* contains the *new* text in Column 5.
  // We need the *previous* text to archive it? 
  // Actually, standard versioning usually means: 
  // 1. Current row has Version N.
  // 2. We change text.
  // 3. We copy the *Current* row (with OLD text) to History? 
  // Wait, if the sheet is already updated, we lost the old text unless we find it in e.oldValue.

  var oldText = e.oldValue;
  var newText = e.value;

  if (!oldText) {
    // If there was no old value, maybe it's a fresh entry or paste-over-empty.
    // If we can't reliably get old text, we might just archive the 'previous version' record 
    // but we can't reconstruct it fully. 
    // Let's proceed only if we have oldText, or maybe we fetch the row
    // and see if we can deduce anything. For a robust system, we really rely on `e.oldValue`.
    // Valid for single cell edits.
    return;
  }

  // Fetch the rest of the row data
  // Headers: Prompt ID(1), Name(2), Description(3), Category(4), Prompt Text(5), Version(6), Last Updated(7), Owner(8)
  var rowValues = sheet.getRange(row, 1, 1, 8).getValues()[0];
  var promptId = rowValues[0];
  var name = rowValues[1];
  // var currentPromptText = rowValues[4]; // This is the NEW text
  var currentVersion = rowValues[5];

  // Archive to History
  // Headers: Prompt ID, Name, Version, Prompt Text, Date Archived, Editor
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var historySheet = ss.getSheetByName('History');
  if (!historySheet) {
    setupSheets();
    historySheet = ss.getSheetByName('History');
  }

  var activeUser = Session.getActiveUser().getEmail();
  var dateArchived = new Date();

  historySheet.appendRow([
    promptId,
    name,
    currentVersion,
    oldText, // The text BEFORE this edit
    dateArchived,
    activeUser
  ]);

  // Update Library Row: Increment Version, Update Timestamp/Owner
  // Version is col 6, Last Updated col 7, Owner col 8

  var newVersion = (typeof currentVersion === 'number' ? currentVersion : 0) + 1;

  sheet.getRange(row, 6).setValue(newVersion);
  sheet.getRange(row, 7).setValue(new Date());
  sheet.getRange(row, 8).setValue(activeUser);
}

