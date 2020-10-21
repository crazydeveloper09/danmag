const express 				= require("express"),
	  app     				= express(),
	  bodyParser 			= require("body-parser"),
	  mongoose 				= require("mongoose"),
	  Danmag 				= require("./models/danmag"),
	  methodOverride 		= require("method-override"),
	  newsRoutes 			= require("./routes/news"),
	  underpostRoutes 			= require("./routes/underpost"),
	  aboutRoutes 			= require("./routes/about"),
	  offerRoutes 			= require("./routes/offer"),
	  apiRoutes 			= require("./routes/api"),
	  zakuwanieRoutes 			= require("./routes/zakuwanie"),
	  whyHereRoutes 			= require("./routes/whyHere"),
	  whySoImportantRoutes 			= require("./routes/whySoImportant"),
	  indexRoutes 			= require("./routes/index"),
	  passport 				= require("passport"),
	  LocalStrategy 		= require("passport-local"),
	  flash 				= require("connect-flash");


mongoose.connect(process.env.DATABASEURL, {useNewUrlParser: true, useUnifiedTopology: true});

let username ="Admin";
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"));
app.use(flash());
app.use(methodOverride("_method"))
app.use(require("express-session")({
    secret: "heheszki",
    resave: false,
    saveUninitialized: false
}));
app.use(function(req, res, next) {
	res.locals.admin_username = "Admin";
	res.locals.return_route = req.query.return_route;
	res.locals.route = req.path;
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



app.use("/news", newsRoutes);
app.use("/offer/applications", offerRoutes);
app.use("/about", aboutRoutes);
app.use("/news/:news_id/underposts", underpostRoutes);
app.use("/zakuwanie", zakuwanieRoutes);
app.use("/zakuwanie/:zakuwanie_id/whyHere", whyHereRoutes);
app.use("/zakuwanie/:zakuwanie_id/whySoImportant", whySoImportantRoutes);
app.use("/api", apiRoutes)
app.use(indexRoutes);
app.listen(process.env.PORT)