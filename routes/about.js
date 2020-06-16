const express = require("express"),
    Danmag = require("../models/danmag"),
    flash = require("connect-flash"),
    methodOverride = require("method-override"),
    app = express(),
    router = express.Router();

app.use(flash());
app.use(methodOverride("_method"));
let admin_username = "Paweł";
router.get("/", function(req, res){
    Danmag.findOne({username: admin_username}, (err, admin) => {
        res.render("./user/show", {admin:admin,header: "Danmag-części i akcesoria motoryzacyjne | O firmie", about:"", currentUser: req.user});
    });
	
});

router.get("/contact", function(req, res){
    Danmag.findOne({username: admin_username}, (err, admin) => {
        res.render("./user/contact", {admin:admin,header: "Danmag-części i akcesoria motoryzacyjne | Kontakt",about:"", contact:"", currentUser: req.user});
    });
	
});

router.get("/:id/edit", isLoggedIn, (req, res) => {
    Danmag.findById(req.params.id, (err, user) => {
        if(err){
            console.log(err);
        } else {
            Danmag.findOne({username: admin_username}, (err, admin) => {
                res.render("./user/edit", {user:user,admin:admin,header: "Danmag-części i akcesoria motoryzacyjne | Edytuj użytkownika",about:"", contact:"", currentUser: req.user});
            });
            
        }
    })
});

router.put("/:id", isLoggedIn, (req, res) => {
    Danmag.findByIdAndUpdate(req.params.id, req.body.user, (err, updatedUser) => {
        if(err){
            console.log(err)
        } else {
            res.redirect("/about")
        }
    })
})

function isLoggedIn (req, res, next) {
    if(req.isAuthenticated()) {
        return next();
    }
    req.flash("error", "Nie masz dostępu do tej strony");
    res.redirect(`/?return_route=${req._parsedOriginalUrl.path}`);
}

module.exports = router;