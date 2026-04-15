// server/routes/sunnifyRouter.js
// Express router that implements the Sunnify backend API for auth, posts, profiles,
// search, locations, and a simple conversations/messages system.
// The original code is unchanged; the comments below explain purpose and behavior.

const express = require("express");
const { query } = require("../helpers/db.js");
const { encryptPassword, verifyPassword } = require("../helpers/pwEncrypt.js");

const sunnifyRouter = express.Router();

//  Middleware
// `isUserAuthenticated` checks for a session user id and returns 401 if missing.
// Use this on routes that require the user to be logged in.
const isUserAuthenticated = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated!" });
    }
    next();
};

// `preventAuthAccess` denies access when a user is already logged in.
// Useful for routes like register/login to avoid logged-in users calling them.
const preventAuthAccess = (req, res, next) => {
    if (req.session.userId) {
        return res.status(403).json({ error: "Already logged in" });
    }
    next();
};

//  Auth routes

// POST /register
// Protected by `preventAuthAccess` so only anonymous users may register.
// Checks for existing username/email, hashes password, inserts user, returns id.
// Note: additional validation (username/email format, profanity) is TODO.
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

// POST /login
// Accepts `usernameOrEmail` and `password` in the request body.
// Looks up user by email if the identifier contains '@', otherwise by username.
// Verifies password hash, sets `req.session.userId` and `req.session.username` on success.
// Returns a success message and updates last_login in DB.
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

        // Save session info so subsequent requests identify this user.
        req.session.userId = user.id;
        req.session.username = user.username;

        res.status(200).json({ message: "Login success!", id: user.id });

        // Update last_login in database (fire-and-forget after responding).
        result = await query("UPDATE users SET last_login = NOW() WHERE id = $1", [user.id]);
    } catch (error) {
        errorResponse(res, error);
    }
});

// POST /logout
// Destroys the session and clears the session cookie.
sunnifyRouter.post("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) errorResponse(res, "Logout failed");
        res.clearCookie("connect.sid");
        res.status(200).json({ message: "Logout success" });
    });
});

// GET /check-session
// Simple endpoint that returns `{ loggedIn: true, userId }` when a session exists.
// Used by frontend to know whether the browser is authenticated.
sunnifyRouter.get("/check-session", (req, res) => {
    if (req.session.userId) res.status(200).json({ loggedIn: true, userId: req.session.userId });
    else res.status(200).json({ loggedIn: false, userId: null });
});

// Location data
// GET /locations
// Returns a hierarchical list of countries -> regions -> cities built from three DB queries.
// Useful for address-picker UI.
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

// Placeholder for `/post-conditions` API (empty handler)
sunnifyRouter.get("/post-conditions", async (req, res) => {});

//  Post-related API

