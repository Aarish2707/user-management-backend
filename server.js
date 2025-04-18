const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const mongoose = require('mongoose');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api',authRoutes);
app.use('/api',userRoutes);

//frontend path
app.use(express.static(path.join(__dirname, "public")));

//db connection:
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("Connected to MongoDB! 🚀"))
.catch(err => console.error("MongoDB connection error:", err));

app.get("/",(req,res) => {
    res.send("Welcome To Node js!");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log('This is rest-API creating using node js.');
    console.log("Server is running on port:"+PORT);
});

