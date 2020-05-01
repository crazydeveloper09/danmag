const express 				= require("express"),
	  app     				= express(),
	  bodyParser 			= require("body-parser"),
	  mongoose 				= require("mongoose"),
	  passport 				= require("passport"),
	  LocalStrategy 		= require("passport-local"),
	  async 				= require("async"),
	  crypto 				= require("crypto"),
	  passportLocalMongoose = require("passport-local-mongoose"),
	  flash 				= require("connect-flash"),
	  nodemailer 			= require("nodemailer"),
	  methodOverride 		= require("method-override"),
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


mongoose.connect(process.env.DATABASEURL, {useNewUrlParser: true, useUnifiedTopology: true});

const danmagSchema = new mongoose.Schema({
	username: String,
	email:String,
	password: String,
	resetPasswordToken: String,
	resetPasswordExpires: Date
});
danmagSchema.plugin(passportLocalMongoose);
let Danmag = mongoose.model("Danmag", danmagSchema);

const underPostSchema = new mongoose.Schema({
	title: String,
	profile: String,
	opis: String
});

let UnderPost = mongoose.model("UnderPost", underPostSchema);

const newsSchema = new mongoose.Schema({
	title: String,
	profile: String,
	opis: String,
	pictures: Array,
	underposts: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "UnderPost"
		}
	],
	more: String
});

let News = mongoose.model("News", newsSchema);

const offerSchema = new mongoose.Schema({
	brand: String,
	model: String,
	engine: String,
	year: Number,
	part: String,
	email: String,
	isSent: Boolean
});

let Offer = mongoose.model("Offer", offerSchema);

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());
app.use(require("express-session")({
    secret: "heheszki",
    resave: false,
    saveUninitialized: false
}));
app.use(function(req, res, next) {
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    res.locals.currentUser = req.user;
    next();
});
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(Danmag.authenticate()));
passport.serializeUser(Danmag.serializeUser());
passport.deserializeUser(Danmag.deserializeUser());

app.get("/", function(req, res){
	News.find({}, function(err, news){
		if(err) {
			console.log(err);
		} else {
			
			res.render("index" , {news:news, header: "Danmag-części i akcesoria motoryzacyjne | Start", main:"", currentUser: req.user});
		}
	});
	
});


app.get("/offer/applications/new", function(req, res){
	res.render("./offer/new", { currentUser: req.user, header: "Danmag-części i akcesoria motoryzacyjne | Zapytaj o ofertę", offer:"" });
});

app.get("/offer/applications/search", isLoggedIn, (req, res) => {
	const regex = new RegExp(escapeRegex(req.query.search), 'gi');
	Offer.find({ $and: [
		{
			$or: [{ model: regex }, {brand: regex}]
		}
	]}, (err, offers) => {
		if(err){
			console.log(err)
		} else {
			res.render("./offer/search", {currentUser: req.user, header: "Danmag-części i akcesoria motoryzacyjne | Zapytania o ofertę | Wyszukiwanie", param: req.query.search, offers:offers})
		}
	})
})

app.post("/offer/applications", function(req, res){
	let newOffer = new Offer({
		brand: req.body.brand,
		model: req.body.model,
		engine: req.body.engine,
		year: req.body.year,
		part: req.body.part,
		email: req.body.email,
		isSent: false
	});
	Offer.create(newOffer, function(err, createdOffer){
		if(err){
			console.log(err);
		} else {
			req.flash("success", "Twoje zapytanie o ofertę zostało pomyślnie wysłane. Postaramy się jak najszybciej odpowiedzieć drogą mailową");
			res.redirect("/");
		}
	})
});

app.get("/offer/applications", isLoggedIn, (req, res) => {
	Offer.find({}, (err, offers) => {
		if(err){
			console.log(err);
		} else {
			res.render("./offer/index", {currentUser: req.user, header: "Danmag-części i akcesoria motoryzacyjne | Zapytania o ofertę", offers:offers})
		}
	})
});


