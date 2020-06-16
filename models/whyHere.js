const mongoose = require("mongoose");

const whyHereSchema = new mongoose.Schema({
    title: String,
    description: String
})

module.exports = mongoose.model("WhyHere", whyHereSchema);