# 📚 My Library

A full-stack web application for managing your personal book collection.
Users can add books, rate them, write comments, search their library, and organize books in a clean and modern interface.

---

## ✨ Features

* 📖 Add new books to your library
* 🔍 Search books by title or author
* ⭐ Rate books from 1 to 5 stars
* 💬 Add, edit, and delete comments for each book
* 🔤 Sort books by:

  * Recently Added
  * Rating
  * Alphabetically (A-Z)
* 🖼️ Display book covers automatically using the Open Library Covers API
* 📱 Responsive modern UI

---

## 🛠️ Built With

### Frontend

* HTML5
* CSS3
* EJS

### Backend

* Node.js
* Express.js

### Database

* PostgreSQL

### Other Technologies

* Axios
* Body Parser
* Dotenv

---

## 🚀 Installation

### 1. Clone the repository

```bash
git clone https://github.com/jobouri97/my-library.git
cd my-library
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create a PostgreSQL database

Create a database named: my_library

### 4. Create the tables

#### Books table

```sql
CREATE TABLE books (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    cover_id INTEGER,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5)
);
```

#### Comments table

```sql
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
    comment TEXT NOT NULL
);
```

---

### 5. Create a `.env` file

```env
DATABASE_URL=postgresql://username:password@localhost:5432/my_library
```

Example:

```env
DATABASE_URL=postgresql://postgres:123456@localhost:5432/my_library
```

---

### 6. Start the application

```bash
node index.js
```

The application will run on: http://localhost:3000

---

## 📂 Project Structure

```text
my-library/
│
├── public/
│   └── styles/
│       └── styles.css
│
├── views/
│   ├── partials/
│   │   ├── header.ejs
│   │   └── footer.ejs
│   │
│   ├── index.ejs
│   ├── addBook.ejs
│   └── comments.ejs
│
├── index.js
├── package.json
├── package-lock.json
├── .env
├── .gitignore
└── README.md
```

---

## 🌐 APIs Used

### Open Library Covers API

Book covers are fetched from: https://covers.openlibrary.org/

Example: https://covers.openlibrary.org/b/id/240727-M.jpg

---

## 🎯 Future Improvements

* User authentication
* User accounts and personal libraries
* Favorite books list
* Pagination
* AJAX for rating without page refresh
* Dark mode
* Book categories
* Reading status:

  * Want to Read
  * Reading
  * Finished

---

## 🧠 What I Learned

This project helped me practice:

* Node.js
* Express.js
* PostgreSQL
* SQL relationships and foreign keys
* CRUD operations
* EJS templating
* REST principles
* Environment variables
* Deployment and database hosting

---

## 🚀 Deployment

This project can be deployed using:

* [Render](https://render.com)
* [Supabase](https://supabase.com)

---

## 👨‍💻 Author

**Ali Al-Jobouri**

* GitHub: [jobouri97 GitHub Profile](https://github.com/jobouri97)
* LinkedIn: [Ali Al-Jobouri LinkedIn Profile](https://www.linkedin.com/in/ali-al-jobouri-09bbb53bb)

---

⭐ If you like this project, consider giving it a star on GitHub!
