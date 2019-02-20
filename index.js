const express = require("express");
const app = express();
const db = require("./db");
const config = require("./config");
const spicedPg = require("spiced-pg");
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
app.use(
    bodyParser.urlencoded({
        extended: false
    })
);

// app.use(express.static(__dirname + "/public"));

app.use(
    cookieSession({
        secret: config.cookieSecret,
        maxAge: 1000 * 60 * 60 * 24 * 7 * 2
    })
);

var hb = require("express-handlebars");
app.engine("handlebars", hb());

app.set("view engine", "handlebars");

app.get("/register", (req, res) => {
    if (req.session.user != undefined) {
        res.redirect("/petition");
    } else {
        res.render("register", {
            //GIVE IT VALUES HERE
        });
    }
});

app.get("/login", (req, res) => {
    res.render("login", {
        //GIVE IT VALUES HERE
    });
});

app.get("/petition", (req, res) => {
    if (req.session.user == undefined) {
        res.redirect("/register");
    } else {
        if (req.session.signed == undefined) {
            res.render("petition", {
                //GIVE IT VALUES HERE
            });
        } else {
            res.redirect("/thanks");
        }
    }
});

app.get("/thanks", (req, res) => {
    if (req.session.user == undefined) {
        res.redirect("/register");
    }
    if (req.session.signed == undefined) {
        res.redirect("/petition");
    } else {
        db.getCurrentUserSig(req.session.signed)
            .then(function(cur) {
                res.render("thanks", {
                    current: cur.rows[0].sigraphic
                });
            })
            .catch(err => {
                console.log(err);
            });
    }
});

app.get("/signers", (req, res) => {
    if (req.session.user == undefined) {
        res.redirect("/register");
    } else {
        db.getAllSigners()
            .then(quer => {
                for (var i = 0; i < quer.rows.length; i++) {
                    console.log(quer.rows[i].user_id);
                }

                res.render("signers", {
                    results: quer.rows
                });
            })
            .catch(err => {
                console.log(err);
            });
    }
});

app.post("/petition", (req, res) => {
    if (req.body.visual == ``) {
        // console.log(
        //     "req.body.firstname:" +
        //         req.body.firstname +
        //         "req.body.lastname:" +
        //         req.body.lastname +
        //         "req.body.visual:" +
        //         req.body.visual
        // );
        res.render("error", {});
    } else {
        let timestamp = new Date().getTime();
        console.log(req.session.user.user_id);
        db.addSigner(req.body.visual, req.session.user.user_id, timestamp).then(
            function(val) {
                console.log(val.rows[0].id);
                req.session.signed = val.rows[0].id;
                res.redirect("/thanks");
            }
        );
    }
});

app.post("/register", (req, res) => {
    if (
        req.body.firstname == `` ||
        req.body.lastname == `` ||
        req.body.email == `` ||
        req.body.password == ``
    ) {
        res.render("error", {});
    } else {
        let timestamp = new Date().getTime();
        db.addUser(
            req.body.firstname,
            req.body.lastname,
            req.body.email,
            req.body.password,
            timestamp
        )
            .then(function(val) {
                console.log(val.rows[0]);
                req.session.user = val.rows[0];
                res.redirect("/petition");
            })
            .catch(err => {
                console.log(err);
                res.render("error", {});
            });
    }
});

app.post("/login", (req, res) => {
    if (req.body.email == `` || req.body.password == ``) {
        res.render("error", {});
    } else {
        db.fetchUser(req.body.email, req.body.password).then(function(val) {
            console.log(val.rows[0]);
            req.session.user = val.rows[0];
            res.redirect("/petition");
        });
    }
});

// app.post("/login", (req, res) => {
//     res.render("petition", {
//         //GIVE IT VALUES HERE
//     });
// });

app.use(express.static("./public"));

app.listen(8080, () => console.log("Listening!"));

//

//BUILD MAIN
//FIX ERROR HANDLEBAR

//When you want to end the session (i.e, log out the user), you can set req.session to null.
//
//
//
//
//
//
// Since users must be logged in to sign the petition,
// there is no need to ask them for their names on that form.
// Remove those inputs and use the first name and last name that is already stored.

// You should add to this object properties that you are likely to use frequently,
// such as the user's first name, last name, and signature id if the user has signed the petition.
//
// You need to be able to map signatures to users and users to signatures.(user_id)
// You can check for the presence of this object to determine if the user is logged in.
// After users register or log in, you should attach a user object to request.session.
// Both the registration and log in forms can have several errors so you have to be able to
// reload them with error information displayed.
// READ UP ON EVENT EMITTERS FOR SCRIPT.JS
