# Expense Tracker Backend

RESTful API backend for the **Expense Tracker** application, built with **Node.js** and **Express.js**.

---

## 🚀 Features

- **User Authentication:** JWT-based secure authentication  
- **Transaction Management:** CRUD operations for income/expense transactions  
- **Data Analytics:** Expense categorization and summary calculations  
- **File Upload:** Profile picture upload 
- **Security:** Helmet.js for security headers, bcrypt for password hashing  
- **CORS Enabled:** Cross-origin resource sharing support  

---

## 🛠️ Tech Stack

- **Node.js** – Runtime environment  
- **Express.js 5.1.0** – Web framework  
- **MongoDB** – Database with Mongoose ODM  
- **JWT** – JSON Web Tokens for authentication  
- **bcryptjs** – Password hashing  
- **Multer** – File upload handling  
- **Helmet** – Security middleware  

---

## 📦 Installation

```bash
# Clone the repository
git clone <repository-url>
cd backend

# Install dependencies
npm install

# Create a .env file in the root directory and add the following: 
PORT=5000
MONGODB_URI=<MONGODB_URI_STRING>
JWT_SECRET=<JWT_SECRET_KEY>
JWT_EXPIRE=7d

# Start development server
npm start
