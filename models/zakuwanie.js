const mongoose = require("mongoose");

const zakuwanieSchema = new mongoose.Schema({
    title: String,
    profile: String,
    offer: String,
    whyHere: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "WhyHere"
        }
    ],
    whySoImportant: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "WhySoImportant"
        }
    ],
    gallery: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Picture"
        }
    ]
})

module.exports = mongoose.model("Zakuwanie", zakuwanieSchema);