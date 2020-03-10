var express = require("express");
var app = express();
var mongoose = require("mongoose");
var handlebars = require("express-handlebars");
var session = require("express-session");
var cors=require("cors");

//esto se usa como un middlewares 
app.use(session({secret:"fgdsdfg"}));

mongoose.Promise = global.Promise //con esto lo puedo trabajar como una promisse normal

//promise then opcion 2
/*
mongoose.connect(
    "mongodb://10.5.20.78:27017", //si se coneta directo desde mi compu es local host
    { useNewUrlParser: true }
).then(function () {
    console.log("conectado")
})*/

app.engine('handlebars', handlebars());
app.set('view engine', 'handlebars');
app.use(cors())

//promise async await opcion 1
async function conectar() {
    await mongoose.connect(
        "mongodb://localhost/curso", //si se coneta directo desde mi compu es local host
        //"mongodb://10.128.35.136:27017/curso",
        {useNewUrlParser: true}
    )
    console.log("conectado")
}
conectar();


//el esquema es la estructura(info que metemos en la base de datos) de lo que quiero guardar
//el esquema es un json
const ArtistaSchema = mongoose.Schema({
    nombre: String,
    apellido: String
})

//el model representa lo que guardo en la base de datos osea la interaccion
const ArtistaModel = mongoose.model('Artista',
    ArtistaSchema);
/*clase 26/02 no tenia handlebars
app.get("/", async function (req, res) {
    var listado = await ArtistaModel.find();
    res.send(listado);
});
*/

const usuarioSchema = mongoose.Schema ({
    username: String,
    password: String,
    email: String
});

const usuariomodel = mongoose.model("usuario", usuarioSchema);

//esto me sirve para crear un usuario, se corre una vez y dsps se comenta
/*const usuarioModel = mongoose.model('usuario', usuarioSchema);
usuarioModel.create({
    username: 'admin',
    password: 'admin123',
    email: 'admin@gmail.com
});*/

//recibe la info de un formulario
//esto tiene que ir si o si sino no  muestra nada en pantalla

app.use(express.urlencoded({extended:true})); //esto es para formulario
app.use(express.json()); //esto es para json, te completa el body(transforma el json al body para poder acceder)

//de aca para arriba es casi copy paste


app.get("/listado", async function (req, res) {
    if (!req.session.user_id){
        res.redirect("/login");
        return
    }
    var abc = await ArtistaModel.find().lean();
    res.render("listado", { listado: abc });
});

app.get("/buscar/:id", async function (req, res) {
    var listado = await ArtistaModel.find({ _id: req.params.id });
    res.send(listado);
});


//esta es una ruta que pide el formulario y se lo devuelve al navegador
app.get("/alta", function (req, res) {
    res.render('formulario');
});
//esto recibe la info del get/alta
app.post("/alta", async function(req,res){
    if (req.body.nombre==""){
        res.render("formulario",{
            error:"el nombre y apellido es obligatorio",
            datos:{
                nombre: req.body.nombre,
                apellido: req.body.apellido
            }
        });
        return;
    }
    await ArtistaModel.create({
        nombre: req.body.nombre ,
        apellido: req.body.apellido
    });
    res.redirect("/listado"); //cuando se re direcciona va por get automaticamente
});

app.get("/editar/:id", async function (req, res) {
    var artista = await ArtistaModel.findById(
        //: id se transforma en lo de abajo req.params.id
        { _id: req.params.id }
    ).lean();
    res.render("formulario", {datos: artista});
});

app.post("/editar/:id", async function(req,res){
    if (req.body.nombre==""){
        res.render("formulario",{
            error:"el nombre y apellido es obligatorio",
            datos:{
                nombre: req.body.nombre,
                apellido: req.body.apellido
            }
        });
        return;
    }
    await ArtistaModel.findByIdAndUpdate(
        { _id: req.params.id },
        { 
            nombre: req.body.nombre, 
            apellido: req.body.apellido
        },
    );
    res.redirect("/listado");
})

app.get("/agregar", async function (req, res) {
    var nuevoArtista = await ArtistaModel.create(
        { nombre: "fat", apellido: "mike" }
    );
    res.send(nuevoArtista);
});

app.get("/modificar", async function (req, res) {
    await ArtistaModel.findByIdAndUpdate(
        { _id: "5e570a9e4f528528e813bea6" },
        { nombre: "nuevo nombre", apellido: "na" },
    );
    res.send("ok");
});

/*app.get("/borrar", async function (req, res) {
    var rta = await ArtistaModel.findByIdAndRemove(
        { _id: "5e570a9e4f528528e813bea6" }
    );
    res.send(rta);
})*/

app.get("/borrar/:id", async function (req, res) {
    await ArtistaModel.findByIdAndRemove(
        //: id se transforma en lo de abajo req.params.id
        { _id: req.params.id }
    );
    res.redirect("/listado");
})

app.get("/contar", function(req,res){
    if (!req.session.contador){ //otra forma if(req....==false)
        req.session.contador=0;
    }
    req.session.contador ++;
    res.json(req.session.contador);//va con json porque respode a contenido y al codigo de estado ()
});

app.get("/login", function(req,res){
    res.render("flogin");
});

app.post("/login", async function(req,res){
    //user:admin/pass:admin 123
    var usuarios = await usuariomodel.find( 
        {username: req.body.user, password:req.body.password });
    if (usuarios.length!=0){
        req.session.user_id = usuarios[0]._id;
        res.redirect("/listado");
        return;
    } else {
        res.send("incorrecto")
    };
            
    });
//API -------------------------------------------------------
// se usa por performance
//no te preocupas por la interfaz
app.get("/api/artistas", async function(req, res){
    var listado = await ArtistaModel.find().lean();
    res.json(listado);
});

app.get("/api/artistas/:id", async function(req, res){
    try{//contempla lo perfecto
        var unartista = await ArtistaModel.findById(req.params.id);
        res.json(unartista);
    } catch (e) {//catch se asegura si es que hay error (cod 404)
        res.status(404).send("error");
    }
    
});

//la dife con el otro post es como diferencia la info el servidor
//se opera siempre con json, se recibe un json y se envia un json.
app.post("/api/artistas", async function(req,res){
    var artista = await ArtistaModel.create({
        nombre:req.body.nombre,
        apellido:req.body.apellido
    });
    res.json(artista); //esto devuelve con un status 200 (ok)
});

//put es para actualizar
app.put("/api/artistas/:id", async function(req,res){
    try{
    await ArtistaModel.findByIdAndUpdate(
        req.params.id,
        {
            nombre: req.body.nombre,
            apellido: req.body.apellido
        }
    );
        res.status(200).send("ok");
    }catch (e){
        res.status(404).send("error");
    };
});

app.delete("/api/artistas/:id",async function(req,res){
    try{
        ArtistaModel.findByIdAndDelete(req.params.id);
        res.status(204).send(); //va parentesis vacio porque no encuentra nada 
    }catch(e){
        res.status(404).send("no encontrado");
    }
})


app.get("/signin", function(req,res){
    res.render("signin_form");
});

app.post("/signin", async function(req,res){
    if (req.body.usuario=="" || req.body.password==""){
        res.render("signin_form",{
            error:"el usuario y contraseña es obligatorio",
            datos:{
                usuario: req.body.username,
                password: req.body.password,
                email: req.body.email
            }
        });
        return;
    }
    await usuariomodel.create({
        usuario: req.body.username,
        password: req.body.password,
        email: req.body.email
    });
    res.redirect("/login"); //cuando se re direcciona va por get automaticamente
});







app.listen(80, function () {
    console.log("app en localhost");
});