app.get("/offer/applications/:id/send", isLoggedIn, (req, res) => {
	Offer.findById(req.params.id, (err, offer) => {
		if(err){
			console.log(err)
		} else {
			res.render("./offer/send", {currentUser: req.user, header: "Danmag-części i akcesoria motoryzacyjne | Zapytania o ofertę | Wyślij ofertę", offer:offer})
		}
	})
});

app.post("/offer/:id/send", isLoggedIn, (req, res) => {
	async.waterfall([
        function(done) {
            Offer.findById(req.params.id, (err, offer) => {
                if(!offer){
                    req.flash("error", "Nie znaleźliśmy takiej oferty");
                    return res.redirect("back");
                }
                
                  
                        
                        offer.isSent = true;
                        offer.save(function(err){
                         
                                done(err, offer);
                            });
                        
               
            });
        },
        function(offer, done){
			const mailgun = require("mailgun-js");
			const DOMAIN = 'mkdportfolio.pl';
			const mg = mailgun({apiKey: process.env.API_KEY, domain: DOMAIN, host:"api.eu.mailgun.net"});
			const data = {
				from: 'Danmag - auto części <danmag@danmag.pl>',
                to: offer.email,
                subject: req.body.topic,
                text: req.body.text
			};
			mg.messages().send(data, function (error, body) {
				req.flash("success", "Oferta została wysłana pomyślnie");
				console.log(error);
                done(error);
			});
            
        }
    ], function(err){
        res.redirect("/offer/applications");
    });
})

app.get("/offer/applications/:id/delete", isLoggedIn, (req, res) => {
	Offer.findByIdAndRemove(req.params.id, (err, deletedOffer) => {
		if(err){
			console.log(err)
		} else {
			res.redirect("/offer/applications")
		}
	})
});

app.get("/forgot", function(req, res){
    res.render("forgot", {header:"Danmag - części i akcesoria motoryzacyjne | Poproś o zmianę hasła"});
});

app.post("/forgot", function(req, res, next){
    async.waterfall([
        function(done) {
            crypto.randomBytes(20, function(err, buf) {
                let token = buf.toString('hex');
                done(err, token);
            });
        },
        function(token, done){
            Danmag.findOne({ email: req.body.email }, function(err, user){
                if(!user){
                    req.flash('error', 'Nie znaleźliśmy konta z takim emailem. Spróbuj ponownie');
                    return res.redirect("/forgot");
                }
                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now() + 360000;
                user.save(function(err){
                    done(err, token, user);
                });
            });
        },
        function(token, user, done) {
            const mailgun = require("mailgun-js");
			const DOMAIN = 'mkdportfolio.pl';
			const mg = mailgun({apiKey: process.env.API_KEY, domain: DOMAIN, host:"api.eu.mailgun.net"});
			const data = {
				from: 'Danmag - auto części <danmag@danmag.pl>',
                to: user.email,
                subject: "Resetowanie hasła na stronie Danmag",
                text: 'Otrzymujesz ten email, ponieważ ty (albo ktoś inny) zażądał zmianę hasła na stronie Danmag. \n\n' + 
                    'Prosimy kliknij w poniższy link albo skopiuj go do paska przeglądarki, by dokończyć ten proces: \n\n' +
                    'https://' + req.headers.host + '/reset/' + token + '\n\n' + 
                    'Jeśli to nie ty zażądałeś zmiany, prosimy zignoruj ten email, a twoje hasło nie zostanie zmienione. \n'
			};
			mg.messages().send(data, function (error, body) {
				req.flash("success", "Email został wysłany na adres " + user.email + " z dalszymi instrukcjami");
				console.log(error);
                done(error);
			});
            
        }
    ], function(err){
        if(err) return next(err);
        res.redirect('/forgot');
    });
});

app.get("/reset/:token", function(req, res){
    Danmag.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() }}, function(err, user){
        if(!user) {
            req.flash("error", "Token wygasł lub jest niepoprawny");
            return res.redirect("/forgot");
        }
        res.render("reset", { token: req.params.token, header:"Danmag - części i akcesoria motoryzacyjne | Resetuj hasło" });
    });
});

