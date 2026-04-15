require("dotenv").config();

const express = require("express");
const cors = require("cors");
const session = require("express-session");

const path = require("path");

const { sunnifyRouter } = require("./routes/sunnifyRouter.js");

const app = express();
const client = path.join(__dirname, "..", "client");

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(
    session({
        secret: process.env.SESSION_SECRET || "d8f4a7c9e1b3f6a2d0c9b7e5f8a1c3d2",
        resave: false,
        saveUninitialized: false,
        rolling: true,
        cookie: {
            maxAge: 1000 * 60 * 60 * 1, // ms * s * min * hr * d * etc...
            httpOnly: true,
            secure: false,
            sameSite: "lax",
        },
    }),
);

app.use(express.static(client));

app.get("/", (req, res) => {
    res.sendFile(path.join(client, "main.html"));
});

app.get("/register", (req, res) => {
    res.sendFile(path.join(client, "register.html"));
});

app.get("/login", (req, res) => {
    res.sendFile(path.join(client, "login.html"));
});

app.get("/post", (req, res) => {
    res.sendFile(path.join(client, "post.html"));
});

app.get("/createpost", (req, res) => {
    res.sendFile(path.join(client, "createpost.html"));
});

app.get("/profile", (req, res) => {
    res.sendFile(path.join(client, "profile.html"));
});

//examples

app.get("/examples/search", (req, res) => {
    res.sendFile(path.join(client, "page-examples", "searchpage-example.html"));
});

app.get("/examples/profile", (req, res) => {
    res.sendFile(path.join(client, "page-examples", "profilepage-example.html"));
});

app.get("/examples/post", (req, res) => {
    res.sendFile(path.join(client, "page-examples", "postpage-example.html"));
});

app.get("/examples/search", (req, res) => {
    res.sendFile(path.join(client, "page-examples", "searchpage-example.html"));
});

app.get("/examples/chat", (req, res) => {
    res.sendFile(path.join(client, "page-examples", "chatpage-example.html"));
});

app.get("/components/carousel", (req, res) => {
    res.sendFile(path.join(client, "Reusable-HTML/components", "carousel.html"));
});

app.use("/", sunnifyRouter);

const port = process.env.BACKEND_PORT;

app.listen(port, () => {
    console.log(`Running backend on localhost:${port}`);
});
