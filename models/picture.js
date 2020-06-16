const mongoose = require("mongoose");

const pictureSchema = new mongoose.Schema({
    source: String
})

module.exports = mongoose.model("Picture", pictureSchema);