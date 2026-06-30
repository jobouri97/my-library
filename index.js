import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
    host: "localhost",
    port: 5433,
    user: "postgres",
    password: "135264",
    database: "books",
});

db.connect();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.set("view engine", "ejs");

//---------------------------------------------------------------------------------------------------
async function insertBook(title, author, coverId) {

    console.log(`${title}
        ${author}
        ${coverId}`);
    const result = await db.query(
        "INSERT INTO books (title, author, cover_id) VALUES ($1, $2, $3) RETURNING *",
        [title, author, coverId]
    );

    return result.rows[0];
}

async function getBooks(sort = "id") {
    let query = "SELECT * FROM books";

    if (sort === "title") {
        query += " ORDER BY title";
    } else if (sort === "rating") {
        query += " ORDER BY rating DESC NULLS LAST";
    } else {
        query += " ORDER BY id DESC";
    }

    console.log(query);

    const result = await db.query(query);
    return result.rows;
}

//---------------------------------------------------------------------------------------------------

// Routes
app.get("/", async (req, res) => {
    const sort = req.query.sort || "recent";

    const books = await getBooks(sort);

    res.render("index.ejs", {
        currentPage: "books",
        books,
        sort
    });
});

app.get("/new", (req, res) => {
    res.render("new.ejs", { currentPage: "new", });
});

app.post("/search", async (req, res) => {
    try {
        const query = req.body.query;

        const response = await axios.get(
            "https://openlibrary.org/search.json",
            {
                params: {
                    title: query,
                },
                timeout: 10000,
            }
        );

        const books = response.data.docs.filter(
            book => book.cover_i
        );

        // Get all saved cover ids
        const result = await db.query(
            "SELECT cover_id FROM books"
        );

        const savedCoverIds = result.rows.map(
            row => row.cover_id
        );

        // Add isAdded property
        books.forEach(book => {
            book.isAdded = savedCoverIds.includes(book.cover_i);
        });

        res.render("new.ejs", {
            currentPage: "new",
            books
        });
    } catch (err) {
        res.render("new.ejs", {
            books: [],
            currentPage: "new",

            error: "Could not connect to Open Library. Try again later.",
        });
    }
});

app.post("/add", async (req, res) => {
    try {
        const { title, author, coverId } = req.body;

        await insertBook(title, author, coverId);
        res.redirect("/");


    } catch (err) {
        console.error(err);
        res.status(500).send("Could not save book.");
    }
});

app.post("/rate/:id", async (req, res) => {
    const id = req.params.id;
    const rating = req.body.rating;

    await db.query(
        "UPDATE books SET rating = $1 WHERE id = $2",
        [rating, id]
    );

    res.redirect("/");
});

app.get("/comments/:id", async (req, res) => {
    const bookId = req.params.id;

    const commentsResult = await db.query(
        "SELECT * FROM comments WHERE book_id = $1 ORDER BY id",
        [bookId]
    );

    const bookResult = await db.query(
        "SELECT * FROM books WHERE id = $1",
        [bookId]
    );

    console.log(bookResult.rows[0]);
    res.render("comments.ejs", {
        book: bookResult.rows[0],
        comments: commentsResult.rows,
    });
});

app.post("/comments/:id/edit", async (req, res) => {
    const commentId = req.params.id;
    const content = req.body.content;
    const bookId = req.body.bookId;

    await db.query(
        "UPDATE comments SET comment = $1 WHERE id = $2",
        [content, commentId]
    );

    res.redirect(`/comments/${bookId}`);
});

app.post("/books/:id/comments", async (req, res) => {
    const bookId = req.params.id;
    const content = req.body.content;

    await db.query(
        "INSERT INTO comments (book_id, comment) VALUES ($1, $2)",
        [bookId, content]
    );

    res.redirect(`/comments/${bookId}`);
});

app.post("/comments/:id/delete", async (req, res) => {
    const commentId = req.params.id;
    const bookId = req.body.bookId;

    await db.query(
        "DELETE FROM comments WHERE id = $1",
        [commentId]
    );

    res.redirect(`/comments/${bookId}`);
});

app.post("/delete/:id", async (req, res) => {
    const bookId = req.params.id;

    await db.query(
        "DELETE FROM comments WHERE book_id = $1",
        [bookId]
    );

    await db.query(
        "DELETE FROM books WHERE id = $1",
        [bookId]
    );

    res.redirect("/");
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});