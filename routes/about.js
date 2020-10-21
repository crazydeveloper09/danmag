const express       = require("express"),
    Danmag          = require("../models/danmag"),
    flash           = require("connect-flash"),
    methodOverride  = require("method-override"),
    app             = express(), 
    NodeGeocoder    = require("node-geocoder"),
    router          = express.Router();

app.use(flash());
app.use(methodOverride("_method"));

let admin_username = "Paweł";

let options = {
    provider: 'google',
    httpAdapter: 'https',
    apiKey: process.env.GEOCODER_API_KEY,
    formatter: null
  };
let geocoder = NodeGeocoder(options);

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
           
            res.render("./user/edit", {user:user,header: "Danmag-części i akcesoria motoryzacyjne | Edytuj użytkownika",about:"", contact:"", currentUser: req.user});
            
            
        }
    })
});

router.put("/:id", isLoggedIn, (req, res) => {
    geocoder.geocode(req.body.user.location, function (err, data) {
        if (err || !data.length) {
          req.flash('error', 'Invalid address');
          return res.redirect('back');
        }
        Danmag.findByIdAndUpdate(req.params.id, req.body.user, (err, updatedUser) => {
            if(err){
                console.log(err)
            } else {
                let street = data[0].streetName + " " + data[0].streetNumber;
                console.log(street)
                updatedUser.location = data[0].formattedAddress;
                updatedUser.lat = data[0].latitude;
                updatedUser.lng = data[0].longitude;
                updatedUser.postCode = data[0].zipcode;
                updatedUser.city =  data[0].city;
                updatedUser.street = street;
                updatedUser.save();
                res.redirect("/about")
            }
        })
    });
    
})

function isLoggedIn (req, res, next) {
    if(req.isAuthenticated()) {
        return next();
    }
    req.flash("error", "Nie masz dostępu do tej strony");
    res.redirect(`/?return_route=${req._parsedOriginalUrl.path}`);
}

module.exports = router;