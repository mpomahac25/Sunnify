DROP DATABASE IF EXISTS sunnify;

CREATE DATABASE sunnify;

/* \c sunnify;*/

CREATE TABLE users (
	id SERIAL PRIMARY KEY,
	username VARCHAR(255) NOT NULL UNIQUE,
	email VARCHAR(255) NOT NULL UNIQUE CHECK (email LIKE '%@%'),
	password_hash VARCHAR(255) NOT NULL,
	created_at TIMESTAMPTZ DEFAULT NOW(),
	last_login TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE posts (
	id SERIAL PRIMARY KEY,
	title VARCHAR(255) NOT NULL,
	description TEXT NOT NULL,
	price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
	location VARCHAR(255) NOT NULL,
	category VARCHAR(100) NOT NULL,
	condition VARCHAR(100) NOT NULL,
	status VARCHAR(50) NOT NULL DEFAULT 'available',
	user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	created_at TIMESTAMPTZ DEFAULT NOW(),
	last_updated TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE post_images (
	id SERIAL PRIMARY KEY,
	post_id INT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
	image_url TEXT NOT NULL
);

CREATE TABLE messages (
	id SERIAL PRIMARY KEY,
	conversation_id INT NOT NULL,
	sender_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	receiver_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	content TEXT NOT NULL,
	sent_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE conversations (
	id SERIAL PRIMARY KEY,
	user1_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	user2_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_post_images_post_id ON post_images(post_id);

CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);

CREATE INDEX idx_messages_user_time ON messages(sender_id, sent_at DESC);
CREATE INDEX idx_messages_receiver_time ON messages(receiver_id, sent_at DESC);

CREATE INDEX idx_messages_conversation ON messages(sender_id, receiver_id, sent_at DESC);

CREATE INDEX idx_conversations_user1 ON conversations(user1_id);
CREATE INDEX idx_conversations_user2 ON conversations(user2_id);

INSERT INTO users (username, email, password_hash) VALUES 
('mpomahac', 'mpomahac25@students.oamk.fi', '$argon2id$v=19$m=65536,t=3,p=4$I4OobjPOad2nUHnRbWcAfA$rK91z2HkrNwOWvAi2wPLJ+cCYnMGerq6waKt7+OD5BE'),
('vgolovny', 'vgolovny25@students.oamk.fi', '$argon2id$v=19$m=65536,t=3,p=4$I4OobjPOad2nUHnRbWcAfA$rK91z2HkrNwOWvAi2wPLJ+cCYnMGerq6waKt7+OD5BE'),
('aelmaoui', 'aelmaoui25@students.oamk.fi', '$argon2id$v=19$m=65536,t=3,p=4$I4OobjPOad2nUHnRbWcAfA$rK91z2HkrNwOWvAi2wPLJ+cCYnMGerq6waKt7+OD5BE');


INSERT INTO posts (title, description, price, user_id) VALUES
('Electric guitar', 'Legendary electric guitar signed by Slash himself! Perfect condition!', 12999.99, 1),
('Fishing rod', 'Fishing rod in excellent condition. Selling because fish hate me and I hate them too!!!', 50, 3),
('Adidas flip-flops', 'CYKA BLYAT PERFECT FLYP FLYOPS FOR ANY PERSON', 420.69, 2);

INSERT INTO post_images (post_id, image_url) VALUES
(1, 'http://127.0.0.1:3000/img/electric_guitar1.png'),
(1, 'http://127.0.0.1:3000/img/electric_guitar2.png'),
(2, 'http://127.0.0.1:3000/img/fishing_rod.png'),
(2, 'http://127.0.0.1:3000/img/fishing_rod_2.png'),
(3, 'http://127.0.0.1:3000/img/flip_flop_adididas_blyat.jpg');