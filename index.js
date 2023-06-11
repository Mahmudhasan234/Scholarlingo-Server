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


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
        const onlyUsersCollection = client.db("scholarlingoDB").collection("users");

        // get all data from database
        app.get('/instructors', async (req, res) => {
            const result = await instructorCollection.find().toArray()
            res.send(result)

        })
        // save user data
        app.post('/users', async (req, res) => {
            const user = req.body;
            const query = { email: user.email }
            const existingUser = await onlyUsersCollection.findOne(query);

            if (existingUser) {
                return res.send({ message: 'user already exists' })
            }

            const result = await onlyUsersCollection.insertOne(user);
            res.send(result);
        });
        // get all user data

        app.get('/users',  async (req, res) => {
            const result = await onlyUsersCollection.find().toArray();
            res.send(result);
        });

        // selected course section
        app.post('/usersData', async (req, res) => {
            const item = req.body
            console.log(item)
            const result = await userCollection.insertOne(item)
            res.send(result)
        })
        // get  selected Course data for email

        app.get('/usersData', async (req, res) => {
            let query = {}
            if (req.query.email) {
                query = { email: req.query.email }
            }
            const result = await userCollection.find(query).toArray()
            res.send(result)
        })

        app.delete('/userData/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await userCollection.deleteOne(query)
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
