# agyTest

A Google Apps Script project managed locally using **Antigravity** and **clasp**, with version control via **GitHub**.

## Project Setup
- **Environment**: Developed in Antigravity.
- **Sync**: Powered by `@google/clasp` for local-to-cloud synchronization.
- **Security**: Sensitive files like `.clasprc.json` and `.clasp.json` are ignored via `.gitignore` to prevent credential leaks.

## Development Workflow
This project follows a professional branching strategy:
1. **Branch**: Create a feature branch (`git checkout -b feature-name`).
2. **Code**: Use Gemini AI to generate or refine Google Apps Script logic.
3. **Test**: Push to the Apps Script development environment (`clasp push`).
4. **Merge**: Once verified, merge into `main`.
5. **Deploy**: Push the final version to GitHub (`git push`) and Google Cloud (`clasp push`).

## Useful Commands
- `clasp push`: Upload local changes to Google Script editor.
- `clasp pull`: Fetch the latest code from the Google Script editor.