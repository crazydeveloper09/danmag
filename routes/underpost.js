const express = require("express"),
	News = require("../models/news"),
	Danmag = require("../models/danmag"),
    UnderPost = require("../models/underpost"),
    flash = require("connect-flash"),
    methodOverride = require("method-override"),
    app = express(),
    router = express.Router({mergeParams: true}),
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
let admin_username = "Admin";
router.get("/new", isLoggedIn, function(req, res){
	News.findById(req.params.news_id, (err, news) => {
		if(err){
			console.log(err)
		} else {
			let header = `Dodaj podpost | ${news.title} | Aktualności | Danmag-części i akcesoria motoryzacyjne`;
			res.render("./underposts/new", {header: header, news: news})
		}
	})
	
	
	
});

router.get("/:underpost_id/edit", isLoggedIn, function(req, res){
	UnderPost.findById(req.params.underpost_id, function(err, underpost){
		if(err){
			console.log(err)
		} else {
			News.findById(req.params.news_id, (err, news) => {
				if(err){
					console.log(err)
				} else {
					let header = `Edytuj podpost ${underpost.title} | ${news.title} | Aktualności | Danmag-części i akcesoria motoryzacyjne`;
					res.render("./underposts/edit", {news: news, header: header, underpost: underpost})
				}
			})
			
			
			
		}
	});
});

router.put("/:underpost_id", isLoggedIn, function(req, res){
	UnderPost.findByIdAndUpdate(req.params.underpost_id, req.body.underpost, function(err, updatedPost){
		if(err){
			console.log(err);
		} else {
			res.redirect("/news/" + req.params.news_id)
		}
	});
})

router.get("/:underpost_id/delete", isLoggedIn, function(req, res){
	UnderPost.findByIdAndRemove(req.params.underpost_id, function(err, updatedPost){
		if(err){
			console.log(err);
		} else {
			res.redirect("/news/" + req.params.news_id)
		}
	});
})

router.post("/", upload.single('profile') ,function(req, res) {
	if(typeof req.file !== 'undefined'){
		cloudinary.uploader.upload(req.file.path, function(result) {
		let newUnderPost = new UnderPost({
			title: req.body.title,
			profile: result.secure_url,
			opis: req.body.description
		});
		UnderPost.create(newUnderPost, function(err, createdUnderPost) {
			if(err) {
				console.log(err);
			} else {
				News.findById(req.params.news_id, function(err, findedNews){
					if(err) {
						console.log(err);
					} else {
						console.log(findedNews);
						findedNews.underposts.push(createdUnderPost);
						findedNews.save();
						res.redirect("/news/" + findedNews.more);
					}
				});
				
			}
		})
	});
	} else {
		 
		let newUnderPost = new UnderPost({
			title: req.body.title,
			profile: "",
			opis: req.body.description
		});
		UnderPost.create(newUnderPost, function(err, createdUnderPost) {
			if(err) {
				console.log(err);
			} else {
				News.findById(req.params.news_id, function(err, findedNews){
					if(err) {
						console.log(err);
					} else {
						console.log(findedNews);
						findedNews.underposts.push(createdUnderPost);
						findedNews.save();
						res.redirect("/news/" + findedNews.more);
					}
				});
				
			}
		})
	
	}
	
	
});


function isLoggedIn (req, res, next) {
    if(req.isAuthenticated()) {
        return next();
    }
    req.flash("error", "Nie masz dostępu do tej strony");
    res.redirect(`/?return_route=${req._parsedOriginalUrl.path}`);
}

module.exports = router;