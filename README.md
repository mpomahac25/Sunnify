# Sunnify
### The web marketplace which Sunnifies your day!

## 1. Overview
This project is a web-based marketplace platform that allows users to browse, create, and manage listings, and connect with buyers or sellers through a secure and modern online experience.

This repository contains the source code needed to be able to run the application locally. The live version of the application can be found [here](https://sunnify.onrender.com).

## 2. Systems and Features
The following lists will cover the high-level lists of implemented, in development, and planned systems and features.
### 2.1 Implemented
- Registration
	- User input validation
		- Input format validated by frontend
		- Data validity validated by backend
	- User account creation
	- Secure password storing
- Login
	- User authentication
	- Session management
- User Account Management
	- View own and others' profile
		- Basic information
		- All user's posts
	- Update own account information
- Post Management
	- Create new posts
	- Edit own existing posts
	- Delete own posts when item is sold
- Post Search and Filtering
	- Initial search from main page
		- Based on search terms and/or location
		- Sorted by relevancy based on relevancy algorithm
	- Additional filtering of results from initial search
		- Price range
		- Category
		- Condition
- Messaging
	- Real-time chat between users
	- Separate conversations for each post
- Responsive Layout
	- Website and its elements display differently based on user screen width
- Live PostgreSQL Database
	- Persistent storage of data

### 2.2 In Development
- Category Search Buttons
	- Quick-access category filters on the main page
	- Faster navigation to relevant listings
- Multi-Image Carousel
	- Support for multiple images per post
	- Improved image browsing within listings
- Post List Pages
	- Splitting large post results into pages
	- User-selected display strategy
		- "Load more..." button
		- Page numbers
- Post Favoriting
	- Save listings for easy lookup later
	- Get notifications on significant post changes

### 2.3 Planned
- User Rating
	- Buyer and seller ratings
- Location services
	- Location-based listing discovery
	- Improved local marketplace experience
- Payment Gateway Integration
	- Secure online payment
	- Streamlined checkout and transaction handling
- Additional Filtering Options
- Accessibility Improvements
	- High-contrast themes for colorblind people
- Visual Design Enhancements
	- Collor palette update
	- Branding
	- Improved intuitiveness of UI
- Reporting System
	- Reporting for posts, messages, and users
- AI-Powered Search
- Additional Safety Features
	- Mandatory strong authentication for sellers
	- Easier scam reporting
	- Stronger user protection measures

## 3. Tech Stack
This web application is organized as a monorepo, with both the frontend and backend served together on the same URL and port.

### Frontend
- HTML5 for application structure ([MDN](https://developer.mozilla.org/en-US/docs/Web/HTML), [WHATWG Standard](https://html.spec.whatwg.org/))
- CSS3 for styling and layout ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS), [W3C CSS Specs](https://www.w3.org/Style/CSS/specs.en.html))
- Bootstrap for responsive UI ([Docs](https://getbootstrap.com/docs/))

### Backend
- Node.js as the runtime environment ([Docs](https://nodejs.org/docs/latest/api/))
- Express.js for routing and API handling ([Docs](https://expressjs.com/))

### Middleware, Configuration, and Security
- dotenv for environment variable management ([Docs](https://github.com/motdotla/dotenv))
- CORS for cross-origin communication ([Docs](https://expressjs.com/en/resources/middleware/cors.html))
- Express Session for user session management ([Docs](https://expressjs.com/en/resources/middleware/session.html))
- Argon2 for secure password hashing ([Docs](https://github.com/ranisalt/node-argon2))

### Database and Storage
- PostgreSQL relational database ([Docs](https://www.postgresql.org/docs/))
- Supabase for database and cloud image hosting ([Docs](https://supabase.com/docs))

### Hosting
- Render for application hosting and deployment ([Docs](https://render.com/docs))

## 4. Getting Started
These instructions will help you set up and run the project locally for development.  
  
### 4.1 Prerequisites  
Make sure you have the following installed before getting started:  
  
- [Node.js](https://nodejs.org/)  
- [npm](https://www.npmjs.com/)  
- A local PostgreSQL database, or access to the production database on Supabase
  
### 4.2 Repository Structure  
The project is organized as a monorepo:  
  
- `/server/` contains the Node.js and Express backend  
- `/client/` contains the frontend files  
- The Node.js project is initialized inside the `/server/` directory  
- The `.env` file is also located inside `/server/`  
  
### 4.3 Installation  
1. Clone the repository:  
```bash  
git clone https://github.com/mpomahac25/Sunnify.git  
cd Sunnify
```
2.  Install needed backend dependencies
```bash
cd server
npm install
```
3. Create a `.env` file inside the `server` directory and add the required environment variables

### 4.4 Running the Project Locally
From the `server` folder, run the following command:
```bash
npm run dev
```

### 4.5 Additional Notes
- The frontend and backend are maintained in separate folders, but server together
- All environment-specific configuration is managed via the `.env` file in `server` directory

## 5. Environment Variables
This project uses environment variables to store sensitive or environment-specific configuration.

The following variables are required:
```env
BACKEND_PORT=3000
SESSION_SECRET=<session_secret>

DB_HOST=<db_host>
DB_PORT=5432
DB_NAME=<db_name>
DB_USER=<db_user>
DB_PASSWORD=<db_password>
SSL=true

SUPABASE_URL=<supabase_project_url>
SUPABASE_SERVICE_ROLE_KEY=<supabase_service_role_key>
SUPABASE_BUCKET=<supabase_image_bucket>
```

**Never commit your real `.env` file or any secret keys to version control.**

## 6. Project Structure
The repository has the following structure.

```tree
Sunnify/
|	.gitignore
|	LICENSE
|	README.md
|
├──	client/		#Frontend
|	|	corporate.html
|	|	createpost.html
|	|	editpost.html
|	|	...
|	|
|	├── Reusable-HTML/
|	|	└── components/		#Reusable elements
|	|		|	accountMenu.html
|	|		|	carousel.html
|	|		|	carouselLoader.js
|	|		|	conditionDropdown.html
|	|		|	conditionDropdown.js
|	|		|	footer.html
|	|		|	footerLoader.js
|	|		└──	...
|	|
|	├── css/		#CSS stylesheets
|	|	|	main.css
|	|	|	post.css
|	|	└──	...
|	|
|	├── js/		#Page handler scripts
|	|	|	chat.js
|	|	|	contactSeller.js
|	|	|	createPost.js
|	|	|	...
|	|	|
|	|	├── Classes/		#Models for data
|	|	|	|	categories.js
|	|	|	|	category.js
|	|	|	└──	...
|	|	|
|	|	├── utils/		#Utility classes
|	|	|	└──	relevancyAlgorithm.js
|	|	|
|	|	└── validation/		#Frontend validation
|	|		|	email.js
|	|		|	password.js
|	|		└──	username.js
|	|
|	└── page-examples/		#Placeholder/template pages
|		|	chatpage-example.html
|		|	postpage-example.html
|		└──	profilepage-example.html
|
└──	server/		#Backend
	|	db.sql		#Database creation script (for testing)
	|	package-lock.json
	|	package.json
	|	server.js
	├──	helpers/		#Helper classes
	|	|	db.js		#Database query handler
	|	└──	pwEncrypt.js		#Password encryption handler
	|
	└──	routes/
		└──	sunnifyRouter.js		#Route handling
```

## 7. Project Owners and Contributors
### Project Owners
- Marko Pomahac (markopomahacyt@gmail.com)
- Anas El-Maoui Daher (anas.aemd@gmail.com)
- Vadym Golovnyi (vgolovnoj@gmail.com)

### Contributors
Other people who contribute to the project will be listed here.

### Acknowledgements
 - Meija Lohiniva --- Project guidance, mentoring, and feedback
 - Janne Kumpuoja --- Project guidance, mentoring, and feedback

## 8. License
This project is provided for private and educational use only.

Commercial use of this repository or any of its contents is prohibited without prior written permission from at least one of the listed project owners.

All rights reserved.
