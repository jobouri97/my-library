import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy } from "passport-local";
import GoogleStrategy from "passport-google-oauth2";
import session from "express-session";
import env from "dotenv";

const app = express();
const port = 3000;
const saltRounds = 10;
env.config();

app.use(
    session({
        secret: "TOPSECRET",
        resave: false,
        saveUninitialized: true,
    })
);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(passport.initialize());
app.use(passport.session());

/*const db = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});*/

const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "books",
    password: "135264",
    port: 5433,
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
app.get("/index", async (req, res) => {
    if (req.isAuthenticated()) {
        const sort = req.query.sort || "recent";

        const books = await getBooks(sort);
        console.log("User:", req.user);
        res.render("index.ejs", {
            currentPage: "books",
            books,
            sort,
            username: req.user.name
        });
    } else {
        res.redirect("/auth");
    }
});

app.get("/", async (req, res) => {
    if (req.isAuthenticated()) {
        const sort = req.query.sort || "recent";

        const books = await getBooks(sort);
        console.log("User:", req.user);
        res.render("index.ejs", {
            currentPage: "books",
            books,
            sort,
            username: req.user.name
        });
    } else {
        res.redirect("/auth");
    }
});

app.get("/auth", async (req, res) => {
    res.render("auth");
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
        `SELECT
            comments.id AS id,
            comments.book_id,
            comments.comment,
            users.name AS username
        FROM comments
        JOIN users
            ON comments.user_id = users.id
        WHERE comments.book_id = $1
        ORDER BY comments.id;`,
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
        "INSERT INTO comments (book_id, comment, user_id) VALUES ($1, $2, $3)",
        [bookId, content, req.user.id]
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

//----------------------AUTHENTICATION--------------------\\
app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
  })
);

app.get(
    "/auth/google/index",
    passport.authenticate("google", {
        successRedirect: "/index",
        failureRedirect: "/auth",
    })
);
app.post("/auth",
    passport.authenticate("google", {
        successRedirect: "/index",
        failureRedirect: "/auth",
    })
);

app.get("/logout", (req, res) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

passport.use(
    "google",
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: "http://localhost:3000/auth/google/index",
            userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
        },
        async (accessToken, refreshToken, profile, cb) => {
            try {
                console.log(profile);
                const result = await db.query("SELECT * FROM users WHERE email = $1", [
                    profile.email,
                ]);
                if (result.rows.length === 0) {
                    const newUser = await db.query(
                        "INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING *",
                        [profile.email, "google", profile.displayName]
                    );
                    return cb(null, newUser.rows[0]);
                } else {
                    console.log("Here");
                    console.log(result.rows[0]);
                    return cb(null, result.rows[0]);
                }
            } catch (err) {
                return cb(err);
            }
        }
    )
);

passport.serializeUser((user, cb) => {
    cb(null, user);
});

passport.deserializeUser((user, cb) => {
    cb(null, user);
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});