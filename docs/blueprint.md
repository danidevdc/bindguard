# **App Name**: RxLocal Inventory

## Core Features:

- User Authentication: User authentication with username and password for secure access to the application within the local network.
- Main Navigation: Two primary buttons: 'Scan Medicine' and 'Inventory View'.
- QR Code Scan & Entry: Opens the device's camera to scan the QR code on the medicine box.  After scanning, displays fields for date (pre-filled with current date, but editable), prescription number (manual input), and quantity dispensed (manual input).
- Data Logging: Data from QR scan and manual entry is recorded into a Google Sheet (or local Excel file if Google Sheets is not available) in real-time. All fields (date, Rx number, quantity, medicine details from QR) are captured.
- Inventory View: Displays a digital 'Bind Card' view for each medicine, showing a history of dispensing (date, Rx number, quantity) and the current stock level.  This can be viewed from both mobile and PC.
- Stock Adjustment Mode: In 'Scan Medicine' mode, the app can either deduct from the quantity (pharmacy dispensing) or add to the quantity (central stock adding), updating the spreadsheet accordingly.

## Style Guidelines:

- Primary color:  Green (#4CAF50) to represent health and safety.
- Secondary color: Light gray (#EEEEEE) for backgrounds and content separation.
- Accent color: Blue (#2196F3) for interactive elements and important calls to action.
- Use a clear and readable sans-serif font (e.g., Roboto or Open Sans) for all text.
- Use simple and recognizable icons for navigation and actions.  Ensure icons are consistent throughout the application.
- Design a clean, intuitive, and responsive layout that adapts to different screen sizes (mobile, tablet, desktop).