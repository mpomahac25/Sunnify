const express = require("express");
const { query } = require("../helpers/db.js");
const { encryptPassword, verifyPassword } = require("../helpers/pwEncrypt.js");

const sunnifyRouter = express.Router();

// Middleware stuff
const isUserAuthenticated = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated!" });
    }
    next();
};

const preventAuthAccess = (req, res, next) => {
    if (req.session.userId) {
        return res.status(403).json({ error: "Already logged in" });
    }
    next();
};


// Routes handling
sunnifyRouter.post("/register", preventAuthAccess, async (req, res) => {
    try {
        // Check if user already exists
        let result = await query("SELECT * FROM users");
        let rows = result.rows ? result.rows : [];

        if (rows.some(row => row.username === req.body.username)) {
            res.status(409).json({ error: "Username already exists!" });
            return;
        }
        else if (rows.some(row => row.email === req.body.email)) {
            res.status(409).json({ error: "Email already in use!" });
            return;
        }

        // TODO: Additional validation of username and email (e.g. profanity filtering)

        // Encrypt password
        const pwEncrypted = await encryptPassword(req.body.password);

        // Create new user in database
        result = await query("INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id",
            [
                req.body.username,
                req.body.email,
                pwEncrypted
            ]);
        res.status(200).json({ id: result.rows[0].id });
    } catch (error) {
        errorResponse(res, error);
    }
});

sunnifyRouter.post("/login", preventAuthAccess, async (req, res) => {
    try {
        const loginIdentifier = req.body.usernameOrEmail;

        let result;

        // Check email first
        if (loginIdentifier.includes("@")) {
            result = await query("SELECT * FROM users WHERE email = $1", [loginIdentifier]);
        }
        // If not email, check by username
        else {
            result = await query("SELECT * FROM users WHERE username = $1", [loginIdentifier]);
        }

        if (result.rows.length === 0) {
            res.status(401).json({ error: "Invalid username/email or password!" });
            return;
        }

        // If we're here, a user was found! Check the password from request vs hashed password
        const user = result.rows[0];
        const passwordOk = await verifyPassword(req.body.password, user.password_hash);

        if (!passwordOk) {
            res.status(401).json({ error: "Invalid username/email or password!" });
            return;
        }

        req.session.userId = user.id;
        req.session.username = user.username;

        res.status(200).json({ message: "Login success!", id: user.id });

        // Update last_login in database
        result = await query("UPDATE users SET last_login = NOW() WHERE id = $1", [user.id]);
    } catch (error) {
        errorResponse(res, error);
    }
});

sunnifyRouter.post("/logout", (req, res) => {
    req.session.destroy(err => {
        if (err) errorResponse(res, "Logout failed");
        res.clearCookie("connect.sid");
        res.status(200).json({ message: "Logout success" });
    });
});

sunnifyRouter.get("/check-session", (req, res) => {
    if (req.session.userId) res.status(200).json({ loggedIn: true, userId: req.session.userId });
    else res.status(200).json({ loggedIn: false, userId: null });
});

// post-related API

// create post
sunnifyRouter.post("/posts", isUserAuthenticated, async (req, res) => {
    try {
        const { title, description, price, location, category, condition, status } = req.body;
        
        // if elements epmty
        if (!title || !description || !location || !category || !condition){
            return res.status(400).json({error: "Missing required fields"});
        }

        // price = number
        const parsedPrice = Number(price);

        //if price is fucked
        if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
            return res.status(400).json({ error: "Invalid price"});
        }

        // creating new post in db
        const result = await query(
            `INSERT INTO posts (title, description, price, location, category, condition, status, user_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8
            RETURNING id)`,
            [title, description, parsedPrice, location, category, condition, status || "available", req.session.userId]
        );
        result.status(201).json({ id: result.rows[0].id });
    }catch (error){
        errorResponse(res, error)
    }
})

// GET exact post
sunnifyRouter.get("/posts/:id", async (req, res) => {
    try{
        // get data
        const id = parseInt(req.params.id);
        
        // check data
        if (Number.isNaN(id)) {
            return res.status(400).json({ error: "Invalid post id" });
        }

        const result = await query("SELECT * FROM posts WHERE id = $1", [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Post not found" });
        }

        res.status(200).json(result.rowss[0]);
    } catch (error){
        errorResponse(res, error)
    }
})

//sunnifyRouter.get("/", async (req, res) => {
//    try {
//        const result = await query("SELECT * FROM task");
//        const rows = result.rows ? result.rows : [];
//        res.status(200).json(rows);
//    } catch (error) {
//        errorResponse(res, error);
//    }
//});

//sunnifyRouter.delete("/delete/:id", async (req, res) => {
//    const id = parseInt(req.params.id);

//    try {
//        const result = await query("DELETE FROM task WHERE id = $1", [id]);
//        res.status(200).json({ id: id });
//    } catch (error) {
//        errorResponse(res, error);
//    }
//})

const errorResponse = (res, error) => {
    console.log(error);
    res.statusMessage = error;
    res.status(500).json({ error: error });
};

module.exports = { sunnifyRouter };
