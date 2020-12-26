const express = require("express"),
    News = require("../models/news"),
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



router.get("/search", function(req, res){
	if(req.query.type === "asynchronous"){
		const regex = new RegExp(escapeRegex(req.query.title), 'gi');
		News.find({title: regex}, function(err, foundedNews){
			if(err){
				console.log(err);
			} else {
				res.json(foundedNews)
			}
		});
	} else {
		const regex = new RegExp(escapeRegex(req.query.title), 'gi');
		News.find({title: regex}, function(err, foundedNews){
			if(err){
				console.log(err);
			} else {
				let header = `Wyszukiwanie aktualności dla parametru ${req.query.type} | Danmag-części i akcesoria motoryzacyjne`;
				res.render("./news/search", {news: foundedNews, currentUser: req.user, header: header, param: req.query.title})
			}
		});
	}
	
});

router.get("/new", isLoggedIn, function(req, res){
	News.find({}, function(err, news){
		if(err) {
			console.log(err);
		} else {
			let header = `Dodaj aktualność | Danmag-części i akcesoria motoryzacyjne`;
			res.render("./news/new" , {news:news, header: header});
		}
	});
	
});
router.get("/", function(req, res){
	News.find({}, function(err, news){
		if(err) {
			console.log(err);
		} else {
			let header = `Aktualności | Danmag-części i akcesoria motoryzacyjne`;
			res.render("./news/index", {news:news, header: header, newse:"", currentUser: req.user});
            
			
		}
	});
	
});

router.get("/:id/edit/picture", isLoggedIn, function(req, res){
   
    News.findById(req.params.id, function(err, news){
		if(err) {
			console.log(err);
		} else {
			let header = `Edytuj zdjęcie główne ${news.title} | Aktualności | Danmag-części i akcesoria motoryzacyjne`;
			res.render("./news/editP", {news: news, header: header});
            
			
		}
	});
});

router.get("/:id/new/picture", isLoggedIn, function(req, res){
    News.findById(req.params.id, function(err, news){
		if(err) {
			console.log(err);
		} else {
			let header = `Dodaj zdjęcie do galerii ${news.title} | Aktualności | Danmag-części i akcesoria motoryzacyjne`;
			res.render("./news/addP", {news: news, header: header});
            
			
		}
	});
	
});


router.post("/", upload.single('profile'), function(req, res){
	if(typeof req.file !== 'undefined'){
		cloudinary.uploader.upload(req.file.path, function(result) {
			let newNews = new News({
				title:req.body.title,
				profile: result.secure_url,
				opis: req.body.description,
				pictures: [],
				underposts: [],
				more: req.body.title.toLowerCase().split(' ').join('-')
			});
			News.create(newNews, function(err, createdNews) {
				if(err) {
					console.log(err);
				} else {
					res.redirect("/");
				}
			})
		});
	} else {
	
			let newNews = new News({
				title:req.body.title,
				opis: req.body.description,
				pictures: [],
				underposts: [],
				more: req.body.title.toLowerCase().split(' ').join('-')
			});
			News.create(newNews, function(err, createdNews) {
				if(err) {
					console.log(err);
				} else {
					res.redirect("/");
				}
			})
		
	}
	
	
});
router.post("/:id/edit/picture", upload.single("picture"), function(req, res){
   
    cloudinary.uploader.upload(req.file.path, function(result) {
      
        News.findById(req.params.id, function(err, news){
            if(err) {
                console.log(err);
            } else {
               news.profile = result.secure_url;
              
               news.save();
                res.redirect("/news/" +news.more);
            }
        });
    });
    
});

router.get("/:id/edit", isLoggedIn, function(req, res){
	News.findOne({more:req.params.id}, function(err, news){
		if(err) {
			console.log(err);
		} else {
			let header = `Edytuj ${news.title} | Aktualności | Danmag-części i akcesoria motoryzacyjne`;
			res.render("./news/edit", {news: news, header: header});
            
			
		}
	});
	
});

router.get("/:id", function(req, res){
	News.findOne({more:req.params.id}).populate(["underposts","pictures"]).exec(function(err, news){
		if(err) {
			console.log(err);
		} else {
			let header = `${news.title} | Aktualności | Danmag-części i akcesoria motoryzacyjne`;
			res.render("./news/show", {news: news, header: header, currentUser: req.user});
            
			
		}
	});
});

router.put("/:id", isLoggedIn, function(req, res){
	News.findByIdAndUpdate(req.params.id, req.body.news, function(err, updatedNews){
		if(err) {
			console.log(err);
		} else {
			updatedNews.more = updatedNews.title.toLowerCase().split(' ').join('-');
			updatedNews.save();
			res.redirect("/news/" + updatedNews.more);
		}
	});
});

router.get("/:id/delete", isLoggedIn, function(req, res){
	News.findByIdAndDelete(req.params.id, function(err, deletedNews){
		if(err) {
			console.log(err);
		} else {
			res.redirect("/");
		}
	});
});

router.post("/:id/new/picture", upload.single('picture'), function(req, res){
	cloudinary.uploader.upload(req.file.path, function(result) {
		News.findById(req.params.id, function(err, news){
			if(err) {
				console.log(err);
			} else {
                Picture.create({source: result.secure_url}, (err, createdPicture) => {
                    news.pictures.push(createdPicture);
                    news.save();
                    res.redirect("/news/" +news.more);
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

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;