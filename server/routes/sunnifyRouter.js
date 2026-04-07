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

        if (rows.some((row) => row.username === req.body.username)) {
            res.status(409).json({ error: "Username already exists!" });
            return;
        } else if (rows.some((row) => row.email === req.body.email)) {
            res.status(409).json({ error: "Email already in use!" });
            return;
        }

        // TODO: Additional validation of username and email (e.g. profanity filtering)

        // Encrypt password
        const pwEncrypted = await encryptPassword(req.body.password);

        // Create new user in database
        result = await query(
            "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id",
            [req.body.username, req.body.email, pwEncrypted],
        );
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
    req.session.destroy((err) => {
        if (err) errorResponse(res, "Logout failed");
        res.clearCookie("connect.sid");
        res.status(200).json({ message: "Logout success" });
    });
});

sunnifyRouter.get("/check-session", (req, res) => {
    if (req.session.userId) res.status(200).json({ loggedIn: true, userId: req.session.userId });
    else res.status(200).json({ loggedIn: false, userId: null });
});

sunnifyRouter.get("/locations", async (req, res) => {
    // Fetch countries, regions, and cities lists
    let result = await query("SELECT id, name FROM countries ORDER BY name ASC");
    const countries = result.rows;

    result = await query("SELECT id, name, country_id FROM regions ORDER BY name ASC");
    const regions = result.rows;

    result = await query("SELECT id, name, region_id FROM cities ORDER BY name ASC");
    const cities = result.rows;

    // Build structured JSON
    const locationData = countries.map((country) => ({
        id: country.id,
        country: country.name,
        regions: regions
            .filter((region) => region.country_id === country.id)
            .map((region) => ({
                id: region.id,
                region: region.name,
                cities: cities
                    .filter((city) => city.region_id === region.id)
                    .map((city) => ({
                        id: city.id,
                        city: city.name,
                    })),
            })),
    }));

    res.status(200).json(locationData);
});

// post-related API

// create post
sunnifyRouter.post("/posts", isUserAuthenticated, async (req, res) => {
    try {
        const { title, description, price, location, category, condition, status } = req.body;

        if (!title || !description || !location || !category || !condition) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // price => number
        const parsedPrice = Number(price);

        if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
            return res.status(400).json({ error: "Invalid price" });
        }

        // make some variables from request acceptable for frontend (Marco I'm gonna kill u one day ~_~)
        // Mimimimimi stop being a wuss (also learn how to spell my name VaDUMB)
        const normalizedCity = location.split(",")[0].trim();
        const normalizedCategory = category === "Clothing" ? "Clothes" : category;
        const normalizedCondition =
            condition === "Like new"
                ? "Excellent"
                : condition === "Used"
                  ? "Acceptable"
                  : condition;
        const normalizedStatus = status
            ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
            : "Available";

        // inserting all of this bullshit
        const result = await query(
            `INSERT INTO posts (title, description, price, city_id, category_id, subcategory_id, condition, status, user_id)
            VALUES ($1, $2, $3, COALESCE((SELECT id FROM cities WHERE name = $4), 0), COALESCE((SELECT id FROM post_categories WHERE name = $5), 0), 0, COALESCE((SELECT id FROM post_condition WHERE condition = $6), 0), COALESCE((SELECT id FROM post_status WHERE status = $7), 0), $8)
            RETURNING id`,
            [
                title,
                description,
                parsedPrice,
                normalizedCity,
                normalizedCategory,
                normalizedCondition,
                normalizedStatus,
                req.session.userId,
            ],
        );
        res.status(201).json({ id: result.rows[0].id });
    } catch (error) {
        errorResponse(res, error);
    }
});

// GET exact post for postpage
sunnifyRouter.get("/posts/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        // checking id
        if (Number.isNaN(id)) {
            return res.status(400).json({ error: "Invalid post id" });
        }

        // selects all elems
        const result = await query(
            `SELECT p.id, p.title, p.description, p.price, p.user_id AS seller_id, u.username AS seller_username,
            c.name AS location, pc.name AS category, cond.condition AS condition, ps.status AS status, p.created_at
            FROM posts p
            LEFT JOIN users u ON u.id = p.user_id
            LEFT JOIN cities c ON c.id = p.city_id
            LEFT JOIN post_categories pc ON pc.id = p.category_id
            LEFT JOIN post_condition cond ON cond.id = p.condition
            LEFT JOIN post_status ps ON ps.id = p.status
            WHERE p.id = $1`,
            [id],
        );

        // checks result
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Post not found" });
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        errorResponse(res, error);
    }
});

// GET posts for any other pages
sunnifyRouter.get("/posts", async (req, res) => {
    try {
        const result = await query(
            `
            SELECT p.id, p.title, p.price, c.name AS location FROM posts p
            LEFT JOIN cities c ON c.id = p.city_id
            ORDER BY p.created_at DESC`,
        );

        res.status(200).json(result.rows);
    } catch (error) {
        errorResponse(res, error);
    }
});

// profile related API

