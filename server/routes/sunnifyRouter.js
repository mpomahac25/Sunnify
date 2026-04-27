// server/routes/sunnifyRouter.js
// Express router that implements the Sunnify backend API for auth, posts, profiles,
// search, locations, and a simple conversations/messages system.

const express = require("express");
const { query } = require("../helpers/db.js");
const { encryptPassword, verifyPassword } = require("../helpers/pwEncrypt.js");
const { supabase } = require("../helpers/supabase.js");
const multer = require("multer");

const upload = multer({
    storage: multer.memoryStorage()
});

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
        // TODO: Additional validation of username and email (e.g. profanity filtering)

        // Encrypt password
        const pwEncrypted = await encryptPassword(req.body.password);

        // Attempt to create new user in database; rely on UNIQUE constraint violations for validation
        result = await query(
            `INSERT INTO users (username, email, password_hash) 
                VALUES ($1, $2, $3) 
                RETURNING id`,
            [req.body.username, req.body.email, pwEncrypted],
        );
        
        res.status(201).json({ id: result.rows[0].id });
    } catch (error) {
        // Postgres "UNIQUE constraint violation" code
        if (error.code === "23505") {
            if (error.constraint?.includes("username")) {
                return res.status(409).json({ error: "Username already exists!" });
            }
            if (error.constraint?.includes("email")) {
                return res.status(409).json({ error: "Email already in use!" });
            }
            return res.status(409).json({ error: "Username or email already in use!" });
        }

        // Other error
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
    if (req.session.userId) res.status(200).json({ loggedIn: true, userId: req.session.userId, username: req.session.username });
    else res.status(200).json({ loggedIn: false, userId: null });
});

// Location data
// GET /locations
// Returns a hierarchical list of countries -> regions -> cities built from three DB queries.
// Useful for address-picker UI.
sunnifyRouter.get("/locations", async (req, res) => {
    try {
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
    } catch (error) {
        errorResponse(res, error);
    }
});

sunnifyRouter.get("/categories", async (req, res) => {
    try {
        let result = await query("SELECT id, name FROM post_categories ORDER BY id ASC");
        const categories = result.rows;

        result = await query(
            "SELECT id, name, category_id FROM post_subcategories ORDER BY id ASC",
        );
        const subcategories = result.rows;

        const categoryData = categories.map((category) => ({
            id: category.id,
            category: category.name,
            subcategories: subcategories
                .filter((subcategory) => subcategory.category_id === category.id)
                .map((subcategory) => ({
                    id: subcategory.id,
                    subcategory: subcategory.name,
                })),
        }));

        res.status(200).json(categoryData);
    } catch (error) {
        errorResponse(res, error);
    }
});

sunnifyRouter.get("/post-conditions", async (req, res) => {
    try {
        const result = await query(
            "SELECT id, condition FROM post_condition WHERE id > 0 ORDER BY id ASC",
        );
        const conditions = result.rows;

        const conditionData = conditions.map((condition) => ({
            id: condition.id,
            condition: condition.condition,
        }));

        res.status(200).json(conditionData);
    } catch (error) {
        errorResponse(res, error);
    }
});

sunnifyRouter.post("/upload-image", isUserAuthenticated, upload.single("image"), async (req, res) => {
    try{
        // checks if file is uploaded
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const file = req.file;

        // takes extension from mime type
        const extension = file.mimetype.split("/")[1] || "jpg";

        // generates unique file name to prevent conflicts
        const safeFileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
        const filePath = safeFileName;
        //const { error } = await supabase.storage.from(process.env.SUPABASE_BUCKET).getPublicUrl(filePath);

        // uploads file to storage
        const { error: uploadError } = await supabase.storage.from(process.env.SUPABASE_BUCKET).upload(filePath, file.buffer, {
            contentType: file.mimetype,
            upsert: false
        });

        // in case of error sends message
        if (uploadError) {
            return res.status(500).json({ error: uploadError.message });
        }

        // creates signed url
        const { data, error: signedUrlError } = await supabase.storage
        .from(process.env.SUPABASE_BUCKET)
        .createSignedUrl(filePath, 60 * 60 * 24 * 365); //number of seconds per year, available for 1 year

        // checks for any errors during creating of url
        if (signedUrlError) {
            return res.status(500).json({ error: signedUrlError.message });
        }

        // checks if file is img
        if (!req.file.mimetype.startsWith("image/")) {
            return res.status(400).json({ error: "Only image files are allowed" });
        }

        return res.status(200).json({ imageUrl: data.signedUrl, filePath })
    } catch (error) {
        errorResponse(res, error);
    }

});

