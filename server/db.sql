DROP DATABASE IF EXISTS sunnify;

CREATE DATABASE sunnify;

/* \c sunnify;*/

CREATE TABLE users (
	id SERIAL PRIMARY KEY,
	username VARCHAR(255) NOT NULL UNIQUE,
	email VARCHAR(255) NOT NULL UNIQUE CHECK (email LIKE '%@%'),
	password_hash VARCHAR(255) NOT NULL,
	created_at TIMESTAMPTZ DEFAULT NOW(),
	last_login TIMESTAMPTZ DEFAULT NOW(),
	posts_count INT CHECK (price >= 0)
);

CREATE TABLE post_categories (
	id SERIAL PRIMARY KEY,
	name VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE post_subcategories (
	id SERIAL PRIMARY KEY,
	name VARCHAR(255) NOT NULL,
	category_id INT NOT NULL DEFAULT 0 REFERENCES post_categories(id) ON DELETE CASCADE,
	UNIQUE (name, category_id)
);

CREATE TABLE post_condition (
	id SERIAL PRIMARY KEY,
	condition VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE post_status (
	id SERIAL PRIMARY KEY,
	status VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE countries (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
);

CREATE TABLE regions (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    country_id INT NOT NULL DEFAULT 0 REFERENCES countries(id) ON DELETE SET DEFAULT
);

CREATE TABLE cities (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    region_id INT NOT NULL DEFAULT 0 REFERENCES regions(id) ON DELETE SET DEFAULT
);

CREATE TABLE posts (
	id SERIAL PRIMARY KEY,
	title VARCHAR(255) NOT NULL,
	description TEXT NOT NULL,
	price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
	city_id INT NOT NULL DEFAULT 0 REFERENCES cities(id) ON DELETE SET DEFAULT,
	category_id INT NOT NULL DEFAULT 0 REFERENCES post_categories(id) ON DELETE SET DEFAULT,
	subcategory_id INT NOT NULL DEFAULT 0 REFERENCES post_subcategories(id) ON DELETE SET DEFAULT,
	condition INT NOT NULL DEFAULT 0 REFERENCES post_condition(id) ON DELETE SET DEFAULT,
	status INT NOT NULL DEFAULT 0 REFERENCES post_status(id) ON DELETE SET DEFAULT,
	user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	created_at TIMESTAMPTZ DEFAULT NOW(),
	last_updated TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE post_images (
	id SERIAL PRIMARY KEY,
	post_id INT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
	image_url TEXT NOT NULL
);

CREATE TABLE conversations (
	id SERIAL PRIMARY KEY,
	user1_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	user2_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE messages (
	id SERIAL PRIMARY KEY,
	conversation_id INT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
	sender_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	receiver_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	content TEXT NOT NULL,
	sent_at TIMESTAMPTZ DEFAULT NOW()
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

INSERT INTO countries (id, name) VALUES (0, 'Undefined');

INSERT INTO countries (name) VALUES
('Finland'),
('Croatia'),
('Ukraine'),
('Spain');

INSERT INTO regions (id, name) VALUES (0, 'Undefined');

INSERT INTO regions (name, country_id) VALUES
-- Finland
('Uusimaa', (SELECT id FROM countries WHERE name = 'Finland')),
('Southwest Finland', (SELECT id FROM countries WHERE name = 'Finland')),
('Satakunta', (SELECT id FROM countries WHERE name = 'Finland')),
('Kanta-Häme', (SELECT id FROM countries WHERE name = 'Finland')),
('Päijät-Häme', (SELECT id FROM countries WHERE name = 'Finland')),
('Pirkanmaa', (SELECT id FROM countries WHERE name = 'Finland')),
('Central Finland', (SELECT id FROM countries WHERE name = 'Finland')),
('South Ostrobothnia', (SELECT id FROM countries WHERE name = 'Finland')),
('Ostrobothnia', (SELECT id FROM countries WHERE name = 'Finland')),
('Central Ostrobothnia', (SELECT id FROM countries WHERE name = 'Finland')),
('North Ostrobothnia', (SELECT id FROM countries WHERE name = 'Finland')),
('Kainuu', (SELECT id FROM countries WHERE name = 'Finland')),
('Lapland', (SELECT id FROM countries WHERE name = 'Finland')),
('North Karelia', (SELECT id FROM countries WHERE name = 'Finland')),
('North Savo', (SELECT id FROM countries WHERE name = 'Finland')),
('South Savo', (SELECT id FROM countries WHERE name = 'Finland')),
('South Karelia', (SELECT id FROM countries WHERE name = 'Finland')),
('Kymenlaakso', (SELECT id FROM countries WHERE name = 'Finland')),
('Åland', (SELECT id FROM countries WHERE name = 'Finland')),
-- Croatia
('Bjelovar-Bilogora County', (SELECT id FROM countries WHERE name = 'Croatia')),
('Brod-Posavina County', (SELECT id FROM countries WHERE name = 'Croatia')),
('Dubrovnik-Neretva County', (SELECT id FROM countries WHERE name = 'Croatia')),
('Istria County', (SELECT id FROM countries WHERE name = 'Croatia')),
('Karlovac County', (SELECT id FROM countries WHERE name = 'Croatia')),
('Koprivnica-Križevci County', (SELECT id FROM countries WHERE name = 'Croatia')),
('Krapina-Zagorje County', (SELECT id FROM countries WHERE name = 'Croatia')),
('Lika-Senj County', (SELECT id FROM countries WHERE name = 'Croatia')),
('Međimurje County', (SELECT id FROM countries WHERE name = 'Croatia')),
('Osijek-Baranja County', (SELECT id FROM countries WHERE name = 'Croatia')),
('Požega-Slavonia County', (SELECT id FROM countries WHERE name = 'Croatia')),
('Primorje-Gorski Kotar County', (SELECT id FROM countries WHERE name = 'Croatia')),
('Šibenik-Knin County', (SELECT id FROM countries WHERE name = 'Croatia')),
('Sisak-Moslavina County', (SELECT id FROM countries WHERE name = 'Croatia')),
('Split-Dalmatia County', (SELECT id FROM countries WHERE name = 'Croatia')),
('Varaždin County', (SELECT id FROM countries WHERE name = 'Croatia')),
('Virovitica-Podravina County', (SELECT id FROM countries WHERE name = 'Croatia')),
('Vukovar-Srijem County', (SELECT id FROM countries WHERE name = 'Croatia')),
('Zadar County', (SELECT id FROM countries WHERE name = 'Croatia')),
('Zagreb County', (SELECT id FROM countries WHERE name = 'Croatia')),
('City of Zagreb', (SELECT id FROM countries WHERE name = 'Croatia')),
-- Ukraine
('Cherkasy Oblast', (SELECT id FROM countries WHERE name = 'Ukraine')),
('Chernihiv Oblast', (SELECT id FROM countries WHERE name = 'Ukraine')),
('Chernivtsi Oblast', (SELECT id FROM countries WHERE name = 'Ukraine')),
('Dnipropetrovsk Oblast', (SELECT id FROM countries WHERE name = 'Ukraine')),
('Donetsk Oblast', (SELECT id FROM countries WHERE name = 'Ukraine')),
('Ivano-Frankivsk Oblast', (SELECT id FROM countries WHERE name = 'Ukraine')),
('Kharkiv Oblast', (SELECT id FROM countries WHERE name = 'Ukraine')),
('Kherson Oblast', (SELECT id FROM countries WHERE name = 'Ukraine')),
('Khmelnytskyi Oblast', (SELECT id FROM countries WHERE name = 'Ukraine')),
('Kirovohrad Oblast', (SELECT id FROM countries WHERE name = 'Ukraine')),
('Kyiv Oblast', (SELECT id FROM countries WHERE name = 'Ukraine')),
('Luhansk Oblast', (SELECT id FROM countries WHERE name = 'Ukraine')),
('Lviv Oblast', (SELECT id FROM countries WHERE name = 'Ukraine')),
('Mykolaiv Oblast', (SELECT id FROM countries WHERE name = 'Ukraine')),
('Odesa Oblast', (SELECT id FROM countries WHERE name = 'Ukraine')),
('Poltava Oblast', (SELECT id FROM countries WHERE name = 'Ukraine')),
('Rivne Oblast', (SELECT id FROM countries WHERE name = 'Ukraine')),
('Sumy Oblast', (SELECT id FROM countries WHERE name = 'Ukraine')),
('Ternopil Oblast', (SELECT id FROM countries WHERE name = 'Ukraine')),
('Vinnytsia Oblast', (SELECT id FROM countries WHERE name = 'Ukraine')),
('Volyn Oblast', (SELECT id FROM countries WHERE name = 'Ukraine')),
('Zakarpattia Oblast', (SELECT id FROM countries WHERE name = 'Ukraine')),
('Zaporizhzhia Oblast', (SELECT id FROM countries WHERE name = 'Ukraine')),
('Zhytomyr Oblast', (SELECT id FROM countries WHERE name = 'Ukraine')),
('Autonomous Republic of Crimea', (SELECT id FROM countries WHERE name = 'Ukraine')),
('Kyiv City', (SELECT id FROM countries WHERE name = 'Ukraine')),
('Sevastopol', (SELECT id FROM countries WHERE name = 'Ukraine')),
-- Spain
('Andalusia', (SELECT id FROM countries WHERE name = 'Spain')),
('Aragón', (SELECT id FROM countries WHERE name = 'Spain')),
('Asturias', (SELECT id FROM countries WHERE name = 'Spain')),
('Balearic Islands', (SELECT id FROM countries WHERE name = 'Spain')),
('Basque Country', (SELECT id FROM countries WHERE name = 'Spain')),
('Canary Islands', (SELECT id FROM countries WHERE name = 'Spain')),
('Cantabria', (SELECT id FROM countries WHERE name = 'Spain')),
('Castile and León', (SELECT id FROM countries WHERE name = 'Spain')),
('Castilla-La Mancha', (SELECT id FROM countries WHERE name = 'Spain')),
('Catalonia', (SELECT id FROM countries WHERE name = 'Spain')),
('Extremadura', (SELECT id FROM countries WHERE name = 'Spain')),
('Galicia', (SELECT id FROM countries WHERE name = 'Spain')),
('La Rioja', (SELECT id FROM countries WHERE name = 'Spain')),
('Community of Madrid', (SELECT id FROM countries WHERE name = 'Spain')),
('Region of Murcia', (SELECT id FROM countries WHERE name = 'Spain')),
('Navarre', (SELECT id FROM countries WHERE name = 'Spain')),
('Valencian Community', (SELECT id FROM countries WHERE name = 'Spain')),
('Ceuta', (SELECT id FROM countries WHERE name = 'Spain')),
('Melilla', (SELECT id FROM countries WHERE name = 'Spain'));

INSERT INTO cities (id, name) VALUES (0, 'Undefined');

-- Finland cities
INSERT INTO cities (name, region_id) VALUES
-- Uusimaa
('Helsinki', (SELECT id FROM regions WHERE name = 'Uusimaa')),
('Espoo', (SELECT id FROM regions WHERE name = 'Uusimaa')),
('Vantaa', (SELECT id FROM regions WHERE name = 'Uusimaa')),
('Porvoo', (SELECT id FROM regions WHERE name = 'Uusimaa')),
('Lohja', (SELECT id FROM regions WHERE name = 'Uusimaa')),
-- Southwest Finland
('Turku', (SELECT id FROM regions WHERE name = 'Southwest Finland')),
('Salo', (SELECT id FROM regions WHERE name = 'Southwest Finland')),
('Naantali', (SELECT id FROM regions WHERE name = 'Southwest Finland')),
('Raisio', (SELECT id FROM regions WHERE name = 'Southwest Finland')),
('Kaarina', (SELECT id FROM regions WHERE name = 'Southwest Finland')),
-- Satakunta
('Pori', (SELECT id FROM regions WHERE name = 'Satakunta')),
('Rauma', (SELECT id FROM regions WHERE name = 'Satakunta')),
('Ulvila', (SELECT id FROM regions WHERE name = 'Satakunta')),
('Kankaanpää', (SELECT id FROM regions WHERE name = 'Satakunta')),
('Harjavalta', (SELECT id FROM regions WHERE name = 'Satakunta')),
-- Kanta-Häme
('Hämeenlinna', (SELECT id FROM regions WHERE name = 'Kanta-Häme')),
('Riihimäki', (SELECT id FROM regions WHERE name = 'Kanta-Häme')),
('Forssa', (SELECT id FROM regions WHERE name = 'Kanta-Häme')),
('Janakkala', (SELECT id FROM regions WHERE name = 'Kanta-Häme')),
('Tammela', (SELECT id FROM regions WHERE name = 'Kanta-Häme')),
-- Päijät-Häme
('Lahti', (SELECT id FROM regions WHERE name = 'Päijät-Häme')),
('Heinola', (SELECT id FROM regions WHERE name = 'Päijät-Häme')),
('Orimattila', (SELECT id FROM regions WHERE name = 'Päijät-Häme')),
('Hollola', (SELECT id FROM regions WHERE name = 'Päijät-Häme')),
('Asikkala', (SELECT id FROM regions WHERE name = 'Päijät-Häme')),
-- Pirkanmaa
('Tampere', (SELECT id FROM regions WHERE name = 'Pirkanmaa')),
('Nokia', (SELECT id FROM regions WHERE name = 'Pirkanmaa')),
('Ylöjärvi', (SELECT id FROM regions WHERE name = 'Pirkanmaa')),
('Valkeakoski', (SELECT id FROM regions WHERE name = 'Pirkanmaa')),
('Lempäälä', (SELECT id FROM regions WHERE name = 'Pirkanmaa')),
-- Central Finland
('Jyväskylä', (SELECT id FROM regions WHERE name = 'Central Finland')),
('Jämsä', (SELECT id FROM regions WHERE name = 'Central Finland')),
('Äänekoski', (SELECT id FROM regions WHERE name = 'Central Finland')),
('Keuruu', (SELECT id FROM regions WHERE name = 'Central Finland')),
('Saarijärvi', (SELECT id FROM regions WHERE name = 'Central Finland')),
-- South Ostrobothnia
('Seinäjoki', (SELECT id FROM regions WHERE name = 'South Ostrobothnia')),
('Lapua', (SELECT id FROM regions WHERE name = 'South Ostrobothnia')),
('Kurikka', (SELECT id FROM regions WHERE name = 'South Ostrobothnia')),
('Kauhajoki', (SELECT id FROM regions WHERE name = 'South Ostrobothnia')),
('Alavus', (SELECT id FROM regions WHERE name = 'South Ostrobothnia')),
-- Ostrobothnia
('Vaasa', (SELECT id FROM regions WHERE name = 'Ostrobothnia')),
('Jakobstad', (SELECT id FROM regions WHERE name = 'Ostrobothnia')),
('Närpes', (SELECT id FROM regions WHERE name = 'Ostrobothnia')),
('Korsholm', (SELECT id FROM regions WHERE name = 'Ostrobothnia')),
('Laihia', (SELECT id FROM regions WHERE name = 'Ostrobothnia')),
-- Central Ostrobothnia
('Kokkola', (SELECT id FROM regions WHERE name = 'Central Ostrobothnia')),
('Kannus', (SELECT id FROM regions WHERE name = 'Central Ostrobothnia')),
('Kaustinen', (SELECT id FROM regions WHERE name = 'Central Ostrobothnia')),
('Toholampi', (SELECT id FROM regions WHERE name = 'Central Ostrobothnia')),
('Perho', (SELECT id FROM regions WHERE name = 'Central Ostrobothnia')),
-- North Ostrobothnia
('Oulu', (SELECT id FROM regions WHERE name = 'North Ostrobothnia')),
('Raahe', (SELECT id FROM regions WHERE name = 'North Ostrobothnia')),
('Ylivieska', (SELECT id FROM regions WHERE name = 'North Ostrobothnia')),
('Kempele', (SELECT id FROM regions WHERE name = 'North Ostrobothnia')),
('Haapajärvi', (SELECT id FROM regions WHERE name = 'North Ostrobothnia')),
-- Kainuu
('Kajaani', (SELECT id FROM regions WHERE name = 'Kainuu')),
('Sotkamo', (SELECT id FROM regions WHERE name = 'Kainuu')),
('Kuhmo', (SELECT id FROM regions WHERE name = 'Kainuu')),
('Suomussalmi', (SELECT id FROM regions WHERE name = 'Kainuu')),
('Paltamo', (SELECT id FROM regions WHERE name = 'Kainuu')),
-- Lapland
('Rovaniemi', (SELECT id FROM regions WHERE name = 'Lapland')),
('Kemi', (SELECT id FROM regions WHERE name = 'Lapland')),
('Tornio', (SELECT id FROM regions WHERE name = 'Lapland')),
('Kemijärvi', (SELECT id FROM regions WHERE name = 'Lapland')),
('Sodankylä', (SELECT id FROM regions WHERE name = 'Lapland')),
-- North Karelia
('Joensuu', (SELECT id FROM regions WHERE name = 'North Karelia')),
('Kitee', (SELECT id FROM regions WHERE name = 'North Karelia')),
('Lieksa', (SELECT id FROM regions WHERE name = 'North Karelia')),
('Nurmes', (SELECT id FROM regions WHERE name = 'North Karelia')),
('Outokumpu', (SELECT id FROM regions WHERE name = 'North Karelia')),
-- North Savo
('Kuopio', (SELECT id FROM regions WHERE name = 'North Savo')),
('Iisalmi', (SELECT id FROM regions WHERE name = 'North Savo')),
('Varkaus', (SELECT id FROM regions WHERE name = 'North Savo')),
('Siilinjärvi', (SELECT id FROM regions WHERE name = 'North Savo')),
('Lapinlahti', (SELECT id FROM regions WHERE name = 'North Savo')),
-- South Savo
('Mikkeli', (SELECT id FROM regions WHERE name = 'South Savo')),
('Savonlinna', (SELECT id FROM regions WHERE name = 'South Savo')),
('Pieksämäki', (SELECT id FROM regions WHERE name = 'South Savo')),
('Juva', (SELECT id FROM regions WHERE name = 'South Savo')),
('Kangasniemi', (SELECT id FROM regions WHERE name = 'South Savo')),
-- South Karelia
('Lappeenranta', (SELECT id FROM regions WHERE name = 'South Karelia')),
('Imatra', (SELECT id FROM regions WHERE name = 'South Karelia')),
('Luumäki', (SELECT id FROM regions WHERE name = 'South Karelia')),
('Ruokolahti', (SELECT id FROM regions WHERE name = 'South Karelia')),
('Taipalsaari', (SELECT id FROM regions WHERE name = 'South Karelia')),
-- Kymenlaakso
('Kouvola', (SELECT id FROM regions WHERE name = 'Kymenlaakso')),
('Kotka', (SELECT id FROM regions WHERE name = 'Kymenlaakso')),
('Hamina', (SELECT id FROM regions WHERE name = 'Kymenlaakso')),
('Pyhtää', (SELECT id FROM regions WHERE name = 'Kymenlaakso')),
('Virolahti', (SELECT id FROM regions WHERE name = 'Kymenlaakso')),
-- Åland
('Mariehamn', (SELECT id FROM regions WHERE name = 'Åland')),
('Jomala', (SELECT id FROM regions WHERE name = 'Åland')),
('Finström', (SELECT id FROM regions WHERE name = 'Åland')),
('Lemland', (SELECT id FROM regions WHERE name = 'Åland')),
('Saltvik', (SELECT id FROM regions WHERE name = 'Åland'));

-- Croatia cities
INSERT INTO cities (name, region_id) VALUES
-- Bjelovar-Bilogora County
('Bjelovar', (SELECT id FROM regions WHERE name = 'Bjelovar-Bilogora County')),
('Čazma', (SELECT id FROM regions WHERE name = 'Bjelovar-Bilogora County')),
('Daruvar', (SELECT id FROM regions WHERE name = 'Bjelovar-Bilogora County')),
('Garešnica', (SELECT id FROM regions WHERE name = 'Bjelovar-Bilogora County')),
('Grubišno Polje', (SELECT id FROM regions WHERE name = 'Bjelovar-Bilogora County')),
-- Brod-Posavina County
('Slavonski Brod', (SELECT id FROM regions WHERE name = 'Brod-Posavina County')),
('Nova Gradiška', (SELECT id FROM regions WHERE name = 'Brod-Posavina County')),
('Brod', (SELECT id FROM regions WHERE name = 'Brod-Posavina County')),
('Gornja Vrba', (SELECT id FROM regions WHERE name = 'Brod-Posavina County')),
('Davor', (SELECT id FROM regions WHERE name = 'Brod-Posavina County')),
-- Dubrovnik-Neretva County
('Dubrovnik', (SELECT id FROM regions WHERE name = 'Dubrovnik-Neretva County')),
('Korčula', (SELECT id FROM regions WHERE name = 'Dubrovnik-Neretva County')),
('Ploče', (SELECT id FROM regions WHERE name = 'Dubrovnik-Neretva County')),
('Metković', (SELECT id FROM regions WHERE name = 'Dubrovnik-Neretva County')),
('Opuzen', (SELECT id FROM regions WHERE name = 'Dubrovnik-Neretva County')),
-- Istria County
('Pula', (SELECT id FROM regions WHERE name = 'Istria County')),
('Rovinj', (SELECT id FROM regions WHERE name = 'Istria County')),
('Poreč', (SELECT id FROM regions WHERE name = 'Istria County')),
('Labin', (SELECT id FROM regions WHERE name = 'Istria County')),
('Buzet', (SELECT id FROM regions WHERE name = 'Istria County')),
-- Karlovac County
('Karlovac', (SELECT id FROM regions WHERE name = 'Karlovac County')),
('Ogulin', (SELECT id FROM regions WHERE name = 'Karlovac County')),
('Duga Resa', (SELECT id FROM regions WHERE name = 'Karlovac County')),
('Josipdol', (SELECT id FROM regions WHERE name = 'Karlovac County')),
('Slunj', (SELECT id FROM regions WHERE name = 'Karlovac County')),
-- Koprivnica-Križevci County
('Koprivnica', (SELECT id FROM regions WHERE name = 'Koprivnica-Križevci County')),
('Križevci', (SELECT id FROM regions WHERE name = 'Koprivnica-Križevci County')),
('Đurđevac', (SELECT id FROM regions WHERE name = 'Koprivnica-Križevci County')),
('Novigrad Podravski', (SELECT id FROM regions WHERE name = 'Koprivnica-Križevci County')),
('Sveti Ivan Žabno', (SELECT id FROM regions WHERE name = 'Koprivnica-Križevci County')),
-- Krapina-Zagorje County
('Krapina', (SELECT id FROM regions WHERE name = 'Krapina-Zagorje County')),
('Zabok', (SELECT id FROM regions WHERE name = 'Krapina-Zagorje County')),
('Oroslavje', (SELECT id FROM regions WHERE name = 'Krapina-Zagorje County')),
('Hum na Sutli', (SELECT id FROM regions WHERE name = 'Krapina-Zagorje County')),
('Marija Bistrica', (SELECT id FROM regions WHERE name = 'Krapina-Zagorje County')),
-- Lika-Senj County
('Gospić', (SELECT id FROM regions WHERE name = 'Lika-Senj County')),
('Senj', (SELECT id FROM regions WHERE name = 'Lika-Senj County')),
('Otočac', (SELECT id FROM regions WHERE name = 'Lika-Senj County')),
('Novalja', (SELECT id FROM regions WHERE name = 'Lika-Senj County')),
('Brinje', (SELECT id FROM regions WHERE name = 'Lika-Senj County')),
-- Međimurje County
('Čakovec', (SELECT id FROM regions WHERE name = 'Međimurje County')),
('Prelog', (SELECT id FROM regions WHERE name = 'Međimurje County')),
('Mursko Središće', (SELECT id FROM regions WHERE name = 'Međimurje County')),
('Strahoninec', (SELECT id FROM regions WHERE name = 'Međimurje County')),
('Sveti Martin na Muri', (SELECT id FROM regions WHERE name = 'Međimurje County')),
-- Osijek-Baranja County
('Osijek', (SELECT id FROM regions WHERE name = 'Osijek-Baranja County')),
('Đakovo', (SELECT id FROM regions WHERE name = 'Osijek-Baranja County')),
('Beli Manastir', (SELECT id FROM regions WHERE name = 'Osijek-Baranja County')),
('Našice', (SELECT id FROM regions WHERE name = 'Osijek-Baranja County')),
('Valpovo', (SELECT id FROM regions WHERE name = 'Osijek-Baranja County')),
-- Požega-Slavonia County
('Požega', (SELECT id FROM regions WHERE name = 'Požega-Slavonia County')),
('Pakrac', (SELECT id FROM regions WHERE name = 'Požega-Slavonia County')),
('Kutjevo', (SELECT id FROM regions WHERE name = 'Požega-Slavonia County')),
('Pleternica', (SELECT id FROM regions WHERE name = 'Požega-Slavonia County')),
('Sutla', (SELECT id FROM regions WHERE name = 'Požega-Slavonia County')),
-- Primorje-Gorski Kotar County
('Rijeka', (SELECT id FROM regions WHERE name = 'Primorje-Gorski Kotar County')),
('Crikvenica', (SELECT id FROM regions WHERE name = 'Primorje-Gorski Kotar County')),
('Opatija', (SELECT id FROM regions WHERE name = 'Primorje-Gorski Kotar County')),
('Delnice', (SELECT id FROM regions WHERE name = 'Primorje-Gorski Kotar County')),
('Kraljevica', (SELECT id FROM regions WHERE name = 'Primorje-Gorski Kotar County')),
-- Šibenik-Knin County
('Šibenik', (SELECT id FROM regions WHERE name = 'Šibenik-Knin County')),
('Knin', (SELECT id FROM regions WHERE name = 'Šibenik-Knin County')),
('Vodice', (SELECT id FROM regions WHERE name = 'Šibenik-Knin County')),
('Drniš', (SELECT id FROM regions WHERE name = 'Šibenik-Knin County')),
('Brodarica', (SELECT id FROM regions WHERE name = 'Šibenik-Knin County')),
-- Sisak-Moslavina County
('Sisak', (SELECT id FROM regions WHERE name = 'Sisak-Moslavina County')),
('Kutina', (SELECT id FROM regions WHERE name = 'Sisak-Moslavina County')),
('Popovača', (SELECT id FROM regions WHERE name = 'Sisak-Moslavina County')),
('Glina', (SELECT id FROM regions WHERE name = 'Sisak-Moslavina County')),
('Hrvatska Kostajnica', (SELECT id FROM regions WHERE name = 'Sisak-Moslavina County')),
-- Split-Dalmatia County
('Split', (SELECT id FROM regions WHERE name = 'Split-Dalmatia County')),
('Trogir', (SELECT id FROM regions WHERE name = 'Split-Dalmatia County')),
('Solin', (SELECT id FROM regions WHERE name = 'Split-Dalmatia County')),
('Omiš', (SELECT id FROM regions WHERE name = 'Split-Dalmatia County')),
('Makarska', (SELECT id FROM regions WHERE name = 'Split-Dalmatia County')),
-- Varaždin County
('Varaždin', (SELECT id FROM regions WHERE name = 'Varaždin County')),
('Lepoglava', (SELECT id FROM regions WHERE name = 'Varaždin County')),
('Ivanec', (SELECT id FROM regions WHERE name = 'Varaždin County')),
('Cestica', (SELECT id FROM regions WHERE name = 'Varaždin County')),
('Strmec', (SELECT id FROM regions WHERE name = 'Varaždin County')),
-- Virovitica-Podravina County
('Virovitica', (SELECT id FROM regions WHERE name = 'Virovitica-Podravina County')),
('Orahovica', (SELECT id FROM regions WHERE name = 'Virovitica-Podravina County')),
('Slatina', (SELECT id FROM regions WHERE name = 'Virovitica-Podravina County')),
('Sušica', (SELECT id FROM regions WHERE name = 'Virovitica-Podravina County')),
('Miholjac', (SELECT id FROM regions WHERE name = 'Virovitica-Podravina County')),
-- Vukovar-Srijem County
('Vukovar', (SELECT id FROM regions WHERE name = 'Vukovar-Srijem County')),
('Đakovo', (SELECT id FROM regions WHERE name = 'Vukovar-Srijem County')),
('Ilok', (SELECT id FROM regions WHERE name = 'Vukovar-Srijem County')),
('Vinkovci', (SELECT id FROM regions WHERE name = 'Vukovar-Srijem County')),
('Županja', (SELECT id FROM regions WHERE name = 'Vukovar-Srijem County')),
-- Zadar County
('Zadar', (SELECT id FROM regions WHERE name = 'Zadar County')),
('Biograd na Moru', (SELECT id FROM regions WHERE name = 'Zadar County')),
('Nin', (SELECT id FROM regions WHERE name = 'Zadar County')),
('Obrovac', (SELECT id FROM regions WHERE name = 'Zadar County')),
('Zemun‑Mirisce', (SELECT id FROM regions WHERE name = 'Zadar County')),
-- City of Zagreb
('Zagreb', (SELECT id FROM regions WHERE name = 'City of Zagreb')),
('Sesvete', (SELECT id FROM regions WHERE name = 'City of Zagreb')),
('Novi Zagreb', (SELECT id FROM regions WHERE name = 'City of Zagreb')),
('Maksimir', (SELECT id FROM regions WHERE name = 'City of Zagreb')),
('Trešnjevka', (SELECT id FROM regions WHERE name = 'City of Zagreb'));

-- Spain cities
INSERT INTO cities (name, region_id) VALUES
-- Andalucia
('Seville', (SELECT id FROM regions WHERE name = 'Andalusia')),
('Málaga', (SELECT id FROM regions WHERE name = 'Andalusia')),
('Granada', (SELECT id FROM regions WHERE name = 'Andalusia')),
('Córdoba', (SELECT id FROM regions WHERE name = 'Andalusia')),
('Jerez de la Frontera', (SELECT id FROM regions WHERE name = 'Andalusia')),
-- Aragón
('Zaragoza', (SELECT id FROM regions WHERE name = 'Aragón')),
('Huesca', (SELECT id FROM regions WHERE name = 'Aragón')),
('Teruel', (SELECT id FROM regions WHERE name = 'Aragón')),
('Calatayud', (SELECT id FROM regions WHERE name = 'Aragón')),
('Alcañiz', (SELECT id FROM regions WHERE name = 'Aragón')),
-- Asturias
('Oviedo', (SELECT id FROM regions WHERE name = 'Asturias')),
('Gijón', (SELECT id FROM regions WHERE name = 'Asturias')),
('Avilés', (SELECT id FROM regions WHERE name = 'Asturias')),
('Siero', (SELECT id FROM regions WHERE name = 'Asturias')),
('Langreo', (SELECT id FROM regions WHERE name = 'Asturias')),
-- Balearic Islands
('Palma', (SELECT id FROM regions WHERE name = 'Balearic Islands')),
('Manacor', (SELECT id FROM regions WHERE name = 'Balearic Islands')),
('Ibiza', (SELECT id FROM regions WHERE name = 'Balearic Islands')),
('Alcúdia', (SELECT id FROM regions WHERE name = 'Balearic Islands')),
('Sant Antoni de Portmany', (SELECT id FROM regions WHERE name = 'Balearic Islands')),
-- Basque Country
('Bilbao', (SELECT id FROM regions WHERE name = 'Basque Country')),
('San Sebastián', (SELECT id FROM regions WHERE name = 'Basque Country')),
('Vitoria‑Gasteiz', (SELECT id FROM regions WHERE name = 'Basque Country')),
('Barakaldo', (SELECT id FROM regions WHERE name = 'Basque Country')),
('Getxo', (SELECT id FROM regions WHERE name = 'Basque Country')),
-- Canary Islands
('Las Palmas de Gran Canaria', (SELECT id FROM regions WHERE name = 'Canary Islands')),
('Santa Cruz de Tenerife', (SELECT id FROM regions WHERE name = 'Canary Islands')),
('San Cristóbal de La Laguna', (SELECT id FROM regions WHERE name = 'Canary Islands')),
('Arrecife', (SELECT id FROM regions WHERE name = 'Canary Islands')),
('Puerto de la Cruz', (SELECT id FROM regions WHERE name = 'Canary Islands')),
-- Cantabria
('Santander', (SELECT id FROM regions WHERE name = 'Cantabria')),
('Torrelavega', (SELECT id FROM regions WHERE name = 'Cantabria')),
('Camargo', (SELECT id FROM regions WHERE name = 'Cantabria')),
('Castro Urdiales', (SELECT id FROM regions WHERE name = 'Cantabria')),
('Reocín', (SELECT id FROM regions WHERE name = 'Cantabria')),
-- Castile and León
('Valladolid', (SELECT id FROM regions WHERE name = 'Castile and León')),
('Burgos', (SELECT id FROM regions WHERE name = 'Castile and León')),
('León', (SELECT id FROM regions WHERE name = 'Castile and León')),
('Salamanca', (SELECT id FROM regions WHERE name = 'Castile and León')),
('Segovia', (SELECT id FROM regions WHERE name = 'Castile and León')),
-- Castilla-La Mancha
('Toledo', (SELECT id FROM regions WHERE name = 'Castilla-La Mancha')),
('Albacete', (SELECT id FROM regions WHERE name = 'Castilla-La Mancha')),
('Ciudad Real', (SELECT id FROM regions WHERE name = 'Castilla-La Mancha')),
('Cuenca', (SELECT id FROM regions WHERE name = 'Castilla-La Mancha')),
('Guadalajara', (SELECT id FROM regions WHERE name = 'Castilla-La Mancha')),
-- Catalonia
('Barcelona', (SELECT id FROM regions WHERE name = 'Catalonia')),
('Girona', (SELECT id FROM regions WHERE name = 'Catalonia')),
('Lleida', (SELECT id FROM regions WHERE name = 'Catalonia')),
('Tarragona', (SELECT id FROM regions WHERE name = 'Catalonia')),
('Badalona', (SELECT id FROM regions WHERE name = 'Catalonia')),
-- Extremadura
('Mérida', (SELECT id FROM regions WHERE name = 'Extremadura')),
('Badajoz', (SELECT id FROM regions WHERE name = 'Extremadura')),
('Cáceres', (SELECT id FROM regions WHERE name = 'Extremadura')),
('Almendralejo', (SELECT id FROM regions WHERE name = 'Extremadura')),
('Don Benito', (SELECT id FROM regions WHERE name = 'Extremadura')),
-- Galicia
('A Coruña', (SELECT id FROM regions WHERE name = 'Galicia')),
('Vigo', (SELECT id FROM regions WHERE name = 'Galicia')),
('Santiago de Compostela', (SELECT id FROM regions WHERE name = 'Galicia')),
('Ourense', (SELECT id FROM regions WHERE name = 'Galicia')),
('Pontevedra', (SELECT id FROM regions WHERE name = 'Galicia')),
-- La Rioja
('Logroño', (SELECT id FROM regions WHERE name = 'La Rioja')),
('Calahorra', (SELECT id FROM regions WHERE name = 'La Rioja')),
('Arnedo', (SELECT id FROM regions WHERE name = 'La Rioja')),
('Haro', (SELECT id FROM regions WHERE name = 'La Rioja')),
('Nájera', (SELECT id FROM regions WHERE name = 'La Rioja')),
-- Community of Madrid
('Madrid', (SELECT id FROM regions WHERE name = 'Community of Madrid')),
('Alcalá de Henares', (SELECT id FROM regions WHERE name = 'Community of Madrid')),
('Móstoles', (SELECT id FROM regions WHERE name = 'Community of Madrid')),
('Fuenlabrada', (SELECT id FROM regions WHERE name = 'Community of Madrid')),
('Getafe', (SELECT id FROM regions WHERE name = 'Community of Madrid')),
-- Region of Murcia
('Murcia', (SELECT id FROM regions WHERE name = 'Region of Murcia')),
('Cartagena', (SELECT id FROM regions WHERE name = 'Region of Murcia')),
('Lorca', (SELECT id FROM regions WHERE name = 'Region of Murcia')),
('Mazarrón', (SELECT id FROM regions WHERE name = 'Region of Murcia')),
('Águilas', (SELECT id FROM regions WHERE name = 'Region of Murcia')),
-- Navarre
('Pamplona', (SELECT id FROM regions WHERE name = 'Navarre')),
('Tudela', (SELECT id FROM regions WHERE name = 'Navarre')),
('Estella', (SELECT id FROM regions WHERE name = 'Navarre')),
('Corella', (SELECT id FROM regions WHERE name = 'Navarre')),
('Tafalla', (SELECT id FROM regions WHERE name = 'Navarre')),
-- Valencian Community
('Valencia', (SELECT id FROM regions WHERE name = 'Valencian Community')),
('Alicante', (SELECT id FROM regions WHERE name = 'Valencian Community')),
('Elche', (SELECT id FROM regions WHERE name = 'Valencian Community')),
('Castellón de la Plana', (SELECT id FROM regions WHERE name = 'Valencian Community')),
('Orihuela', (SELECT id FROM regions WHERE name = 'Valencian Community')),
-- Ceuta
('Ceuta', (SELECT id FROM regions WHERE name = 'Ceuta')),
-- Melilla
('Melilla', (SELECT id FROM regions WHERE name = 'Melilla'));

-- Ukraine cities
INSERT INTO cities (name, region_id) VALUES
-- Cherkasy Oblast
('Cherkasy', (SELECT id FROM regions WHERE name = 'Cherkasy Oblast')),
('Uman', (SELECT id FROM regions WHERE name = 'Cherkasy Oblast')),
('Zvenyhorodka', (SELECT id FROM regions WHERE name = 'Cherkasy Oblast')),
('Smila', (SELECT id FROM regions WHERE name = 'Cherkasy Oblast')),
('Korsun-Shevchenkivskyi', (SELECT id FROM regions WHERE name = 'Cherkasy Oblast')),
-- Chernihiv Oblast
('Chernihiv', (SELECT id FROM regions WHERE name = 'Chernihiv Oblast')),
('Nizhyn', (SELECT id FROM regions WHERE name = 'Chernihiv Oblast')),
('Pryluky', (SELECT id FROM regions WHERE name = 'Chernihiv Oblast')),
('Bakhmach', (SELECT id FROM regions WHERE name = 'Chernihiv Oblast')),
('Novhorod-Siverskyi', (SELECT id FROM regions WHERE name = 'Chernihiv Oblast')),
-- Chernivtsi Oblast
('Chernivtsi', (SELECT id FROM regions WHERE name = 'Chernivtsi Oblast')),
('Khotyn', (SELECT id FROM regions WHERE name = 'Chernivtsi Oblast')),
('Novodnistrovsk', (SELECT id FROM regions WHERE name = 'Chernivtsi Oblast')),
('Vyzhnytsia', (SELECT id FROM regions WHERE name = 'Chernivtsi Oblast')),
('Hlyboka', (SELECT id FROM regions WHERE name = 'Chernivtsi Oblast')),
-- Dnipropetrovsk Oblast
('Dnipro', (SELECT id FROM regions WHERE name = 'Dnipropetrovsk Oblast')),
('Kamianske', (SELECT id FROM regions WHERE name = 'Dnipropetrovsk Oblast')),
('Nikopol', (SELECT id FROM regions WHERE name = 'Dnipropetrovsk Oblast')),
('Pavlohrad', (SELECT id FROM regions WHERE name = 'Dnipropetrovsk Oblast')),
('Kryvyi Rih', (SELECT id FROM regions WHERE name = 'Dnipropetrovsk Oblast')),
-- Donetsk Oblast
('Donetsk', (SELECT id FROM regions WHERE name = 'Donetsk Oblast')),
('Mariupol', (SELECT id FROM regions WHERE name = 'Donetsk Oblast')),
('Kramatorsk', (SELECT id FROM regions WHERE name = 'Donetsk Oblast')),
('Sloviansk', (SELECT id FROM regions WHERE name = 'Donetsk Oblast')),
('Pokrovsk', (SELECT id FROM regions WHERE name = 'Donetsk Oblast')),
-- Ivano-Frankivsk Oblast
('Ivano-Frankivsk', (SELECT id FROM regions WHERE name = 'Ivano-Frankivsk Oblast')),
('Kolomyia', (SELECT id FROM regions WHERE name = 'Ivano-Frankivsk Oblast')),
('Bolekhiv', (SELECT id FROM regions WHERE name = 'Ivano-Frankivsk Oblast')),
('Kalush', (SELECT id FROM regions WHERE name = 'Ivano-Frankivsk Oblast')),
('Dolyna', (SELECT id FROM regions WHERE name = 'Ivano-Frankivsk Oblast')),
-- Kharkiv Oblast
('Kharkiv', (SELECT id FROM regions WHERE name = 'Kharkiv Oblast')),
('Chuhuiv', (SELECT id FROM regions WHERE name = 'Kharkiv Oblast')),
('Izium', (SELECT id FROM regions WHERE name = 'Kharkiv Oblast')),
('Kupiansk', (SELECT id FROM regions WHERE name = 'Kharkiv Oblast')),
-- Kherson Oblast
('Kherson', (SELECT id FROM regions WHERE name = 'Kherson Oblast')),
('Beryslav', (SELECT id FROM regions WHERE name = 'Kherson Oblast')),
('Kakhovka', (SELECT id FROM regions WHERE name = 'Kherson Oblast')),
('Nova Kakhovka', (SELECT id FROM regions WHERE name = 'Kherson Oblast')),
('Oleshky', (SELECT id FROM regions WHERE name = 'Kherson Oblast')),
-- Khmelnytskyi Oblast
('Khmelnytskyi', (SELECT id FROM regions WHERE name = 'Khmelnytskyi Oblast')),
('Kamianets-Podilskyi', (SELECT id FROM regions WHERE name = 'Khmelnytskyi Oblast')),
('Shepetivka', (SELECT id FROM regions WHERE name = 'Khmelnytskyi Oblast')),
('Starokostiantyniv', (SELECT id FROM regions WHERE name = 'Khmelnytskyi Oblast')),
('Netishyn', (SELECT id FROM regions WHERE name = 'Khmelnytskyi Oblast')),
-- Kirovohrad Oblast
('Kropyvnytskyi', (SELECT id FROM regions WHERE name = 'Kirovohrad Oblast')),
('Oleksandriia', (SELECT id FROM regions WHERE name = 'Kirovohrad Oblast')),
('Svitlovodsk', (SELECT id FROM regions WHERE name = 'Kirovohrad Oblast')),
('Novoukrainka', (SELECT id FROM regions WHERE name = 'Kirovohrad Oblast')),
('Znamyanka', (SELECT id FROM regions WHERE name = 'Kirovohrad Oblast')),
-- Kyiv Oblast
('Bila Tserkva', (SELECT id FROM regions WHERE name = 'Kyiv Oblast')),
('Boryspil', (SELECT id FROM regions WHERE name = 'Kyiv Oblast')),
('Irpin', (SELECT id FROM regions WHERE name = 'Kyiv Oblast')),
('Bucha', (SELECT id FROM regions WHERE name = 'Kyiv Oblast')),
('Fastiv', (SELECT id FROM regions WHERE name = 'Kyiv Oblast')),
-- Luhansk Oblast
('Luhansk', (SELECT id FROM regions WHERE name = 'Luhansk Oblast')),
('Alchevsk', (SELECT id FROM regions WHERE name = 'Luhansk Oblast')),
('Sievierodonetsk', (SELECT id FROM regions WHERE name = 'Luhansk Oblast')),
('Lysychansk', (SELECT id FROM regions WHERE name = 'Luhansk Oblast')),
('Rubizhne', (SELECT id FROM regions WHERE name = 'Luhansk Oblast')),
('Kadiivka', (SELECT id FROM regions WHERE name = 'Luhansk Oblast')),
-- Lviv Oblast
('Lviv', (SELECT id FROM regions WHERE name = 'Lviv Oblast')),
('Drohobych', (SELECT id FROM regions WHERE name = 'Lviv Oblast')),
('Stryi', (SELECT id FROM regions WHERE name = 'Lviv Oblast')),
('Chervonohrad', (SELECT id FROM regions WHERE name = 'Lviv Oblast')),
-- Mykolaiv Oblast
('Mykolaiv', (SELECT id FROM regions WHERE name = 'Mykolaiv Oblast')),
('Pervomaisk', (SELECT id FROM regions WHERE name = 'Mykolaiv Oblast')),
('Voznesensk', (SELECT id FROM regions WHERE name = 'Mykolaiv Oblast')),
('Bashtanka', (SELECT id FROM regions WHERE name = 'Mykolaiv Oblast')),
('Ochakiv', (SELECT id FROM regions WHERE name = 'Mykolaiv Oblast')),
-- Odesa Oblast
('Odesa', (SELECT id FROM regions WHERE name = 'Odesa Oblast')),
('Izmail', (SELECT id FROM regions WHERE name = 'Odesa Oblast')),
('Bilhorod-Dnistrovskyi', (SELECT id FROM regions WHERE name = 'Odesa Oblast')),
('Chornomorsk', (SELECT id FROM regions WHERE name = 'Odesa Oblast')),
('Podilsk', (SELECT id FROM regions WHERE name = 'Odesa Oblast')),
-- Poltava Oblast
('Poltava', (SELECT id FROM regions WHERE name = 'Poltava Oblast')),
('Kremenchuk', (SELECT id FROM regions WHERE name = 'Poltava Oblast')),
('Horishni Plavni', (SELECT id FROM regions WHERE name = 'Poltava Oblast')),
('Lubny', (SELECT id FROM regions WHERE name = 'Poltava Oblast')),
('Myrhorod', (SELECT id FROM regions WHERE name = 'Poltava Oblast')),
-- Rivne Oblast
('Rivne', (SELECT id FROM regions WHERE name = 'Rivne Oblast')),
('Dubno', (SELECT id FROM regions WHERE name = 'Rivne Oblast')),
('Kostopil', (SELECT id FROM regions WHERE name = 'Rivne Oblast')),
('Varash', (SELECT id FROM regions WHERE name = 'Rivne Oblast')),
('Zdolbuniv', (SELECT id FROM regions WHERE name = 'Rivne Oblast')),
-- Sumy Oblast
('Sumy', (SELECT id FROM regions WHERE name = 'Sumy Oblast')),
('Shostka', (SELECT id FROM regions WHERE name = 'Sumy Oblast')),
('Okhtyrka', (SELECT id FROM regions WHERE name = 'Sumy Oblast')),
('Konotop', (SELECT id FROM regions WHERE name = 'Sumy Oblast')),
('Romny', (SELECT id FROM regions WHERE name = 'Sumy Oblast')),
-- Ternopil Oblast
('Ternopil', (SELECT id FROM regions WHERE name = 'Ternopil Oblast')),
('Chortkiv', (SELECT id FROM regions WHERE name = 'Ternopil Oblast')),
('Borshchiv', (SELECT id FROM regions WHERE name = 'Ternopil Oblast')),
('Kremenets', (SELECT id FROM regions WHERE name = 'Ternopil Oblast')),
('Zbarazh', (SELECT id FROM regions WHERE name = 'Ternopil Oblast')),
-- Vinnytsia Oblast
('Vinnytsia', (SELECT id FROM regions WHERE name = 'Vinnytsia Oblast')),
('Nemyriv', (SELECT id FROM regions WHERE name = 'Vinnytsia Oblast')),
('Koziatyn', (SELECT id FROM regions WHERE name = 'Vinnytsia Oblast')),
('Zhmerynka', (SELECT id FROM regions WHERE name = 'Vinnytsia Oblast')),
('Bar', (SELECT id FROM regions WHERE name = 'Vinnytsia Oblast')),
-- Volyn Oblast
('Lutsk', (SELECT id FROM regions WHERE name = 'Volyn Oblast')),
('Kovel', (SELECT id FROM regions WHERE name = 'Volyn Oblast')),
('Novovolynsk', (SELECT id FROM regions WHERE name = 'Volyn Oblast')),
('Volodymyr', (SELECT id FROM regions WHERE name = 'Volyn Oblast')),
('Shatsk', (SELECT id FROM regions WHERE name = 'Volyn Oblast')),
-- Zakarpattia Oblast
('Uzhhorod', (SELECT id FROM regions WHERE name = 'Zakarpattia Oblast')),
('Mukachevo', (SELECT id FROM regions WHERE name = 'Zakarpattia Oblast')),
('Berehove', (SELECT id FROM regions WHERE name = 'Zakarpattia Oblast')),
('Khust', (SELECT id FROM regions WHERE name = 'Zakarpattia Oblast')),
('Chop', (SELECT id FROM regions WHERE name = 'Zakarpattia Oblast')),
-- Zaporizhzhia Oblast
('Zaporizhzhia', (SELECT id FROM regions WHERE name = 'Zaporizhzhia Oblast')),
('Melitopol', (SELECT id FROM regions WHERE name = 'Zaporizhzhia Oblast')),
('Berdiansk', (SELECT id FROM regions WHERE name = 'Zaporizhzhia Oblast')),
('Tokmak', (SELECT id FROM regions WHERE name = 'Zaporizhzhia Oblast')),
('Prymorsk', (SELECT id FROM regions WHERE name = 'Zaporizhzhia Oblast')),
-- Zhytomyr Oblast
('Zhytomyr', (SELECT id FROM regions WHERE name = 'Zhytomyr Oblast')),
('Berdychiv', (SELECT id FROM regions WHERE name = 'Zhytomyr Oblast')),
('Korosten', (SELECT id FROM regions WHERE name = 'Zhytomyr Oblast')),
('Malyn', (SELECT id FROM regions WHERE name = 'Zhytomyr Oblast')),
('Ovruch', (SELECT id FROM regions WHERE name = 'Zhytomyr Oblast')),
-- Autonomous Republic of Crimea
('Simferopol', (SELECT id FROM regions WHERE name = 'Autonomous Republic of Crimea')),
('Kerch', (SELECT id FROM regions WHERE name = 'Autonomous Republic of Crimea')),
('Yalta', (SELECT id FROM regions WHERE name = 'Autonomous Republic of Crimea')),
('Feodosia', (SELECT id FROM regions WHERE name = 'Autonomous Republic of Crimea')),
('Yevpatoria', (SELECT id FROM regions WHERE name = 'Autonomous Republic of Crimea')),
-- Kyiv
('Kyiv', (SELECT id FROM regions WHERE name = 'Kyiv City')),
-- Sevastopol
('Sevastopol', (SELECT id FROM regions WHERE name = 'Sevastopol'));

INSERT INTO post_categories (id, name) VALUES (0, 'Uncategorized');

INSERT INTO post_categories (name) VALUES 
('Instruments'),
('Hobbies'),
('Clothes');

INSERT INTO post_subcategories (id, name) VALUES (0, 'Uncategorized');

INSERT INTO post_subcategories (name, category_id) VALUES
-- Instruments
('Pianos', (SELECT id FROM post_categories WHERE name = 'Instruments')),
('Guitars', (SELECT id FROM post_categories WHERE name = 'Instruments')),
('Drums', (SELECT id FROM post_categories WHERE name = 'Instruments')),
-- Hobbies
('Martial arts', (SELECT id FROM post_categories WHERE name = 'Hobbies')),
('Football', (SELECT id FROM post_categories WHERE name = 'Hobbies')),
('Fishing', (SELECT id FROM post_categories WHERE name = 'Hobbies')),
-- Clothes
('T-shirts', (SELECT id FROM post_categories WHERE name = 'Clothes')),
('Shirts', (SELECT id FROM post_categories WHERE name = 'Clothes')),
('Jackets', (SELECT id FROM post_categories WHERE name = 'Clothes')),
('Footwear', (SELECT id FROM post_categories WHERE name = 'Clothes'));

INSERT INTO post_condition (id, condition) VALUES (0, 'Undefined');

INSERT INTO post_condition (condition) VALUES
('Excellent'),
('Good'),
('Acceptable'),
('Bad'),
('Unusable, parts only');

INSERT INTO post_status (id, status) VALUES (0, 'Undefined');

INSERT INTO post_status (status) VALUES
('Available'),
('Sold');

INSERT INTO posts (title, description, price, city_id, category_id, subcategory_id, condition, status, user_id) VALUES
(
	'Electric guitar', 
	'Legendary electric guitar signed by Slash himself! Perfect condition!', 
	12999.99,
	(SELECT id FROM cities WHERE name = 'Zagreb'),
	(SELECT id FROM post_categories WHERE name = 'Instruments'),
	(SELECT id FROM post_subcategories WHERE name = 'Guitars'),
	(SELECT id FROM post_condition WHERE condition = 'Excellent'),
	(SELECT id FROM post_status WHERE status = 'Available'),
	(SELECT id FROM users WHERE username = 'mpomahac')
),
(
	'Fishing rod',
	'Fishing rod in excellent condition. Selling because fish hate me and I hate them too!!!',
	50,
	(SELECT id FROM cities WHERE name = 'Madrid'),
	(SELECT id FROM post_categories WHERE name = 'Hobbies'),
	(SELECT id FROM post_subcategories WHERE name = 'Fishing'),
	(SELECT id FROM post_condition WHERE condition = 'Good'),
	(SELECT id FROM post_status WHERE status = 'Sold'),
	(SELECT id FROM users WHERE username = 'aelmaoui')
),
(
	'Adidas flip-flops',
	'CYKA BLYAT PERFECT FLYP FLYOPS FOR ANY PERSON',
	420.69,
	(SELECT id FROM cities WHERE name = 'Oulu'),
	(SELECT id FROM post_categories WHERE name = 'Clothes'),
	(SELECT id FROM post_subcategories WHERE name = 'Footwear'),
	(SELECT id FROM post_condition WHERE condition = 'Excellent'),
	(SELECT id FROM post_status WHERE status = 'Available'),
	(SELECT id FROM users WHERE username = 'vgolovny')
);

INSERT INTO post_images (post_id, image_url) VALUES
((SELECT id FROM posts WHERE title = 'Electric guitar'), 'http://127.0.0.1:3000/img/electric_guitar1.png'),
((SELECT id FROM posts WHERE title = 'Electric guitar'), 'http://127.0.0.1:3000/img/electric_guitar2.png'),
((SELECT id FROM posts WHERE title = 'Fishing rod'), 'http://127.0.0.1:3000/img/fishing_rod.png'),
((SELECT id FROM posts WHERE title = 'Fishing rod'), 'http://127.0.0.1:3000/img/fishing_rod_2.png'),
((SELECT id FROM posts WHERE title = 'Adidas flip-flops'), 'http://127.0.0.1:3000/img/flip_flop_adididas_blyat.jpg');

INSERT INTO conversations (user1_id, user2_id) VALUES
((SELECT id FROM users WHERE username = 'mpomahac'), (SELECT id FROM users WHERE username = 'aelmaoui')),
((SELECT id FROM users WHERE username = 'aelmaoui'), (SELECT id FROM users WHERE username = 'vgolovny'));

INSERT INTO messages (conversation_id, sender_id, receiver_id, content) VALUES
(
	1,
	(SELECT id FROM users WHERE username = 'mpomahac'),
	(SELECT id FROM users WHERE username = 'aelmaoui'),
	'Hi, is the fishing rod still available?'
),
(
	1,
	(SELECT id FROM users WHERE username = 'aelmaoui'),
	(SELECT id FROM users WHERE username = 'mpomahac'),
	'No, sorry, it''s sold already'
),
(
	1,
	(SELECT id FROM users WHERE username = 'mpomahac'),
	(SELECT id FROM users WHERE username = 'aelmaoui'),
	'Oh, ok'
),
(
	2,
	(SELECT id FROM users WHERE username = 'aelmaoui'),
	(SELECT id FROM users WHERE username = 'vgolovny'),
	'420.64€ for a pair of flip flops??? Is that price a mistake?'
),
(
	2,
	(SELECT id FROM users WHERE username = 'vgolovny'),
	(SELECT id FROM users WHERE username = 'aelmaoui'),
	'No, the price is correct. Very good flip flops, worth the price!'
),
(
	2,
	(SELECT id FROM users WHERE username = 'aelmaoui'),
	(SELECT id FROM users WHERE username = 'vgolovny'),
	'No way, that''s crazy. I would be ok with 50€ max.'
),
(
	2,
	(SELECT id FROM users WHERE username = 'vgolovny'),
	(SELECT id FROM users WHERE username = 'aelmaoui'),
	'Ok, 50 deal.'
);