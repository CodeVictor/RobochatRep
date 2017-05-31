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

var datosContacto = mongoose.model('datoscontactos', contacto);

var infoCursos = new mongoose.Schema({
     Nombre : {type : String},
     Catedratico : {type : String},
     CodigoUMG : {type : String}
});

var Curso = mongoose.model('cursos', infoCursos);

objCalculator = {
  SumarNumero: function(a, b){
    return a + b;
  },

  RestarNumero: function(a, b){
    return a - b;
  }

}

// Setup LUIS
const recognizer = new builder.LuisRecognizer('https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/72fa543d-9617-41a4-ad3c-69216dfe7f77?subscription-key=cdaada34237d4892b96117988297f8c6&timezoneOffset=0&verbose=true&q=');
const intents = new builder.IntentDialog({ recognizers: [recognizer] });

var nombre;
var numeroAdivina = Math.floor(Math.random()*(objCalculator.RestarNumero(100, 1))) + 1;
var numeroAdivinaDos;
intents.matches('Saludar', [
    function (session) {
        builder.Prompts.text(session, 'Hola ¿Como te llamas?');
    },
    function (session, results) {
        nombre = results.response;
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


intents.matches('JugarAdivinar', [
    function (session) {
        builder.Prompts.text(session, 'Excelente, ¿Quien quieres que adivine primero?');
    },
    function (session, results) {
        if(results.response =='Yo' || results.response == 'yo'){
              builder.Prompts.text(session,'Genial, empieza entonces');

              }else if (results.response == 'Tu'|| results.response == 'tu'){
                 builder.Prompts.text(session, 'OK, Piensa en tu numero');
              }
    }, 
    function(session, results){
        if(results.response == 'Ya, empieza'){
              session.beginDialog('/seguirAdivinando');
        }else{
        var respuesta = parseInt(results.response);
                if(respuesta > numeroAdivina){
                    session.send('No, ese no es, mi numero es menor');
                    session.beginDialog('/seguirPidiendo');
                }else if (respuesta < numeroAdivina){
                    session.send('No, ese no es, mi numero es mayor');
                    session.beginDialog('/seguirPidiendo');
                }else{
                    session.send('Has adivinado el numero');
                }
            }
        
    }


]);

bot.dialog('/seguirPidiendo', [
    function (session) {
        builder.Prompts.text(session, 'Sigue intentando');

    },
 function(session, results){
    if(results.response == 'terminemos'){
         session.send('Te cansaste, no eres digno, jajaja');
    }else {
        var respuesta = parseInt(results.response);
                if(respuesta > numeroAdivina){
                    session.send('No, ese no es, mi numero es menor');
                    session.beginDialog('/seguirPidiendo');
                }else if (respuesta < numeroAdivina){
                    session.send('No, ese no es, mi numero es mayor');
                    session.beginDialog('/seguirPidiendo');
                }else{
                    session.send('Has adivinado el numero');
                    session.endDialog();
                }
    }
    }
]);

bot.dialog ('/seguirAdivinando', [
  function(session){
    numeroAdivinaDos = Math.floor(Math.random()*(objCalculator.RestarNumero(15, 1)))+1;
    builder.Prompts.text(session, numeroAdivinaDos.toString()); 


  },
  function(session, results){
     if(results.response == 'no, ese no es'){
           session.beginDialog('/seguirAdivinando');
     }else if (results.response == 'adivinaste'){
           session.endDialog();
     }else if (results.response == 'ya no quiero seguir'){
        session.send('Bien');
        session.endDialog();
     }

  }
]);

intents.matches('Agradecer', function(session, results){

   session.send('De nada %s siempre es un gusto ayudar', nombre);

});

intents.matches('ConsultarTelefono', function(session, args, results){
     const entitytelefono = builder.EntityRecognizer.findEntity(args.entities, 'Persona');

     var persons = datosContacto.findOne({nombre : entitytelefono.entity}, function(err, personita){
         if(err){
            return handleError(err);
         }else if (personita === null){
            session.send('No tienes a esa persona en tu agenda');
         }else
         {
            session.send(personita.telefono.toString());
         }

     });
});

intents.matches('ConsultarCatedratico',  function(session, args, results){
    const entitycatedratico = builder.EntityRecognizer.findEntity(args.entities, 'Cursos');

     Curso.findOne({Nombre : entitycatedratico.entity.toUpperCase()}, function(err, cursito){
         if(err){
            return handleError(err);
         }else if (cursito === null){
            session.send('No tienes a esa persona en tu agenda');
         }else
         {
            var inicio = 'Ing. ';
            var total = inicio.concat(cursito.Catedratico.toUpperCase())
            session.send(total);
         }

     });
});

intents.matches('ConcultarCurso', function(session, args, results){
     const obteniendoCurso = builder.EntityRecognizer.findEntity(args.entities, 'Catedratico');

     Curso.find({Catedratico : obteniendoCurso.entity.toLowerCase()},function(err, todosCursos){
         if(err){
            return handleError(err);
         }else if(todosCursos === null){
            session.send('No hay datos, lo siento');
         }else {

                 for (i =0; i < todosCursos.length; i++){
                        session.send(todosCursos[i].Nombre);
                 }
         }

     });

});

intents.onDefault(builder.DialogAction.send('No he entendido lo que quieres decir'));


bot.dialog('/', intents);





