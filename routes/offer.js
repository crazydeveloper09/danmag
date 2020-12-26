const express = require("express"),
	Offer = require("../models/offer"),
	Danmag = require("../models/danmag"),
    flash = require("connect-flash"),
    async = require("async"),
    app = express(),
    router = express.Router();

app.use(flash());


router.get("/new", function(req, res){
	let header = `Zapytaj o ofertę | Danmag-części i akcesoria motoryzacyjne`;
	res.render("./offer/new", {header: header });
	
	
});

router.get("/search", isLoggedIn, (req, res) => {
	const regex = new RegExp(escapeRegex(req.query.search), 'gi');
	Offer.find({ $and: [
		{
			$or: [{ model: regex }, {brand: regex}]
		}
	]}, (err, offers) => {
		if(err){
			console.log(err)
		} else {
			let header = `Wyszukiwanie | Zapytania o ofertę | Danmag-części i akcesoria motoryzacyjne`;
			res.render("./offer/search", {currentUser: req.user, header: header, param: req.query.search, offers:offers})
		}
	})
})

router.post("/", function(req, res){
	async.waterfall([
		function(done) {
			let newOffer = new Offer({
				brand: req.body.brand,
				model: req.body.model,
				engine: req.body.engine,
				engineCategory: req.body.category,
				vin: req.body.vin,
				year: req.body.year,
				part: req.body.part,
				email: req.body.email,
				isSent: false,
				date: Date.now()
			});
			Offer.create(newOffer, function(err, createdOffer){
				if(err){
					console.log(err);
				} else {
					
					done(err, createdOffer)
				}
			})
		},
		function(createdOffer, done){
			const mailgun = require("mailgun-js");
			const DOMAIN = 'mkdportfolio.pl';
			const mg = mailgun({apiKey: process.env.API_KEY, domain: DOMAIN, host:"api.eu.mailgun.net"});
			const data = {
				from: 'Danmag - auto części <danmag@danmag.pl>',
                to: "cruziu@go2.pl",
                subject: "Nowe zapytanie o ofertę",
				text: 'Właśnie dostałeś nowe zapytanie o ofertę \n\n' +
				'Marka: ' + createdOffer.brand + '\n' +
				'Model: ' + createdOffer.model + '\n' +
				'Silnik: ' + createdOffer.engine + '\n' +
				'Rok: ' + createdOffer.year + '\n' +
				'Rodzaj silnika: ' + createdOffer.engineCategory + '\n' +
				'Numer VIN: ' + createdOffer.vin + '\n' +
				'Część: ' + createdOffer.part + '\n' +
				'Email: ' + createdOffer.email + '\n' 
			};
			mg.messages().send(data, function (error, body) {
				req.flash("success", "Twoje zapytanie o ofertę zostało pomyślnie wysłane. Postaramy się jak najszybciej odpowiedzieć drogą mailową");
				console.log(error);
                done(error);
			});
            
		}
	], function(err){
        res.redirect("/");
    });
	
});

router.get("/", isLoggedIn, (req, res) => {
	Offer.find({}, (err, offers) => {
		if(err){
			console.log(err);
		} else {
			let header = `Zapytania ofertę | Danmag-części i akcesoria motoryzacyjne`;
			res.render("./offer/index", {currentUser: req.user, header: header, offers:offers})
            
			
		}
	})
});


router.get("/:id/send", isLoggedIn, (req, res) => {
	Offer.findById(req.params.id, (err, offer) => {
		if(err){
			console.log(err)
		} else {
			let header = `Wyślij ofertę | Zapytania o ofertę | Danmag-części i akcesoria motoryzacyjne`;
			res.render("./offer/send", { header: header, offer:offer})
            
			
		}
	})
});

router.post("/offer/:id/send", isLoggedIn, (req, res) => {
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

router.get("/:id/delete", isLoggedIn, (req, res) => {
	Offer.findByIdAndRemove(req.params.id, (err, deletedOffer) => {
		if(err){
			console.log(err)
		} else {
			res.redirect("/offer/applications")
		}
	})
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