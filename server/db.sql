DROP DATABASE IF EXISTS sunnify;

CREATE DATABASE sunnify;

CREATE TABLE users (
	id SERIAL PRIMARY KEY,
	username VARCHAR(255) NOT NULL UNIQUE,
	email VARCHAR(255) NOT NULL UNIQUE CHECK (email LIKE '%@%'),
	password_hash VARCHAR(255) NOT NULL,
	created_at TIMESTAMP DEFAULT NOW(),
	last_login TIMESTAMP DEFAULT NOW()
);

CREATE TABLE posts (
	id SERIAL PRIMARY KEY,
	title VARCHAR(255) NOT NULL,
	description TEXT NOT NULL,
	price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
	user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE post_images (
	id SERIAL PRIMARY KEY,
	post_id INT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
	image_url TEXT NOT NULL
);

CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_post_images_post_id ON post_images(post_id);

INSERT INTO users (username, email, password_hash) VALUES 
('mpomahac', 'mpomahac25@students.oamk.fi', '$argon2id$v=19$m=65536,t=3,p=4$UZTWlz85dnyAm9sdp8LQhQ$mKp1CVNTk+ueVsh725mpK/XJSosDDJ+5LR3SzYN04AI'),
('vgolovny', 'vgolovny25@students.oamk.fi', '$argon2id$v=19$m=65536,t=3,p=4$GxaOgLxFq9FGuXA4dHM6HQ$Ty9KmSsU2gM4Cm8OPpeEo5bg6CgOrqRwkxpWr7S5tnQ'),
('aelmaoui', 'aelmaoui25@students.oamk.fi', '$argon2id$v=19$m=65536,t=3,p=4$dST5UiZWWxZtVpZF13oFRg$F++suM8BqysB3dyNVXbYPt/Mfq6Fs3zjC78/pnSqTQM');
