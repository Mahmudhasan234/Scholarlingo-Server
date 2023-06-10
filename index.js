const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const port = process.env.PORT || 5000
const corsOptions = {
    origin: '*',
    credentials: true,
    optionSuccessStatus: 200,
}

// malware
app.use(cors(corsOptions))
app.use(express.json())


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vgqrech.mongodb.net/?retryWrites=true&w=majority`;

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
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const instructorCollection = client.db("scholarlingoDB").collection("instructors");

        const userCollection = client.db("scholarlingoDB").collection("usersData");

        // get all data from database
        app.get('/instructors', async (req, res) => {
            const result = await instructorCollection.find().toArray()
            res.send(result)

        })

        // selected course section
        app.post('/usersData', async (req, res) => {
            const item = req.body
            console.log(item)
            const result = await userCollection.insertOne(item)
            res.send(result)
        })

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('welcome to Scholarlingo Server')
})

app.listen(port)
