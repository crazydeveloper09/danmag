const express = require("express"),
    WhySoImportant = require("../models/whySoImportant"),
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
                res.render("./whySoImportant/redirect", {admin:admin, header:header, zakuwanieSubpage:"",zakuwanie: zakuwanie, currentUser: req.user})
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
                let header = `Danmag - części i akcesoria motoryzacyjne | ${zakuwanie.title} | Dodaj powód dlaczego ważne`;
                res.render("./whySoImportant/new", {admin:admin,header: header, zakuwanieSubpage:"",zakuwanie: zakuwanie, currentUser: req.user})
            });
            
        }
    })
})

router.post("/", isLoggedIn, (req, res) => {
    Zakuwanie.findById(req.params.zakuwanie_id, (err, zakuwanie) => {
        if(err){
            console.log(err)
        } else {
            WhySoImportant.create({description: req.body.text}, (err, createdwhySoImportant) => {
                if(err) {
                   console.log(err);
                } else {
                    zakuwanie.whySoImportant.push(createdwhySoImportant);
                    zakuwanie.save();
                    res.redirect(`/zakuwanie/${zakuwanie._id}/whySoImportant/redirect`);
                }
           })
        }
    })
})


router.get("/:whySoImportant_id/edit", isLoggedIn, (req, res) => {
    Zakuwanie.findById(req.params.zakuwanie_id, (err, zakuwanie) => {
        if(err) {
            console.log(err)
        } else {
            WhySoImportant.findById(req.params.whySoImportant_id, (err, whySoImportant) => {
                if(err){
                    console.log(err)
                } else {
                    Danmag.findOne({username: admin_username}, (err, admin) => {
                        let header = `Danmag - części i akcesoria motoryzacyjne | Zakuwanie | Edytuj dlaczego ważne`;
                        res.render("./whySoImportant/edit", {admin:admin, zakuwanieSubpage:"",zakuwanie: zakuwanie, whySoImportant:whySoImportant, currentUser: req.user})
                    });
                    
                }
            })
        }
    });
   
});

router.put("/:whySoImportant_id", isLoggedIn, (req, res) => {
    Zakuwanie.findById(req.params.zakuwanie_id, (err, zakuwanie) => {
        if(err) {
            console.log(err)
        } else {
            WhySoImportant.findByIdAndUpdate(req.params.whySoImportant_id, req.body.whySoImportant, (err, updatedwhySoImportant) => {
                if(err){
                    console.log(err);
                } else {
                    res.redirect(`/zakuwanie`);
                }
            })
        }
    })
  
});

router.get("/:whySoImportant_id/delete", isLoggedIn, (req, res) => {
    Zakuwanie.findById(req.params.zakuwanie_id, (err, zakuwanie) => {
        if(err) {
            console.log(err)
        } else {
            WhySoImportant.findByIdAndRemove(req.params.whySoImportant_id, (err, updatedwhySoImportant) => {
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