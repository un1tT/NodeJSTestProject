const mongoose = require("mongoose");
const express = require("express");
const multer = require("multer");
const xml2js = require("xml2js");
const js2xmlparser = require("js2xmlparser");

var Schema = mongoose.Schema;
const db = mongoose.connection;
const port = 3000;
const upload = multer();

const app = express();

app.set("view engine","ejs");
app.get("/",(request,response) =>response.render("index"));
app.get("/exchangedata",(request,response) => {
    mongoose.model("Client").find(function(err,clients){
        if(err)console.log(err);
        let newClient = JSON.parse(JSON.stringify(clients));
        newClient = newClient.map(({ name, surname, dateOfBirth, accounts, cards }) => {
            return {
                name,
                surname,
                dateOfBirth,
                accounts: {
                    account: accounts.map(({ _id, ...args }) => ({ ...args }))
                },
                cards: {
                    card: cards.map(({ _id, ...args }) => ({ ...args }))
                }
            }
        });

        const result = js2xmlparser.parse("clients", { client: newClient });

        response.attachment('clients.xml');
        response.type('xml');
        response.charset='UTF-8';
        response.send(result);
    })
    
    
    
});
app.post("/exchangedata", upload.single("file"), (request,response) => {
    const string = request.file.buffer.toString();
    let parser = new xml2js.Parser({explicitArray : false});
    parser.parseString(string,function(err,result){ 
        result.clients.client.forEach(client => {
            const newClient = Object.assign({}, client);
            newClient.accounts = newClient.accounts.account;
            newClient.cards = newClient.cards.card;

            const tempClient = new clientModel(newClient);
            tempClient.save(function (err, client) {
                if (err) return console.error(err);
                console.log(tempClient.name + " saved to clients collection.");
            });
        });
        response.send("File has been imported and converted to JSON");
    });
});



mongoose.connect("mongodb://nodejs_bank_dbUSER:12129898v@ds215563.mlab.com:15563/nodejs_bank_db",{ useNewUrlParser: true });

const clientSchema = new Schema({
        
    name: String, 
    surname: String,
    dateOfBirth: Date,
    adress: String,
    phone: Number,
    passport: String,
    accounts:[
        {
            currency: String,
            balance: Number,
        }              
    ],
    cards: [
        {
            number: String,
            expirationDate: Date,
            currency: String,
            balance: Number,
        }
    ]
        
     
},{ collection: 'Clients' });

const clientModel = mongoose.model("Client",clientSchema)

db.once("open",function(){
    app.listen(port,()=>console.log(`Server is listening on port ${port}`))
});

