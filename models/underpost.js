const mongoose = require("mongoose");

const underPostSchema = new mongoose.Schema({
	title: String,
	profile: String,
	opis: String
});

module.exports = mongoose.model("UnderPost", underPostSchema);