app.post("/reset/:token", function(req, res){
    async.waterfall([
        function(done) {
            Danmag.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user){
                if(!user){
                    req.flash("error", "Token wygasł lub jest niepoprawny");
                    return res.redirect("back");
                }
                if(req.body.password === req.body.confirm){
                    user.setPassword(req.body.password, function(err){
                        user.resetPasswordExpires = undefined;
                        user.resetPasswordToken = undefined;
                        user.save(function(err){
                            req.logIn(user, function(err){
                                done(err, user);
                            });
                        });
                    });
                } else {
                    req.flash("error", "Hasła nie pasują do siebie");
                    return res.redirect("back");
                }
            });
        },
        function(user, done){
			const mailgun = require("mailgun-js");
			const DOMAIN = 'mkdportfolio.pl';
			const mg = mailgun({apiKey: process.env.API_KEY, domain: DOMAIN, host:"api.eu.mailgun.net"});
			const data = {
				from: 'Danmag - auto części <danmag@danmag.pl>',
                to: user.email,
                subject: "Potwierdzenie zmiany hasła na stronie Danmag",
                text: 'Witaj ' + user.username + ', \n\n' + 
                'To jest potwierdzenie, że twoje hasło zostało właśnie zmienione'
			};
			mg.messages().send(data, function (error, body) {
				req.flash("success", "Twoje hasło zostało zmienione pomyślnie");
				console.log(error);
                done(error);
			});
            
        }
    ], function(err){
        res.redirect("/");
    });
});

app.post("/login", passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true
}), function(req, res) {

});
app.get("/logout", function(req, res) {
    req.logout();
    res.redirect("/login");
});
app.get("/login", function(req, res){
	res.render("login", {header: "Danmag-części i akcesoria motoryzacyjne | Logowanie", currentUser: req.user})
});
/*
app.get("/register", function(req, res){
	res.render("register", {header: "Danmag-części i akcesoria motoryzacyjne | Rejestracja", currentUser: req.user})
});

app.post("/register", function(req, res){
    let newUser = new Danmag({
        username: req.body.username,
		email:req.body.email
    });
    Danmag.register(newUser, req.body.password, function(err, user) {
        if(err) {
            
            return res.render("register", {header: "Danmag-części i akcesoria motoryzacyjne | Rejestracja"});
        } 
        passport.authenticate("local")(req, res, function() {
            
            res.redirect("/login");
        });
    });
});
*/
app.get("/news/search", function(req, res){
	const regex = new RegExp(escapeRegex(req.query.title), 'gi');
	News.find({title: regex}, function(err, foundedNews){
		if(err){
			console.log(err);
		} else {
			res.render("./news/search", { news: foundedNews, currentUser: req.user, header: "Danmag-części i akcesoria motoryzacyjne | Wyszukiwanie nowinek dla parametru: " + req.query.title, param: req.query.title})
		}
	});
});


app.get("/about", function(req, res){
	res.render("about", {header: "Danmag-części i akcesoria motoryzacyjne | O firmie", about:"", currentUser: req.user});
});

app.get("/contact", function(req, res){
	res.render("contact", {header: "Danmag-części i akcesoria motoryzacyjne | Kontakt",about:"", contact:"", currentUser: req.user});
});

app.get("/zakuwanie", function(req, res){
	res.render("zakuwanie", {header: "Danmag-części i akcesoria motoryzacyjne | Zakuwanie przewodów", zakuwanie:"", currentUser: req.user});
});

app.get("/privacy-policy", function(req, res){
	res.render("privacy", {header: "Danmag-części i akcesoria motoryzacyjne | Polityka prywatności", currentUser: req.user});
});

