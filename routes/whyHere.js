const express = require("express"),
    WhyHere = require("../models/whyHere"),
    Zakuwanie = require("../models/zakuwanie"),
    Danmag = require("../models/danmag"),
    methodOverride = require("method-override"),
    app = express(),
    flash = require("connect-flash"),
    router = express.Router({mergeParams: true});
app.use(flash());
app.use(methodOverride("_method"));
let admin_username = "Paweł";
router.get("/redirect", isLoggedIn, (req, res) => {
    Zakuwanie.findById(req.params.zakuwanie_id, (err, zakuwanie) => {
        if(err){
            console.log(err)
        } else {
            Danmag.findOne({username: admin_username}, (err, admin) => {
                let header = `Danmag - części i akcesoria motoryzacyjne | ${zakuwanie.title} | Redirect page`;
                res.render("./whyHere/redirect", {admin:admin,header: header, zakuwanieSubpage:"",zakuwanie: zakuwanie, currentUser: req.user})
            });
           
        }
    })
})

router.get("/add", isLoggedIn, (req, res) => {
    Zakuwanie.findById(req.params.zakuwanie_id, (err, zakuwanie) => {
        if(err){
            console.log(err)
        } else {
            Danmag.findOne({username: admin_username}, (err, admin) => {
                let header = `Danmag - części i akcesoria motoryzacyjne | ${zakuwanie.title} | Dodaj powód dlaczego tutaj`;
                res.render("./whyHere/new", {admin:admin,header: header, zakuwanieSubpage:"",zakuwanie: zakuwanie, currentUser: req.user})
            });
            
        }
    })
})

router.post("/", isLoggedIn, (req, res) => {
    Zakuwanie.findById(req.params.zakuwanie_id, (err, zakuwanie) => {
        if(err){
            console.log(err)
        } else {
            WhyHere.create({title:req.body.title,description: req.body.text}, (err, createdwhyHere) => {
                if(err) {
                   console.log(err);
                } else {
                    zakuwanie.whyHere.push(createdwhyHere);
                    zakuwanie.save();
                    res.redirect(`/zakuwanie/${zakuwanie._id}/whyHere/redirect`);
                }
           })
        }
    })
})


router.get("/:whyHere_id/edit", isLoggedIn, (req, res) => {
    Zakuwanie.findById(req.params.zakuwanie_id, (err, zakuwanie) => {
        if(err) {
            console.log(err)
        } else {
            WhyHere.findById(req.params.whyHere_id, (err, whyHere) => {
                if(err){
                    console.log(err)
                } else {
                    Danmag.findOne({username: admin_username}, (err, admin) => {
                        let header = `Danmag - części i akcesoria motoryzacyjne | Zakuwanie | Edytuj dlaczego tutaj`;
                        res.render("./whyHere/edit", {admin:admin,header: header, zakuwanieSubpage:"",zakuwanie: zakuwanie, whyHere:whyHere, currentUser: req.user})
                    });
                    
                }
            })
        }
    });
   
});

router.put("/:whyHere_id", isLoggedIn, (req, res) => {
    Zakuwanie.findById(req.params.zakuwanie_id, (err, zakuwanie) => {
        if(err) {
            console.log(err)
        } else {
            WhyHere.findByIdAndUpdate(req.params.whyHere_id, req.body.whyHere, (err, updatedwhyHere) => {
                if(err){
                    console.log(err);
                } else {
                    res.redirect(`/zakuwanie`);
                }
            })
        }
    })
  
});

router.get("/:whyHere_id/delete", isLoggedIn, (req, res) => {
    Zakuwanie.findById(req.params.zakuwanie_id, (err, zakuwanie) => {
        if(err) {
            console.log(err)
        } else {
            WhyHere.findByIdAndRemove(req.params.whyHere_id, (err, updatedwhyHere) => {
                if(err){
                    console.log(err);
                } else {
                    res.redirect(`/zakuwanie`);
                }
            })
        }
    })
  
})

function isLoggedIn(req, res, next) {
    if(req.isAuthenticated()) {
        return next();
    }
    req.flash("error", "Nie masz dostępu do tej strony");
    res.redirect(`/?return_route=${req._parsedOriginalUrl.path}`);
}

module.exports = router;