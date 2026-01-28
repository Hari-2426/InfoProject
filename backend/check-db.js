const mongoose = require('mongoose');
require('dotenv').config();
const Task = require('./db/task');
const User = require('./db/user');

async function checkDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        const users = await User.find().select("_id email_id first_name").lean();
        console.log("USERS IN DB:");
        users.forEach(u => console.log(`  ID: ${u._id}, Email: ${u.email_id}`));

        const tasks = await Task.find().select("title user_id category").lean();
        console.log("TASKS IN DB:");
        tasks.forEach(t => console.log(`  Title: ${t.title}, UserID: ${t.user_id}, Category: ${t.category}`));

        await mongoose.disconnect();
    } catch (err) {
        console.error("DB Check failed:", err);
    }
}

checkDB();
