function agyTest() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.prompt('Please enter your name:');

  if (response.getSelectedButton() == ui.Button.OK) {
    var name = response.getResponseText();
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var cell = sheet.getActiveCell();
    cell.setValue('Hello ' + name);
  }
}
