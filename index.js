const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');

require('dotenv').config()
const cors = require('cors')

const app = express()
const PORT = process.env.PORT || 9000;

app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASS}@cluster0.obhaluk.mongodb.net/?retryWrites=true&w=majority`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
    try {
        client.connect()
        const database=client.db("journey-junction")
        const destinations=database.collection("destination")
      

        app.get('/destination',async(req,res)=>{

            const destination=await destinations.find().toArray()
            res.send(destination)

        })

        app.get('/', async (req, res) => {
            console.log("hello world")
        })

  
    }
    finally {

    }
}
run().catch(console.dir)


app.get('/', async (req, res) => {
    console.log("hello world")
    res.send("hello emon")
})


app.listen(PORT, function (err) {

    console.log(`listening at ${PORT}`);
});