//get exact profile
sunnifyRouter.get("/users/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        if (Number.isNaN(id)) {
            return res.status(400).json({ error: "Invalid profile id" });
        }

        const result = await query(
            `
            SELECT u.id, u.username, u.created_at, COUNT(p.id) AS posts_count FROM users u
            LEFT JOIN posts p ON p.user_id = u.id WHERE u.id = $1
            GROUP BY u.id, u.username, u.created_at;
            `,
            [id],
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        errorResponse(res, error);
    }
});

// get user listings
sunnifyRouter.get("/users/:id/posts", async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        if (Number.isNaN(id)) {
            return res.status(400).json({ error: "Invalid profile id" });
        }

        const result = await query(
            `
            SELECT  p.id, p.title, p.price, c.name AS location FROM posts p
            LEFT JOIN cities c ON c.id = p.city_id WHERE p.user_id = $1
            ORDER BY p.created_at DESC;`,
            [id],
        );

        res.status(200).json(result.rows);
    } catch (error) {
        errorResponse(res, error);
    }
});
// Search System

sunnifyRouter.post("/search", async (req, res) => {
    const searchText = req.body.query;
    if (!searchText || !searchText.trim()) {
        return res.status(400).json({ error: "No search text provided" });
    }
    const normalizedText = searchText.trim().toLowerCase();
    const keywords = normalizedText.split(/[\s,;.]+/).filter(Boolean);
    res.json({ keywords });
});

/*
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
*/

// Check if conversation exists between 2 users, if not, create it and returns conversationId
sunnifyRouter.post("/conversations/check-or-create", isUserAuthenticated, async (req, res) => {
    try {
        const user1 = Number(req.body.user1);
        const user2 = Number(req.body.user2);
        const sessionUser = req.session.userId;

        if (Number.isNaN(user1) || Number.isNaN(user2)) {
            return res.status(400).json({ error: "Invalid user ids" });
        }

        if (sessionUser !== user1 && sessionUser !== user2) {
            return res
                .status(403)
                .json({ error: "Forbidden: session user not part of this conversation" });
        }

        const result = await query(
            `SELECT id FROM conversations
            WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1)
            LIMIT 1`,
            [user1, user2],
        );

        if (result.rows.length > 0) {
            return res.status(200).json({ conversationId: result.rows[0].id });
        }

        const user1ForInsert = sessionUser;
        const user2ForInsert = sessionUser === user1 ? user2 : user1;

        const insertResult = await query(
            `INSERT INTO conversations (user1_id, user2_id) VALUES ($1, $2) RETURNING id`,
            [user1ForInsert, user2ForInsert],
        );

        return res.status(201).json({ conversationId: insertResult.rows[0].id });
    } catch (error) {
        errorResponse(res, error);
    }
});

// Get that returns the messages of a conversation
sunnifyRouter.get("/conversations/:id/messages", isUserAuthenticated, async (req, res) => {
    try {
        const convId = Number(req.params.id);
        if (Number.isNaN(convId)) return res.status(400).json({ error: "Invalid conversation id" });

        const convRes = await query("SELECT user1_id, user2_id FROM conversations WHERE id = $1", [
            convId,
        ]);
        if (convRes.rows.length === 0)
            return res.status(404).json({ error: "Conversation not found" });

        const { user1_id, user2_id } = convRes.rows[0];
        const sessionUser = req.session.userId;
        if (user1_id !== sessionUser && user2_id !== sessionUser) {
            return res.status(403).json({ error: "Forbidden: not part of this conversation" });
        }

        const messagesRes = await query(
            `SELECT id, conversation_id, sender_id, receiver_id, content, sent_at
            FROM messages
            WHERE conversation_id = $1
            ORDER BY sent_at ASC`,
            [convId],
        );

        res.status(200).json(messagesRes.rows);
    } catch (error) {
        errorResponse(res, error);
    }
});

// Insert a new message, returns id and sent_at
sunnifyRouter.post("/conversations/:id/messages", isUserAuthenticated, async (req, res) => {
    try {
        const convId = Number(req.params.id);
        const content = (req.body.content || "").trim();
        if (Number.isNaN(convId)) return res.status(400).json({ error: "Invalid conversation id" });
        if (!content) return res.status(400).json({ error: "Message content required" });

        const convRes = await query("SELECT user1_id, user2_id FROM conversations WHERE id = $1", [
            convId,
        ]);
        if (convRes.rows.length === 0)
            return res.status(404).json({ error: "Conversation not found" });

        const { user1_id, user2_id } = convRes.rows[0];
        const senderId = req.session.userId;
        if (senderId !== user1_id && senderId !== user2_id) {
            return res.status(403).json({ error: "Forbidden: not part of this conversation" });
        }

        const receiverId = senderId === user1_id ? user2_id : user1_id;

        const insertRes = await query(
            `INSERT INTO messages (conversation_id, sender_id, receiver_id, content)
            VALUES ($1, $2, $3, $4) RETURNING id, sent_at`,
            [convId, senderId, receiverId, content],
        );

        res.status(201).json({ id: insertRes.rows[0].id, sent_at: insertRes.rows[0].sent_at });
    } catch (error) {
        errorResponse(res, error);
    }
});

const errorResponse = (res, error) => {
    console.log(error);
    const errorMessage =
        typeof error === "string" ? error : error.message || "Internal server error";
    res.status(500).json({ error: errorMessage });
};

module.exports = { sunnifyRouter };
