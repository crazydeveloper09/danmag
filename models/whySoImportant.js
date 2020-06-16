const mongoose = require("mongoose");

const whySoImportantSchema = new mongoose.Schema({
    description: String
})

module.exports = mongoose.model("WhySoImportant", whySoImportantSchema);