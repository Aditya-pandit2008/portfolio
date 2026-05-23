# Portfolio Backend

This project now includes a Flask backend for the contact form, using SQLite to store submissions.

## Setup

1. Open a terminal in this folder.
2. Install dependencies:

```bash
c:/Users/Aditya/OneDrive/Documents/Desktop/New folder/.venv/Scripts/python.exe -m pip install -r requirements.txt
```

3. Run the backend server:

```bash
c:/Users/Aditya/OneDrive/Documents/Desktop/New folder/.venv/Scripts/python.exe app.py
```

4. Open the site in a browser:

```text
http://127.0.0.1:5000/
```

## Contact form

- The contact form now sends submissions to `/api/contact`.
- Submissions are saved in `contact.db`.
- View stored messages at:

```text
http://127.0.0.1:5000/submissions
```

## Notes

- If you want to deploy this backend, keep `contact.db` writable by the server.
- The frontend files are served statically by Flask from the same folder.
