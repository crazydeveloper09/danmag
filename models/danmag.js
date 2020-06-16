const mongoose = require("mongoose"),
    passportLocalMongoose = require("passport-local-mongoose");

const danmagSchema = new mongoose.Schema({
	username: String,
	email:String,
    password: String,
    companyEmail: String,
    phone: String,
    street: String,
    facebookLink: String,
    postCode: String,
    city: String,
    weekOpen: String,
    weekClosed: String,
    satOpen: String,
    satClosed: String,
    companyName: String,
    description: String,
	resetPasswordToken: String,
	resetPasswordExpires: Date
});
danmagSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model("Danmag", danmagSchema);