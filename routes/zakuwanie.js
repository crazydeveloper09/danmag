const express = require("express"),
    Zakuwanie = require("../models/zakuwanie"),
	Picture = require("../models/picture"),
	Danmag = require("../models/danmag"),
    flash = require("connect-flash"),
    methodOverride = require("method-override"),
    app = express(),
    router = express.Router(),
    multer 				= require("multer"),
    dotenv 				= require("dotenv");
    dotenv.config();

var storage = multer.diskStorage({
    filename: function(req, file, callback) {
        callback(null, Date.now() + file.originalname);
    }
});
var imageFilter = function (req, file, cb) {
// accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'syberiancats', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

app.use(flash());
app.use(methodOverride("_method"));



router.get("/new", isLoggedIn, function(req, res){
	Zakuwanie.find({}, function(err, zakuwanie){
		if(err) {
			console.log(err);
		} else {
			
			res.render("./zakuwanie/new" , {currentUser: req.user, header:"Danmag - części i akcesoria motoryzacyjne | Nowe zakuwanie"});
		}
	});
	
});




router.post("/", upload.single('profile'), function(req, res){
	if(typeof req.file !== 'undefined'){
		cloudinary.uploader.upload(req.file.path, function(result) {
			let newzakuwanie = new Zakuwanie({
				title:req.body.title,
				profile: result.secure_url,
				offer: req.body.offer,
			});
			Zakuwanie.create(newzakuwanie, function(err, createdzakuwanie) {
				if(err) {
					console.log(err);
				} else {
					res.redirect("/zakuwanie");
				}
			})
		});
	} else {
	
			let newzakuwanie = new Zakuwanie({
				title:req.body.title,
				offer: req.body.offer,
			});
			Zakuwanie.create(newzakuwanie, function(err, createdzakuwanie) {
				if(err) {
					console.log(err);
				} else {
					res.redirect("/zakuwanie");
				}
			})
		
	}
	
	
});

router.get("/:id/edit/picture", isLoggedIn, function(req, res){
   
    Zakuwanie.findById(req.params.id, function(err, zakuwanie){
		if(err) {
			console.log(err);
		} else {
			
			res.render("./zakuwanie/editP", {zakuwanie: zakuwanie, header: "Danmag-części i akcesoria motoryzacyjne | Edytowanie zdjęcia głównego", currentUser: req.user});
			
			
		}
	});
});

router.get("/:id/new/picture", upload.single('picture'), function(req, res){
    Zakuwanie.findById(req.params.id, function(err, zakuwanie){
		if(err) {
			console.log(err);
		} else {
			
			res.render("./zakuwanie/addP", {zakuwanie: zakuwanie, header: "Danmag-części i akcesoria motoryzacyjne | Zakuwanie | Do0daj zdjęcie do galerii", currentUser: req.user});
			
			
		}
	});
	
});
router.post("/:id/edit/picture", upload.single("picture"), function(req, res){
   
    cloudinary.uploader.upload(req.file.path, function(result) {
      
        Zakuwanie.findById(req.params.id, function(err, zakuwanie){
            if(err) {
                console.log(err);
            } else {
               zakuwanie.profile = result.secure_url;
              
               zakuwanie.save();
                res.redirect("/zakuwanie");
            }
        });
    });
    
});

router.get("/:id/edit", isLoggedIn, function(req, res){
	Zakuwanie.findById(req.params.id, function(err, zakuwanie){
		if(err) {
			console.log(err);
		} else {
			
			res.render("./zakuwanie/edit", {zakuwanie: zakuwanie, header: "Danmag-części i akcesoria motoryzacyjne | Edytowanie zakuwanie", currentUser: req.user});
			
			
		}
	});
	
});

router.get("/", function(req, res){
	Zakuwanie.find({}).populate(["gallery", "whyHere", "whySoImportant"]).exec(function(err, zakuwanie){
		if(err) {
			console.log(err);
		} else {
			
			res.render("./zakuwanie/show", {zakuwanie: zakuwanie, header: "Danmag-części i akcesoria motoryzacyjne | " + zakuwanie.title, currentUser: req.user});
			
			
		}
	});
});

router.put("/:id", isLoggedIn, function(req, res){
    
    Zakuwanie.findByIdAndUpdate(req.params.id, req.body.zakuwanie, function(err, updatedzakuwanie){
		if(err) {
			console.log(err);
		} else {
			updatedzakuwanie.more = updatedzakuwanie.title.toLowerCase().split(' ').join('-');
			updatedzakuwanie.save();
			res.redirect("/zakuwanie");
		}
	});
});

router.get("/:id/delete", isLoggedIn, function(req, res){
	Zakuwanie.findByIdAndDelete(req.params.id, function(err, deletedzakuwanie){
		if(err) {
			console.log(err);
		} else {
			res.redirect("/");
		}
	});
});

router.post("/:id/new/picture", upload.single('picture'), function(req, res){
	cloudinary.uploader.upload(req.file.path, function(result) {
		Zakuwanie.findById(req.params.id, function(err, zakuwanie){
			if(err) {
				console.log(err);
			} else {
                Picture.create({source: result.secure_url}, (err, createdPicture) => {
                    zakuwanie.gallery.push(createdPicture);
                    zakuwanie.save();
                    res.redirect("/zakuwanie");
                })
				
			}
		});
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