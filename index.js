import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import passport from "passport";
import GoogleStrategy from "passport-google-oauth2";
import session from "express-session";
import env from "dotenv";
import axios from "axios";

//-------------------TAKING OFF-------------------

const port = process.env.PORT || 3000;
const app = express();
env.config();

app.use(
    session({
        secret: process.env.SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 24 * 60 * 60 * 1000, // 1 day in milliseconds
        },
    })
);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(passport.initialize());
app.use(passport.session());

const db = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
});

db.connect();

app.set("view engine", "ejs");

//-------------------METHODS-------------------

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

//-------------------GET-------------------

app.get("/", async (req, res) => {
    if (req.isAuthenticated()) {
        const sort = req.query.sort || "recent";

        const books = await getBooks(sort);
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

app.get("/index", async (req, res) => {
    if (req.isAuthenticated()) {
        const sort = req.query.sort || "recent";

        const books = await getBooks(sort);
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
    if (req.isAuthenticated()) {
        res.render("new.ejs", { currentPage: "new" });
    } else {
        res.redirect("/auth");
    }
});

//-------------------POST-------------------

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

//add book 
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

//rate book
app.post("/rate/:id", async (req, res) => {
    const id = req.params.id;
    const rating = req.body.rating;

    await db.query(
        "UPDATE books SET rating = $1 WHERE id = $2",
        [rating, id]
    );

    res.redirect("/");
});

//delete a book
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

//get comments for a certain book
app.get("/comments/:id", async (req, res) => {
    const bookId = req.params.id;

    const commentsResult = await db.query(
        `SELECT
            comments.id AS id,
            comments.book_id,
            comments.comment,
            comments.user_id,
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
        currentUser: req.user
    });
});

//edit a comment
app.post("/comments/:id/edit", async (req, res) => {
    const commentId = req.params.id;
    const content = req.body.content;
    const bookId = req.body.bookId;

    await db.query(
        "UPDATE comments SET comment = $1 WHERE id = $2 AND user_id = $3",
        [content, commentId, req.user.id]
    );

    res.redirect(`/comments/${bookId}`);
});

//add a new comment
app.post("/books/:id/comments", async (req, res) => {
    const bookId = req.params.id;
    const content = req.body.content;

    await db.query(
        "INSERT INTO comments (book_id, comment, user_id) VALUES ($1, $2, $3)",
        [bookId, content, req.user.id]
    );

    res.redirect(`/comments/${bookId}`);
});

//delete a comment
app.post("/comments/:id/delete", async (req, res) => {
    const commentId = req.params.id;
    const bookId = req.body.bookId;

    await db.query(
        "DELETE FROM comments WHERE id = $1 AND user_id = $2",
        [commentId, req.user.id]
    );

    res.redirect(`/comments/${bookId}`);
});

//-------------------AUTHENTICATION-------------------
app.get(
    "/auth/google",
    passport.authenticate("google", {
        scope: ["profile", "email"],
    })
);

app.get(
    "/auth/google/index",
    passport.authenticate("google", {
        successRedirect: "/index",
        failureRedirect: "/auth",
    })
);

app.get("/logout", (req, res, next) => {
    req.logout(function (err) {
        if (err) {
            return next(err);
        }

        req.session.destroy(() => {
            res.clearCookie("connect.sid");
            res.redirect("/auth");
        });
    });
});

passport.use(
    "google",
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL,
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
                    return cb(null, result.rows[0]);
                }
            } catch (err) {
                return cb(err);
            }
        }
    )
);

passport.serializeUser((user, cb) => {
    cb(null, user.id);
});

passport.deserializeUser(async (id, cb) => {
    try {
        const result = await db.query("SELECT * FROM users WHERE id = $1", [id]);
        cb(null, result.rows[0]);
    } catch (err) {
        cb(err);
    }
});

app.get("/test-render", (req, res) => {
    res.send("This is the latest code");
});

app.listen(port, () => {
    console.log(`Server running on ${port}.`);
});