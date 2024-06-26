const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

require('dotenv').config()
const cors = require('cors')

const app = express()
const PORT = process.env.PORT || 9000;
const jwt = require('jsonwebtoken');

app.use(cors())
app.use(express.json())

const stripe = require("stripe")(process.env.STRIPE_SECRET);
const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASS}@cluster0.obhaluk.mongodb.net/?retryWrites=true&w=majority`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader) {

    return res.status(401).send({ message: 'UnAuthorized access' })
  }
  const token = authHeader.split(' ')[1]
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: 'Forbidden access' })

    }
    else {
      req.decoded = decoded
      next()
    }

  });

}





async function run() {
  try {
    client.connect()
    const database = client.db("journey-junction")
    const destinations = database.collection("destination")
    const PaymentInformation = database.collection("PaymentInformation")
    const UsersCollections = database.collection('users')


    app.post('/jwt', async (req, res) => {
      const user = req?.body;
      console.log("kser", user)
      const token = await jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
      console.log("khan", token)
      res.send({ token })

    })




    app.get('/destination', async (req, res) => {

      const destination = await destinations.find().toArray()
      res.send(destination)

    })

    app.delete('/paymentInfo/:id', async (req, res) => {
      const transactionId=req?.params.id

      const deleteDestination = { transaction: transactionId };
      const result = await PaymentInformation.deleteOne(deleteDestination);
      res.send(result)



    })



    app.post("/paymentConfirm", async (req, res) => {
      const payment = req?.body

      const confirmPayment = await PaymentInformation.insertOne(payment)

      res.send(confirmPayment)
    })

    app.get("/paymentInfo/:id", verifyJWT, async (req, res) => {
      const email = req?.params?.id;
      const findEmail = { email: email }
      const confirmPayment = await PaymentInformation.find(findEmail).toArray()
      console.log(confirmPayment)
      res.send(confirmPayment)

    })
    app.get("/userInfo", verifyJWT, async (req, res) => {
     
      const userInfo = await PaymentInformation.find().toArray()
      console.log(userInfo)
      res.send(userInfo)

    })


    app.post("/create-payment-intent", async (req, res) => {
      const { price } = req?.body;

      // Create a PaymentIntent with the order amount and currency
      const paymentIntent = await stripe.paymentIntents.create({
        amount: price * 100,
        currency: "usd",
        // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
        "payment_method_types": [
          "card"
        ]
      });

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });



    app.get('/admin/:email', async (req, res) => {
      const email = req?.params?.email;
      const user = await UsersCollections.findOne({ email: email });

      if (user?.role == "admin") {
          res.send({ admin: true });
      }
      else {
          res.send({ admin: false });
      }



  })



  app.put('/makeAdmin/:id', async (req, res) => {
    const admin = req.params.id;
    const user = await UsersCollections.findOne({ email: admin })

    if (user) {
        const filter = { email: admin }
        const updateDoc = {
            $set: { role: 'admin' },
        };
        const result = await UsersCollections.updateOne(filter, updateDoc)
        res.send(result)

    }
    else {

        const newAdmin = {
            email: admin,
            role: "admin"
        }
        const adminFinal = await UsersCollections.insertOne(newAdmin)
        res.send(adminFinal)

    }


})














  }
  finally {

  }
}
run().catch(console.dir)


app.get('/', async (req, res) => {

  res.send("hello world")
})


app.listen(PORT, function (err) {

  console.log(`listening at ${PORT}`);
});
