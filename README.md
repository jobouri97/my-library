# 📚 My Library

A full-stack web application for managing your personal book collection.

Users can securely sign in with their Google account, search for books using the Open Library API, add books to their library, rate them, and leave comments. Each comment is linked to its author, and users can edit or delete only their own comments.

---

# 🌐 Live Demo

**Demo:** https://jobouri-library.onrender.com

---

# ✨ Features

* 🔐 Secure Google Sign-In (OAuth 2.0)
* 📖 Add books to your personal library
* 🔍 Search books using the Open Library API
* ⭐ Rate books from 1 to 5 stars
* 💬 Add comments to books
* ✏️ Edit your own comments
* 🗑️ Delete your own comments
* 👤 Session-based authentication with Passport.js
* 🔤 Sort books by:

  * Recently Added
  * Rating
  * Alphabetically (A–Z)
* 🖼️ Automatically display book covers
* 📱 Fully responsive modern interface

---

# 🛠️ Built With

## Frontend

* HTML5
* CSS3
* EJS

## Backend

* Node.js
* Express.js

## Authentication

* Passport.js
* Google OAuth 2.0
* Express Session

## Database

* PostgreSQL

## Other Technologies

* Axios
* Dotenv

---

# 🚀 Installation

## 1. Clone the repository

```bash
git clone https://github.com/jobouri97/my-library.git
cd my-library
```

---

## 2. Install dependencies

```bash
npm install
```

---

## 3. Create a PostgreSQL database

Create a database named:

```text
my_library
```

---

## 4. Create the tables

### Users

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL
);
```

### Books

```sql
CREATE TABLE books (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    cover_id INTEGER,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5)
);
```

### Comments

```sql
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    comment TEXT NOT NULL
);
```

---

## 5. Create a `.env` file

```env
DATABASE_URL=your_database_url

SECRET=your_session_secret

GOOGLE_CLIENT_ID=your_google_client_id

GOOGLE_CLIENT_SECRET=your_google_client_secret

GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/index
```

Example:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/my_library
SECRET=mySuperSecretKey
GOOGLE_CLIENT_ID=xxxxxxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxxxxxxxxxxxxx
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/index
```

---

## 6. Configure Google OAuth

Create OAuth credentials in the Google Cloud Console.

Authorized Redirect URI:

```
http://localhost:3000/auth/google/index
```

If deploying to Render, also add:

```
https://your-app-name.onrender.com/auth/google/index
```

and update the `GOOGLE_CALLBACK_URL` environment variable accordingly.

---

## 7. Start the application

```bash
npm start
```

or

```bash
node index.js
```

The application will be available at:

```
http://localhost:3000
```

---

# 📂 Project Structure

```text
my-library/
│
├── public/
│   └── styles/
│       ├── styles.css
│       ├── auth.css
│       └── comments.css
│
├── views/
│   ├── partials/
│   │   └── header.ejs
│   │
│   ├── auth.ejs
│   ├── comments.ejs
│   ├── index.ejs
│   └── new.ejs
│
├── index.js
├── package.json
├── package-lock.json
├── .env
├── .gitignore
└── README.md
```

---

# 🌐 APIs Used

## Open Library Search API

Used to search books by title.

https://openlibrary.org/search.json

---

## Open Library Covers API

Used to retrieve book cover images.

Example:

```
https://covers.openlibrary.org/b/id/240727-M.jpg
```

---

## Google OAuth 2.0

Used for secure user authentication.

---

# 🧠 What I Learned

This project helped me practice:

* Node.js
* Express.js
* PostgreSQL
* SQL relationships and foreign keys
* CRUD operations
* RESTful routing
* Passport.js authentication
* Google OAuth 2.0
* Session management
* EJS templating
* Environment variables
* Cloud database integration with Supabase
* Deployment with Render

---

# 🎯 Future Improvements

* Personal libraries for each user
* Favorite books list
* Reading status

  * Want to Read
  * Reading
  * Finished
* Book categories
* AJAX interactions without page refresh
* Pagination
* Dark mode
* User profile page

---

# 🚀 Deployment

This project is deployed using:

* Render
* Supabase PostgreSQL

---

# 👨‍💻 Author

**Ali Al-Jobouri**

GitHub: https://github.com/jobouri97

LinkedIn: https://www.linkedin.com/in/ali-al-jobouri-09bbb53bb

---

If you like this project, consider giving it a ⭐ on GitHub!
