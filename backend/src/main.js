const ex=require('express');
require('dotenv').config();
const cookie=require('cookie-parser');
const main=require('./config/db');
const app=ex();
const rclient=require('./config/redis');
const bodyParser = require("body-parser");



const usrroute=require('./routes/userauth');
const probrouter=require('./routes/problemsroute');
const subrouter=require('./routes/submit');
const airouter=require('./routes/aichatting');
const videoroute=require('./routes/videoCreator');

const cors= require('cors');

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));




app.use(ex.json());
app.use(bodyParser.json());
app.use(ex.urlencoded({ extended: true }));


app.use(cookie());

app.use('/user',usrroute);
app.use('/problems',probrouter);
app.use('/subs',subrouter);
app.use('/ai',airouter);
app.use('/vid',videoroute);

async function connect(){
    try {
        await Promise.all([main(), rclient.connect()]); 
        console.log("db and the redis is connected");
 
        app.listen(process.env.PORT, () => {
            console.log(`Server is running on port ${process.env.PORT}`);
        });


       

      

    } catch (error) {
        console.error('connection failed', error);
    }
}


connect();