// POST /posts
// Creates a new post. Requires authentication via `isUserAuthenticated`.
// Validates required fields and price, normalizes some input values for DB,
// then inserts a new post returning its id.
sunnifyRouter.post("/posts", isUserAuthenticated, async (req, res) => {
    try {
        const { title, description, price, location, categoryId, subcategoryId, condition, status, images } =
            req.body;

        if (title === undefined || description === undefined || price === undefined || condition === undefined || categoryId === undefined) {
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
        const normalizedCondition =
            condition === "Like new"
                ? "Excellent"
                : condition === "Used"
                  ? "Acceptable"
                  : condition;
        const normalizedStatus = status
            ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
            : "Available";

        // Insert post using category_id and subcategory_id directly
        const result = await query(
            `
            INSERT INTO posts (title, description, price, city_id, category_id, subcategory_id, condition, status, user_id)
            VALUES ($1, $2, $3, COALESCE((SELECT id FROM cities WHERE name = $4), 0), $5, $6, COALESCE((SELECT id FROM post_condition WHERE condition = $7), 0), COALESCE((SELECT id FROM post_status WHERE status = $8), 0), $9)
            RETURNING id
            `,
            [
                title,
                description,
                parsedPrice,
                normalizedCity,
                categoryId,
                subcategoryId || 0,
                normalizedCondition,
                normalizedStatus,
                req.session.userId,
            ],
        );
        const postId = result.rows[0].id;

        const imageUrls = Array.isArray(images)
            ? images
                  .map((imageUrl) => (typeof imageUrl === "string" ? imageUrl.trim() : ""))
                  .filter(Boolean)
            : [];
        for (const imageUrl of imageUrls) {
            await query(
                `
                INSERT INTO post_images (post_id, image_url)
                VALUES ($1, $2)
                `,
                [postId, imageUrl],
            );
        }

        res.status(201).json({ id: postId });
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
            `SELECT p.id, p.title, p.description, p.price, p.user_id AS seller_id, u.username AS seller_username, u.created_at AS seller_created_at,
            (
                SELECT COUNT(*)
                FROM posts sp
                WHERE sp.user_id = u.id
            ) AS seller_posts_count, 
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

        const imagesResult = await query(
            `
            SELECT id, post_id, image_url
            FROM post_images
            WHERE post_id = $1
            ORDER BY id ASC
            `,
            [id],
        );

        // checks result
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Post not found" });
        }

        const post = result.rows[0];
        post.images = imagesResult.rows;

        res.status(200).json(post);
    } catch (error) {
        errorResponse(res, error);
    }
});

// GET /posts
// Returns a list of posts (id, title, price, location) for index/listing pages.
sunnifyRouter.get("/posts", async (req, res) => {
    try {
        const postsResult = await query(
            `
            SELECT p.id, p.title, p.price, c.name AS location
            FROM posts p
            LEFT JOIN cities c ON c.id = p.city_id
            ORDER BY p.created_at DESC`,
        );

        const posts = postsResult.rows;
        const postIds = posts.map((p) => p.id);

        const imagesResult = await query(
            `
        SELECT id, post_id, image_url
        FROM post_images
        WHERE post_id = ANY($1)
        ORDER BY id ASC
        `,
            [postIds],
        );
        const imagesByPostId = {};
        for (const img of imagesResult.rows) {
            if (!imagesByPostId[img.post_id]) imagesByPostId[img.post_id] = [];
            imagesByPostId[img.post_id].push(img);
        }
        for (const post of posts) {
            post.images = imagesByPostId[post.id] || [];
        }

        res.status(200).json(posts);
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
        const postResult = await query("SELECT user_id FROM posts WHERE id = $1", [id]);

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
        await query(
            `
            DELETE FROM post_images
            WHERE post_id = $1
            `,
            [id],
        );

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
        const postResult = await query("SELECT user_id FROM posts WHERE id = $1", [id]);

        // checks if owners id is ok
        if (postResult.rows.length === 0) {
            return res.status(404).json({ error: "Post not found" });
        }

        // ownership rule
        const postOwnerId = postResult.rows[0].user_id;
        // checks if post is yours
        if (postOwnerId !== req.session.userId) {
            return res.status(403).json({ error: "Post is not yours" });
        }

        const { title, description, price, location, category, condition, status, images } =
            req.body;

        console.log("PATCH /posts payload:", {
            id,
            title,
            description,
            price,
            location,
            category,
            condition,
            status,
            sessionUserId: req.session.userId,
        });

        if (!title || !description || !location || !category || !condition) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const parsedPrice = Number(price);

        if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
            return res.status(400).json({ error: "Invalid price" });
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
                id,
            ],
        );

        if (Array.isArray(images)) {
            await query(
                `
                DELETE FROM post_images
                WHERE post_id = $1
                `,
                [id],
            );

            const imageUrls = images
                .map((imageUrl) => (typeof imageUrl === "string" ? imageUrl.trim() : ""))
                .filter(Boolean);

            for (const imageUrl of imageUrls) {
                await query(
                    `
                    INSERT INTO post_images (post_id, image_url)
                    VALUES ($1, $2)
                    `,
                    [id, imageUrl],
                );
            }
        }

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

        const postsResult = await query(
            `
            SELECT p.id, p.title, p.price, c.name AS location
            FROM posts p
            LEFT JOIN cities c ON c.id = p.city_id WHERE p.user_id = $1
            ORDER BY p.created_at DESC;`,
            [id],
        );

        const posts = postsResult.rows;

        for (const post of posts) {
            const imagesResult = await query(
                `
                SELECT id, post_id, image_url
                FROM post_images
                WHERE post_id = $1
                ORDER BY id ASC
                `,
                [post.id],
            );

            post.images = imagesResult.rows;
        }

        res.status(200).json(posts);
    } catch (error) {
        errorResponse(res, error);
    }
});

// Fetch settings (username, email) for currently logged in user
sunnifyRouter.get("/user/settings", isUserAuthenticated, async (req, res) => {
    try {
        const result = await query(
            `
            SELECT id, username, email
            FROM users
            WHERE id = $1
            `,
            [req.session.userId]
        );

        if (result.rows.length === 0) {
            console.error(`User with ID ${req.session.userId} requested settings, but such user not found in database!`);
            return res.status(404).json({ error: "User not found" });
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        errorResponse(res, error);
    }
});

// Update user settings in database
sunnifyRouter.patch("/user/settings", isUserAuthenticated, async (req, res) => {
    try {
        const { username, email, newPassword, currentPassword } = req.body;

        if (!currentPassword || !currentPassword.trim()) {
            return res.status(400).json({ error: "Current password is required." });
        }

        const userResult = await query(
            `
            SELECT id, username, email, password_hash
            FROM users
            WHERE id = $1
            `,
            [req.session.userId]
        );

        if (userResult.rows.length === 0) {
            console.error(`User with ID ${req.session.userId} requested settings update, but such user not found in database!`);
            return res.status(404).json({ error: "User not found" });
        }

        const user = userResult.rows[0];
        const passwordOk = await verifyPassword(currentPassword, user.password_hash);

        if (!passwordOk) {
            return res.status(401).json({ error: "Incorrect password." });
        }

        // Quick helper method for normalizing inputs
        const normalizeStringInput = (inputString) => {
            return typeof inputString === "string" ? inputString.trim() : null;
        }

        const normalizedUsername = normalizeStringInput(username) || user.username;
        const normalizedEmail = normalizeStringInput(email) || user.email;
        const normalizedNewPassword = normalizeStringInput(newPassword) || "";

        if (!normalizedUsername) {
            console.error(`Database contains empty username for userId ${req.session.userId}`);
            return res.status(400).json({ error: "Username cannot be empty." });
        }

        if (!normalizedEmail || !normalizedEmail.includes("@")) {
            return res.status(400).json({ error: "Invalid email." });
        }

        // Set to current pwHash in case pw is not being updated
        let newPasswordHash = user.password_hash;

        if (normalizedNewPassword) {
            // TODO: Add proper backend password validation; for now relying on frontend validation

            newPasswordHash = await encryptPassword(normalizedNewPassword);
        }

        const updateResult = await query(
            `
            UPDATE users
            SET username = $1,
                email = $2,
                password_hash = $3
            WHERE id = $4
            RETURNING id, username, email
            `,
            [normalizedUsername, normalizedEmail, newPasswordHash, req.session.userId]
        );

        // Update session username field
        req.session.username = updateResult.rows[0].username;

        res.status(200).json(updateResult.rows[0]);
    } catch (error) {
        // PostgreSQL UNIQUE constraint violations
        if (error.code === "23505") {
            if (error.constraint?.includes("username")) {
                return res.status(409).json({ error: "Username already exists." });
            }

            if (error.constraint?.includes("email")) {
                return res.status(409).json({ error: "Email already in use." });
            }

            return res.status(409).json({ error: "Username or email already in use." });
        }

        errorResponse(res, error);
    }
});


// Search System
sunnifyRouter.post("/search-results", async (req, res) => {
    try {
        const searchObject = buildSearchObject(req.body);

        const filterConditions = [];
        const queryParams = [];
        let nextParamIndex = 1;

        // Helper function for handing adding query params
        const addParam = (param) => {
            queryParams.push(param);
            const paramIndex = `$${nextParamIndex}`;
            nextParamIndex++;
            return paramIndex;
        };

        // Helper function for checking and adding param
        const checkAndAddParam = (sqlColumn, comparator, filterVar) => {
            if (filterVar !== null)
                filterConditions.push(`${sqlColumn} ${comparator} ${addParam(filterVar)}`);
        };

        // Location filter
        if (searchObject.location) {
            const locationType = searchObject.location.type;
            const locationId = searchObject.location.id;

            const tableForLocationLookup =
                locationType === "city"
                    ? "posts"
                    : locationType === "region"
                      ? "cities"
                      : "regions";

            filterConditions.push(
                `${tableForLocationLookup}.${locationType}_id = ${addParam(locationId)}`,
            );
        }

        // Category filters
        checkAndAddParam("posts.category_id", "=", searchObject.filters.categoryId);
        checkAndAddParam("posts.subcategory_id", "=", searchObject.filters.subcategoryId);

        // Condition filter
        checkAndAddParam("posts.condition", "=", searchObject.filters.conditionId);

        // Price filters
        checkAndAddParam("posts.price", ">=", searchObject.filters.priceMin);
        checkAndAddParam("posts.price", "<=", searchObject.filters.priceMax);

        // Title and description loose SQL filtering -> only 1 search token needs to match a word in title or description
        searchObject.searchTermsTokens.forEach((token) => {
            const likeToken = `%${token}%`;
            filterConditions.push(`
                (
                    posts.title ILIKE ${addParam(likeToken)} 
                    OR posts.description ILIKE ${addParam(likeToken)}
                )
            `);
        });

        // Build SQL clauses
        const selectClause = `
            SELECT
            posts.id,
            posts.title,
            posts.description,
            posts.price,
            posts.city_id,
            posts.category_id,
            posts.subcategory_id,
            posts.condition AS condition_id,
            posts.created_at,
            posts.last_updated,

            cities.name AS city_name,
            regions.name AS region_name,
            countries.name AS country_name,

            post_categories.name AS category_name,
            post_subcategories.name AS subcategory_name,
            post_condition.condition AS condition_name
        `;
        const fromAndJoinClause = `
            FROM posts

            JOIN cities ON cities.id = posts.city_id
            JOIN regions ON regions.id = cities.region_id
            JOIN countries ON countries.id = regions.country_id

            JOIN post_categories ON post_categories.id = posts.category_id
            JOIN post_subcategories ON post_subcategories.id = posts.subcategory_id

            JOIN post_condition ON post_condition.id = posts.condition
        `;
        const whereClause =
            filterConditions.length > 0 ? `WHERE ${filterConditions.join(" AND ")}` : "";

        // Sorting clause
        const sortType = searchObject.sortType;
        const sortClause =
            sortType === "newest"
                ? "ORDER BY posts.created_at DESC"
                : sortType === "oldest"
                  ? "ORDER BY posts.created_at ASC"
                  : sortType === "price-asc"
                    ? "ORDER BY posts.price ASC"
                    : sortType === "price-desc"
                      ? "ORDER BY posts.price DESC"
                      : "";

        // Build SQL query
        const sql = `${selectClause} ${fromAndJoinClause} ${whereClause} ${sortClause}`;

        // Fetch data
        const result = await query(sql, queryParams);
        const posts = result.rows;

        // Fetch images for carousel
        const postIds = posts.map((p) => p.id);

        const imagesResult = await query(
            `
        SELECT id, post_id, image_url
        FROM post_images
        WHERE post_id = ANY($1)
        ORDER BY id ASC
        `,
            [postIds],
        );
        const imagesByPostId = {};
        for (const img of imagesResult.rows) {
            if (!imagesByPostId[img.post_id]) imagesByPostId[img.post_id] = [];
            imagesByPostId[img.post_id].push(img);
        }
        for (const post of posts) {
            post.images = imagesByPostId[post.id] || [];
        }

        // Filter (and optionally sort) by relevancy
        const filteredPosts = filterAndSortPostsByRelevancy(posts, searchObject);

        return res.status(200).json({
            searchObject,
            posts: filteredPosts,
            totalCount: filteredPosts.length,
        });
    } catch (error) {
        errorResponse(res, error);
    }
});

// Start of Chat System: Conversations & Messages

// Get all conversations where the user is participating
sunnifyRouter.get("/conversations", isUserAuthenticated, async (req, res) => {
    try {
        const sessionUser = req.session.userId;

        // Search for all the conversations where the user is participating
        let result = await query(
            `
            SELECT
                c.id, c.user1_id AS "buyerId", c.user2_id AS "sellerId", c.post_id AS "postId",
                u1.username AS "buyer", u2.username AS "seller",
                p.title AS "postTitle", p.price AS "postPrice",
                ARRAY(
                    SELECT image_url FROM post_images WHERE post_id = c.post_id
                ) AS "postImages"
            FROM conversations c
            JOIN users u1 ON c.user1_id = u1.id
            JOIN users u2 ON c.user2_id = u2.id
            JOIN posts p ON c.post_id = p.id
            WHERE c.user1_id = $1 OR c.user2_id = $1
            ORDER BY c.id DESC;
            `,
            [sessionUser]
        );

        const conversations = result.rows;

        // Fetch messages
        result = await query("SELECT * FROM messages");
        const allMessages = result.rows;

        // Group messages by conversation ID
        const messagesByConversationId = {};

        allMessages.forEach(msg => {
            if (!messagesByConversationId[msg.conversation_id]) {
                messagesByConversationId[msg.conversation_id] = [];
            }
            messagesByConversationId[msg.conversation_id].push(msg);
        });

        // Append messages to conversations
        conversations.forEach(conv => conv.messages = messagesByConversationId[conv.id] || [])
        console.log(conversations);

        // Return the array of conversations with status 200 (OK)
        return res.status(200).json({ conversations });
    } catch (error) {
        errorResponse(res, error);
    }
});

// Create a conversation between 2 users if it does not exist, or return the id if it already exists
sunnifyRouter.post("/conversation/check-or-create", isUserAuthenticated, async (req, res) => {
    try {
        // Make the received ids into a number
        const user1 = Number(req.body.user1);
        const user2 = Number(req.body.user2);
        const postId = Number(req.body.postId);

        // User id authenticated (logged one)
        const sessionUser = req.session.userId;

        // Basic validation, numbers must be valid
        if (Number.isNaN(user1) || Number.isNaN(user2) || Number.isNaN(postId)) {
            return res.status(400).json({ error: "Invalid user ids or post id" });
        }

        // Validation: only can create the conversation if the logged user is one of the 2
        if (sessionUser !== user1 && sessionUser !== user2) {
            return res
                .status(403)
                .json({ error: "Forbidden: session user not part of this conversation" });
        }

        // Check if the conversation already exists between 2 users (in whatever order)
        const result = await query(
            `
            SELECT
                c.id, c.user1_id AS "buyerId", c.user2_id AS "sellerId", c.post_id AS "postId",
                u1.username AS "buyer", u2.username AS "seller",
                p.title AS "postTitle", p.price AS "postPrice",
                ARRAY(
                    SELECT image_url FROM post_images WHERE post_id = c.post_id
                ) AS "postImages"
            FROM conversations c
            JOIN users u1 ON c.user1_id = u1.id
            JOIN users u2 ON c.user2_id = u2.id
            JOIN posts p ON c.post_id = p.id
            WHERE
                ((c.user1_id = $1 AND c.user2_id = $2) OR (c.user1_id = $2 AND c.user2_id = $1))
                AND c.post_id = $3
            LIMIT 1
            `,
            [user1, user2, postId]
        );

        // If it exists, return the existing conversation
        if (result.rows.length > 0) {
            const conversation = result.rows[0];

            // Load messages for the conversation
            conversation.messages = (await query("SELECT * FROM messages WHERE conversation_id = $1", [conversation.id])).rows || [];

            return res.status(200).json({ conversation });
        }

        // If it doesn't exist, create the conversation and return the new id
        const insertResult = await query(
            `
            WITH c AS (
                INSERT INTO conversations (user1_id, user2_id, post_id) VALUES ($1, $2, $3)
                RETURNING id, user1_id, user2_id, post_id
            )
            SELECT
                c.id, c.user1_id AS "buyerId", c.user2_id AS "sellerId", c.post_id AS "postId",
                u1.username AS "buyer", u2.username AS "seller",
                p.title AS "postTitle", p.price AS "postPrice",
                ARRAY(
                    SELECT image_url FROM post_images WHERE post_id = c.post_id
                ) AS "postImages"
            FROM c
            JOIN users u1 ON c.user1_id = u1.id
            JOIN users u2 ON c.user2_id = u2.id
            JOIN posts p ON c.post_id = p.id
            `,
            [user1, user2, postId]
        );

        const conversation = insertResult.rows[0];
        conversation.messages = [];

        return res.status(201).json({ conversation });
    } catch (error) {
        errorResponse(res, error);
    }
});

// Get messages of a conversation, only if the logged user is part of the conversation (user1 or user2)
sunnifyRouter.get("/conversations/:id/messages", isUserAuthenticated, async (req, res) => {
    // Start try/catch to capture error and prevent the server from crashing
    try {
        // Take the conversation id and the authenticated user
        const conversationID = Number(req.params.id);
        const afterId = Number(req.query.afterId || 0);
        const sessionUser = req.session.userId;

        // Validate the conversation id is a number
        if (Number.isNaN(conversationID)) {
            return res.status(400).json({ error: "Invalid conversation id" });
        }

        // Searches for the conversation in the database
        const convResult = await query(`SELECT * FROM conversations WHERE id = $1`, [
            conversationID,
        ]);
        if (convResult.rows.length === 0) {
            return res.status(404).json({ error: "Conversation not found" });
        }
        const conversation = convResult.rows[0];

        // Checks that the user is part of the conversation (either user1 or user2)
        if (sessionUser !== conversation.user1_id && sessionUser !== conversation.user2_id) {
            return res.status(403).json({ error: "Forbidden: user not part of this conversation" });
        }

        // Consults the messages of the conversation and returns them ordered by sent_at
        const messagesFromConv = await query(
            `
            SELECT * FROM messages
            WHERE conversation_id = $1 AND id > $2
            ORDER BY sent_at ASC
            `,
            [conversationID, afterId]
        );
        // Returns the messages in JSON format with status 200 (OK)
        return res.status(200).json({ messages: messagesFromConv.rows });
    } catch (error) {
        // If any error happens, catch it and return a 500 response with the error message
        errorResponse(res, error);
    }
});

// Send a message in a conversation, only if the logged user is part of the conversation (user1 or user2)
sunnifyRouter.post("/conversations/:id/messages", isUserAuthenticated, async (req, res) => {
    try {
        const conversationID = Number(req.params.id);
        const sessionUser = req.session.userId;

        // Validate id
        if (Number.isNaN(conversationID)) {
            return res.status(400).json({ error: "Invalid conversation id" });
        }

        // Validate text
        const msgText = req.body.text;
        // Check that the text is not empty or just spaces
        if (!msgText || !msgText.trim()) {
            return res.status(400).json({ error: "Message can't be empty" });
        }

        // Search for the conversation
        const convResult = await query(`SELECT* from conversations WHERE id = $1`, [
            conversationID,
        ]);
        if (convResult.rows.length === 0) {
            return res.status(404).json({ error: "Conversation not found" });
        }
        const conversation = convResult.rows[0];

        // Verify that the authenticated user is participan of the conversation
        if (sessionUser !== conversation.user1_id && sessionUser !== conversation.user2_id) {
            return res.status(403).json({ error: "User is not part of this conversation" });
        }

        // Determine the receiver id (the other user in the conversation
        // Ternary operator if the session user is user1, then the receiver is user2, otherwise the receiver is user1
        const receiverId =
            sessionUser === conversation.user1_id
                ? conversation.user2_id // If TRUE: use user2_id
                : conversation.user1_id; // If FALSE: use user1_id

        // Insert the message
        const insertResult = await query(
            `INSERT INTO messages (conversation_id, sender_id, receiver_id, content, sent_at)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING *`,
            [conversationID, sessionUser, receiverId, msgText],
        );

        // Return the inserted messages
        return res.status(201).json({ message: insertResult.rows[0] });
    } catch (error) {
        errorResponse(res, error);
    }
});

// Delete conversations that belong to the authenticated user
sunnifyRouter.delete("/conversations", isUserAuthenticated, async (req, res) => {
    try {
        const conversationIds = req.body.conversationIds;
        const userId = req.session.userId;
        // If conversationIds is not an array or if its empty, send an error
        if (!Array.isArray(conversationIds) || conversationIds.length === 0) {
            return res.status(400).json({ error: "No conversations selected" });
        }

        if (!conversationIds.every((id) => Number.isInteger(id) && id > 0)) {
            return res.status(400).json({ error: "Invalid conversation IDs" });
        }
        // Delete only conversations where the user is a participant
        const result = await query(
            `DELETE FROM conversations
                WHERE id = ANY($1)
                AND (user1_id = $2 OR user2_id = $2)
                RETURNING id`,
            [conversationIds, userId],
        );
        res.status(200).json({ message: "Conversations deleted", deleted: result.rows.length });
    } catch (error) {
        res.status(500).json({ error: "Error deleting conversations" });
    }
});

// End of Chat System: Conversations & Messages

// Categories
sunnifyRouter.get("/categories", async (req, res) => {
    try {
        let result = await query("SELECT id, name FROM post_categories ORDER BY id ASC");
        const categories = result.rows;

        result = await query(
            "SELECT id, name, category_id FROM post_subcategories ORDER BY id ASC",
        );
        const subcategories = result.rows;

        const categoryData = categories.map((category) => ({
            id: category.id,
            category: category.name,
            subcategories: subcategories
                .filter((subcategory) => subcategory.category_id === category.id)
                .map((subcategory) => ({
                    id: subcategory.id,
                    subcategory: subcategory.name,
                })),
        }));
        
        // Example: categoriesList = [{id: 1, name: "Clothes"}, ...]
        function getCategoryIdByName(name) {
            const cat = categoriesList.find((c) => c.name === name);
            return cat ? cat.id : "";
        }

        // When building the search object:
        const urlCategory = urlParams.get("category");
        const categoryId =
            urlParams.get("categoryId") || (urlCategory ? getCategoryIdByName(urlCategory) : "");

        res.status(200).json(categoryData);
    } catch (error) {
        errorResponse(res, error);
    }
});

// Convenience and helper functions
const errorResponse = (res, error) => {
    console.log(error);
    const errorMessage =
        typeof error === "string" ? error : error.message || "Internal server error";
    res.status(500).json({ error: errorMessage });
};

const normalizeText = (value) => {
    return typeof value === "string" ? value.trim() : "";
};

const normalizeSearchText = (rawText) => {
    return normalizeText(rawText).toLowerCase().replace(/\s+/g, " ");
};

const tokenizeSearchText = (normalizedText) => {
    if (!normalizedText) {
        return [];
    }

    // Split into array of unique search terms, minimum 2 character length
    return [
        ...new Set(
            normalizedText
                .split(" ")
                .filter(Boolean)
                .filter((term) => term.length >= 2),
        ),
    ];
};

const normalizeInteger = (value) => {
    if (value === "" || value === null || value === undefined) {
        return null;
    }

    const parsedValue = Number(value);
    return Number.isInteger(parsedValue) ? parsedValue : null;
};

const normalizeNumber = (value) => {
    if (value === "" || value === null || value === undefined) {
        return null;
    }

    const parsedValue = Number(value);
    return Number.isNaN(parsedValue) ? null : parsedValue;
};

const buildSearchObject = (rawRequest = {}) => {
    const searchTermsRaw = normalizeText(rawRequest.searchTermsRaw);
    const searchTermsNormalized = normalizeSearchText(searchTermsRaw);
    const searchTermsTokens = tokenizeSearchText(searchTermsNormalized);

    const locationType = normalizeText(rawRequest.locationType).toLowerCase();
    const locationId = normalizeInteger(rawRequest.locationId);

    return {
        searchTermsRaw,
        searchTermsNormalized,
        searchTermsTokens,
        location:
            locationType && locationId
                ? {
                      name: normalizeText(rawRequest.locationName),
                      type: locationType,
                      id: locationId,
                  }
                : null,
        sortType: normalizeText(rawRequest.sortType) || "relevance",
        filters: {
            categoryId: normalizeInteger(rawRequest.filters?.categoryId),
            subcategoryId: normalizeInteger(rawRequest.filters?.subcategoryId),
            conditionId: normalizeInteger(rawRequest.filters?.conditionId),
            priceMin: normalizeNumber(rawRequest.filters?.priceMin),
            priceMax: normalizeNumber(rawRequest.filters?.priceMax),
        },
    };
};

const filterAndSortPostsByRelevancy = (postsFromDb, searchObject) => {
    if (!Array.isArray(postsFromDb)) return [];

    const doSorting = searchObject.sortType === "relevancy";
    const rawSearch = searchObject.searchTermsNormalized || "";
    const tokens = Array.isArray(searchObject.searchTermsTokens)
        ? searchObject.searchTermsTokens
        : [];

    // No tokens means no valid search terms; just return original array
    if (tokens.length === 0) {
        return postsFromDb;
    }

    // Create array of post objects with relevancy score
    const scoredPosts = postsFromDb
        .map((post) => {
            const title = normalizeSearchText(post.title);
            const description = normalizeSearchText(post.description);

            let score = 0;
            let matchedTokenCount = 0;

            // Full exact match with user input
            if (rawSearch !== "") {
                if (title.includes(rawSearch)) score += 100;
                if (description.includes(rawSearch)) score += 40;
            }

            // Token matching
            tokens.forEach((token) => {
                let tokenMatched = false;

                if (title.includes(token)) {
                    score += 20;
                    tokenMatched = true;
                }

                if (description.includes(token)) {
                    score += 8;
                    tokenMatched = true;
                }

                if (tokenMatched) {
                    matchedTokenCount++;
                }
            });

            // Bonus if all search tokens matched
            if (matchedTokenCount === tokens.length) {
                score += 30;
            }

            // Bonus if title starts with user input
            if (rawSearch !== "" && title.startsWith(rawSearch)) {
                score += 25;
            }

            return {
                ...post,
                relevanceScore: score,
                matchedTokenCount,
            };
        })
        .filter((post) => post.relevanceScore > 0);

    // Sorting not requested, return just filtered
    if (!doSorting) {
        return scoredPosts;
    }

    return scoredPosts.sort((a, b) => {
        // Relevancy score sorting
        if (b.relevanceScore !== a.relevanceScore) {
            return b.relevanceScore - a.relevanceScore;
        }

        // If relevancy score equal, sort by number of matched search tokens
        if (b.matchedTokenCount !== a.matchedTokenCount) {
            return b.matchedTokenCount - a.matchedTokenCount;
        }

        // If relevancy score and number of matched search tokens are equal, sort by date posts were created
        return new Date(b.created_at) - new Date(a.created_at);
    });
};

module.exports = { sunnifyRouter };
