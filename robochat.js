const builder = require('botbuilder');
const restify = require('restify');
const mongoose = require('mongoose');


const server = restify.createServer();

server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s escuchando %s', server.name, server.url);
});
// Setup bot
const connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
const bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());




var url = 'mongodb://localhost:27017/DatosGeneralesContacto';
mongoose.connect(url);

var contacto = new mongoose.Schema({
        nombre : {type: String},
        telefono : {type: Number}
});

var datosContacto = mongoose.model('datoscontacto', contacto);


// Setup LUIS
const recognizer = new builder.LuisRecognizer('https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/72fa543d-9617-41a4-ad3c-69216dfe7f77?subscription-key=cdaada34237d4892b96117988297f8c6&timezoneOffset=0&verbose=true&q=');
const intents = new builder.IntentDialog({ recognizers: [recognizer] });



intents.matches('Saludar', [
    function (session) {
        builder.Prompts.text(session, 'Hola ¿Como te llamas?');
    },
    function (session, results) {
        session.send('Hola %s!', results.response);
    }
]);



intents.matches('Despedir', function (session, results) {
    session.send('Adiós! gracias por charlar');
});


intents.matches('SaberHora', function(session,results){

       var fecha =new Date();
       hora =fecha.getHours()+":"+fecha.getMinutes()+":"+fecha.getSeconds(); 
        session.send("La hora es %s", hora);

});

intents.matches('Pedirfavor', function(session, results){
    session.send('Claro, ¿En que puedo ayudarte?');
});


intents.matches('Guardarcontactos', function (session, args, next, results) {
    const entityPersona = builder.EntityRecognizer.findEntity(args.entities, 'Persona');
    const entityNumero = builder.EntityRecognizer.findEntity(args.entities, 'Numero Telefonico');
   
    var nuevo = new datosContacto ({
        nombre : entityPersona.entity,
        telefono : entityNumero.entity
    });

    nuevo.save(function(err, results){
        session.send('Tu contacto se ha aguardado');
    });
   
  });


intents.onDefault(builder.DialogAction.send('No he entendido lo que quieres decir'));


bot.dialog('/', intents);