// POST /posts
// Creates a new post. Requires authentication via `isUserAuthenticated`.
// Validates required fields and price, normalizes some input values for DB,
// then inserts a new post returning its id.
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

        // Input normalization: convert display values into DB-friendly lookups.
        // Note: the file contains some developer jokes/comments which are preserved here.
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

        // Insert post using `COALESCE((SELECT id ...), 0)` so missing lookups fall back to 0.
        const result = await query(
            `
            INSERT INTO posts (title, description, price, city_id, category_id, subcategory_id, condition, status, user_id)
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

// GET /posts/:id
// Returns a single post with associated seller username and location/category names.
// Validates id, returns 404 if not found.
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

// GET /posts
// Returns a list of posts (id, title, price, location) for index/listing pages.
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

// DELETE /posts/:id
// Authenticated route. Validates post id, ensures ownership (post.user_id === session.userId),
// deletes the post and returns deleted id.
sunnifyRouter.delete("/posts/:id", isUserAuthenticated, async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        if (Number.isNaN(id)) {
            return res.status(400).json({ error: "Invalid post id" });
        }

        // selects id of the owner of the post
        const postResult = await query(
            "SELECT user_id FROM posts WHERE id = $1",
            [id]
            );

        // checks if owners id is ok
        if (postResult.rows.length === 0) {
            return res.status(404).json({ error: "Post not found" });
        }

        // ownership rule
        const postOwnerId = postResult.rows[0].user_id;

        if (postOwnerId !== req.session.userId) {
            return res.status(403).json({ error: "Post is not yours" });
        }

        // query to delete post
        const deleteResult = await query(
            `
            DELETE FROM posts
            WHERE id = $1
            RETURNING id;`,
            [id],
        );

        res.status(200).json({ id: deleteResult.rows[0].id });
    } catch (error) {
        errorResponse(res, error);
    }
});

// PATCH /posts/:id
// Intended to edit/update a post (authenticated + ownership). Current handler:
//   Validates id, checks post exists, verifies ownership.
//   Also: the route currently does not perform any update, update logic is missing.
sunnifyRouter.patch("/posts/:id", isUserAuthenticated, async (req, res) => {
    try {
        console.log("PATCH route hit");
        const id = parseInt(req.params.id);

        if (Number.isNaN(id)) {
            return res.status(400).json({ error: "Invalid post id" });
        }

        // selects id of the owner of the post
        const postResult = await query(
            "SELECT user_id FROM posts WHERE id = $1",
            [id]
            );

        // checks if owners id is ok
        if (postResult.rows.length === 0) {
            return res.status(404).json({ error: "Post not found" });
        }

        // ownership rule
        const postOwnerId = postResult.rows[0].user_id;

        if (postOwnerId !== req.session.userId) {
            return res.status(403).json({ error: "Post is not yours" });
        }

        const { title, description, price, location, category, condition, status } = req.body;

        console.log("PATCH /posts payload:", {
            id,
            title,
            description,
            price,
            location,
            category,
            condition,
            status,
            sessionUserId: req.session.userId
        });

        if (!title || !description || !location || !category || !condition) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const parsedPrice = Number(price);

        if (Number.isNaN(parsedPrice) || parsedPrice < 0){
            return res.status(400).json({ error: "Invalid price" })
        }

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

        const updateResult = await query(
            `
            UPDATE posts
            SET
                title = $1,
                description = $2,
                price = $3,
                city_id = COALESCE((SELECT id FROM cities WHERE name = $4), 0),
                category_id = COALESCE((SELECT id FROM post_categories WHERE name = $5), 0),
                condition = COALESCE((SELECT id FROM post_condition WHERE condition = $6), 0),
                status = COALESCE((SELECT id FROM post_status WHERE status = $7), 0),
                last_updated = NOW()
            WHERE id = $8
            RETURNING id
            `,
            [ 
                title,
                description,
                parsedPrice,
                normalizedCity,
                normalizedCategory,
                normalizedCondition,
                normalizedStatus,
                id
            ]
        );
        res.status(200).json({ id: updateResult.rows[0].id });
    } catch (error) {
        errorResponse(res, error);
    }
});

//  Profile-related API

// GET /users/:id
// Returns a user's profile summary (id, username, created_at, posts_count).
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

// GET /users/:id/posts
// Returns posts created by the given user id.
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

// DELETE /users/:id
// Placeholder: no implementation provided.
sunnifyRouter.delete("/users/:id", isUserAuthenticated, async (req, res) => {});

// Search
// POST /search
// Very small search helper that tokenizes the provided query into keywords.
// Currently only returns the tokens (no DB search implemented).
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
// Some commented-out example routes are present below in the original file.
*/

//  Conversations & Messages

// POST /conversations/check-or-create
// Given two user ids (`user1`, `user2`) ensures a conversation exists between them.
// Requires authentication and verifies the session user is one of the two participants.
// If a conversation already exists (either order), returns 200 with `conversationId`.
// Otherwise inserts a new conversation and returns 201 with the new id.
// Note: the insertion logic chooses an ordering for user1/user2 so the session user
//   becomes the first participant when inserting.
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

// GET /conversations/:id/messages
// Returns the messages for a conversation ordered by `sent_at` ascending.
// Checks that conversation exists and that the session user is a participant.
sunnifyRouter.get("/conversations/:id/messages", isUserAuthenticated, async (req, res) => {
    try {
        const convId = Number(req.params.id);
        if (Number.isNaN(convId)) return res.status(400).json({ error: "Invalid conversation id" });

        const convRes = await query(
            "SELECT user1_id, user2_id FROM conversations WHERE id = $1", 
            [convId],
        );
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

// POST /conversations/:id/messages
// Inserts a new message into a conversation.
// Validates conversation id, non-empty trimmed content, and that sender is a participant.
// Computes the receiverId by picking the other participant and returns the inserted id and sent_at.
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

// GET /conversations - Returns a list of conversations for the session user with the latest message preview.
// Validates session, selects conversations where the user is a participant, joins to get the other user's username,
// and uses a lateral join to get the latest message content and sent_at for sorting.
sunnifyRouter.get("/conversations", isUserAuthenticated, async (req, res) => {
    try {
        const userId = req.session.userId;
        const result = await query(
            `SELECT
                c.id,
                CASE WHEN c.user1_id = $1 THEN c.user2_id ELSE c.user1_id END AS other_user_id,
                u.username AS other_username,
                lm.content AS last_message,
                lm.sent_at AS last_sent_at
            FROM conversations c
            LEFT JOIN users u ON u.id = CASE WHEN c.user1_id = $1 THEN c.user2_id ELSE c.user1_id END
            LEFT JOIN LATERAL (
                SELECT content, sent_at
                FROM messages
                WHERE conversation_id = c.id
                ORDER BY sent_at DESC
                LIMIT 1
            ) lm ON true
            WHERE c.user1_id = $1 OR c.user2_id = $1
            ORDER BY lm.sent_at DESC NULLS LAST`,
                    [userId],
        );
        res.status(200).json(result.rows);
    } catch (err) {
        errorResponse(res, err);
    }
});

// Error helper
// `errorResponse` centralizes 500 responses and logs the error to the console.
const errorResponse = (res, error) => {
    console.log(error);
    const errorMessage =
        typeof error === "string" ? error : error.message || "Internal server error";
    res.status(500).json({ error: errorMessage });
};

module.exports = { sunnifyRouter };