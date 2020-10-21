const express = require("express"),
    Danmag = require("../models/danmag"),
    News = require("../models/news"),
    flash = require("connect-flash"),
    async = require("async"),
    passport = require("passport"),
    crypto = require("crypto"),
    app = express(),
    router = express.Router();

app.use(flash());

 
router.get("/", function(req, res){
	News.find({}, function(err, news){
		if(err) {
			console.log(err);
		} else {
            
			res.render("index" , {news:news, header: "Danmag-części i akcesoria motoryzacyjne | Start", main:"", currentUser: req.user});
            
			
		}
	});
	
});




router.get("/forgot", function(req, res){
    res.render("forgot", {header:"Danmag - części i akcesoria motoryzacyjne | Poproś o zmianę hasła"});
});

router.post("/forgot", function(req, res, next){
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
                    'http://' + req.headers.host + '/reset/' + token + '\n\n' + 
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

router.get("/reset/:token", function(req, res){
    Danmag.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() }}, function(err, user){
        if(!user) {
            req.flash("error", "Token wygasł lub jest niepoprawny");
            return res.redirect("/forgot");
        }
        res.render("reset", { token: req.params.token, header:"Danmag - części i akcesoria motoryzacyjne | Resetuj hasło" });
    });
});

router.post("/reset/:token", function(req, res){
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

router.post("/login", passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true
}), function(req, res) {
    res.redirect(req.query.return_route)
});
router.get("/logout", function(req, res) {
    req.logout();
    res.redirect("/login");
});
router.get("/login", function(req, res){
	res.render("login", {header: "Danmag-części i akcesoria motoryzacyjne | Logowanie", currentUser: req.user})
});

router.get("/register", function(req, res){
	res.render("register", {header: "Danmag-części i akcesoria motoryzacyjne | Rejestracja", currentUser: req.user})
});

router.post("/register", function(req, res){
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







router.get("/privacy-policy", function(req, res){
	res.render("privacy", {header: "Danmag-części i akcesoria motoryzacyjne | Polityka prywatności", currentUser: req.user});
});



router.get("*", function(req, res){
    
    res.render("error", {header: "Danmag-części i akcesoria motoryzacyjne | Strona nie istnieje"});
    
	
});


module.exports = router;