app.get("/news/new", isLoggedIn, function(req, res){
	News.find({}, function(err, news){
		if(err) {
			console.log(err);
		} else {
			UnderPost.find({}, function(err, underposts){
				if(err) {
					console.log(err);
				} else {
					res.render("./news/new" , {news:news, underposts:underposts});
				}
			});
			
		}
	});
	
});
app.get("/news", function(req, res){
	News.find({}, function(err, news){
		if(err) {
			console.log(err);
		} else {
			res.render("./news/index", {news:news, header: "Danmag-części i akcesoria motoryzacyjne | Nowinki", newse:"", currentUser: req.user});
		}
	});
	
});

app.get("/administrator", function(req, res){
	res.redirect("http://danmag.pl/administrator");
});

app.post("/news", upload.single('profile'), function(req, res){
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
app.post("/news/edit/picture", upload.single("picture"), function(req, res){
   
    cloudinary.uploader.upload(req.file.path, function(result) {
      
        News.findOne({title: req.body.title}, function(err, news){
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

app.get("/news/:id/edit", isLoggedIn, function(req, res){
	News.findOne({more:req.params.id}, function(err, news){
		if(err) {
			console.log(err);
		} else {
			res.render("./news/edit", {news: news, header: "Danmag-części i akcesoria motoryzacyjne | Edytowanie nowinki", currentUser: req.user});
		}
	});
	
});

app.get("/news/:id", function(req, res){
	News.findOne({more:req.params.id}).populate("underposts").exec(function(err, news){
		if(err) {
			console.log(err);
		} else {
			
			res.render("./news/show", {news: news, header: "Danmag-części i akcesoria motoryzacyjne | " + news.title, currentUser: req.user});
		}
	});
});

app.put("/news/:id", isLoggedIn, function(req, res){
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

app.get("/news/:news_id/underposts/new", isLoggedIn, function(req, res){
	res.render("./underposts/new", {currentUser: req.user, header: "Danmag-części i akcesoria motoryzacyjne | Dodawanie podposta", news_id: req.params.news_id})
});

app.get("/news/:news_id/underposts/:underpost_id/edit", isLoggedIn, function(req, res){
	UnderPost.findById(req.params.underpost_id, function(err, underpost){
		if(err){
			console.log(err)
		} else {
			res.render("./underposts/edit", {currentUser: req.user, news_id: req.params.news_id, header: "Danmag - części i akcesoria motoryzacyjne | Edytowanie podpostu", underpost: underpost})
		}
	});
});

app.put("/news/:news_id/underposts/:underpost_id", isLoggedIn, function(req, res){
	UnderPost.findByIdAndUpdate(req.params.underpost_id, req.body.underpost, function(err, updatedPost){
		if(err){
			console.log(err);
		} else {
			res.redirect("/news/" + req.params.news_id)
		}
	});
})

app.get("/news/:news_id/underposts/:underpost_id/delete", isLoggedIn, function(req, res){
	UnderPost.findByIdAndRemove(req.params.underpost_id, function(err, updatedPost){
		if(err){
			console.log(err);
		} else {
			res.redirect("/news/" + req.params.news_id)
		}
	});
})

app.get("/news/:id/delete", isLoggedIn, function(req, res){
	News.findByIdAndDelete(req.params.id, function(err, deletedNews){
		if(err) {
			console.log(err);
		} else {
			res.redirect("/");
		}
	});
});

app.post("/news/new/picture", upload.single('picture'), function(req, res){
	cloudinary.uploader.upload(req.file.path, function(result) {
		News.find({title: req.body.title}, function(err, news){
			if(err) {
				console.log(err);
			} else {
				news[0].pictures.push(result.secure_url);
				news[0].save();
				res.redirect("/");
			}
		});
	});
	
});

app.post("/underposts/:news_id", upload.single('profile') ,function(req, res) {
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

app.get("*", function(req, res){
	res.render("error", {header: "Danmag-części i akcesoria motoryzacyjne | Strona nie istnieje"});
});

function isLoggedIn (req, res, next) {
    if(req.isAuthenticated()) {
        return next();
    }
    req.flash("error", "Nie masz dostępu do tej strony");
    res.redirect("/");
}

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};


app.listen(process.env.PORT)