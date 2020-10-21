const express = require("express"),
    Danmag = require("../models/danmag"),
    flash = require("connect-flash"),
    methodOverride = require("method-override"),
    app = express(),
    router = express.Router();

app.use(flash());
app.use(methodOverride("_method"));
let admin_username = "Paweł";
router.get("/user", function(req, res){
    Danmag.findOne({username: admin_username}, (err, admin) => {
        res.json(admin)
    });
	
});



function isLoggedIn (req, res, next) {
    if(req.isAuthenticated()) {
        return next();
    }
    req.flash("error", "Nie masz dostępu do tej strony");
    res.redirect(`/?return_route=${req._parsedOriginalUrl.path}`);
}

module.exports = router;