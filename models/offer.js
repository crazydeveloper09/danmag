const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema({
	brand: String,
	model: String,
	engine: String,
	engineCategory: String,
	vin: String,
	year: Number,
	part: String,
	email: String,
	isSent: Boolean,
	date: Date
});

module.exports = mongoose.model("Offer", offerSchema);