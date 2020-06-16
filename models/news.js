const mongoose = require("mongoose");

const newsSchema = new mongoose.Schema({
	title: String,
	profile: String,
	opis: String,
	pictures: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Picture"
        }
    ],
	underposts: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "UnderPost"
		}
	],
	more: String
});

module.exports = mongoose.model("News", newsSchema);