const express = require('express')
const app = express()
const jwt = require('jsonwebtoken');
const cors = require('cors')
require('dotenv').config()
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)
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
        client.connect();

        const instructorCollection = client.db("scholarlingoDB").collection("instructors");
        const paymentCollection = client.db("scholarlingoDB").collection("payments");
        const reviewCollection = client.db("scholarlingoDB").collection("reviews");

        const userCollection = client.db("scholarlingoDB").collection("usersData");
        const onlyUsersCollection = client.db("scholarlingoDB").collection("users");


        // const verifyJWT = (req, res, next) => {
        //     const authorization = req.headers.authorization;
        //     if (!authorization) {
        //         return res.status(401).send({ error: true, message: 'unauthorized access defined' });
        //     }
        //     const token = authorization.split(' ')[1];

        //     jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        //         if (err) {
        //             return res.status(401).send({ error: true, message: 'unauthorized access defined' })
        //         }
        //         req.decoded = decoded;
        //         next();
        //     })
        // }




        // jwt 
        // app.post('/jwt', (req, res) => {
        //     const user = req.body;
        //     const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '2h' })

        //     res.send({ secret: token })
        // })



        // get all data from database
        app.get('/instructors', async (req, res) => {
            const result = await instructorCollection.find().toArray()
            res.send(result)
        })

        app.get('/instructors/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await instructorCollection.findOne(query)
            res.send(result)
        })


        app.post('/instructors', async (req, res) => {
            const newCourse = req.body
            console.log(newCourse)
            const result = await instructorCollection.insertOne(newCourse)
            res.send(result)
        })
        // add for review
        app.post('/reviews', async (req, res) => {
            const newCourse = req.body
            const result = await reviewCollection.insertOne(newCourse)
            res.send(result)
        })
        app.get('/reviews', async (req, res) => {
            const result = await reviewCollection.find().toArray()
            res.send(result)
        })

        app.get('/reviews/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email }
            const result = await reviewCollection.find(query).toArray();

            res.send(result);
        })
        // approved
        app.patch('/reviews/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id)
            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    status: 'approved'
                },
            };
            const result = await reviewCollection.updateOne(filter, updateDoc)
            res.send(result)
        })
        // denied
        app.patch('/reviews/denied/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    status: 'denied'
                },
            };
            const result = await reviewCollection.updateOne(filter, updateDoc)
            res.send(result)
        })

        // send FeedBack
        app.put('/reviews/feedback/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const { feedback } = req.body
            const updateDoc = {
                $set: {
                    feedback: feedback
                },
            };
            const result = await reviewCollection.updateOne(filter, updateDoc)
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

        app.get('/users', async (req, res) => {
            const result = await onlyUsersCollection.find().toArray();
            res.send(result);
        });
        // update data
        app.patch('/users/:email', async (req, res) => {
            const email = req.params.email;
            const filter = { email: email }
            const updateDoc = {
                $set: {
                    role: 'admin'
                },
            };
            const result = await onlyUsersCollection.updateOne(filter, updateDoc)
            res.send(result)
        })
        // admin verify
        // todo: verify
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email }
            const user = await onlyUsersCollection.findOne(query);
            const result = { admin: user?.role === 'admin' }
            res.send(result);
        })

        // make instructor
        app.patch('/users/instructor/:email', async (req, res) => {
            const email = req.params.email;
            const filter = { email: email }
            const updateDoc = {
                $set: {
                    role: 'instructor'
                },
            };
            const result = await onlyUsersCollection.updateOne(filter, updateDoc)
            res.send(result)
        })

        // instructor verify
        // todo: verify
        app.get('/users/instructor/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email }
            const user = await onlyUsersCollection.findOne(query);
            const result = { admin: user?.role === 'instructor' }
            res.send(result);
        })
        // 
        // selected course section
        app.post('/usersData', async (req, res) => {
            const item = req.body
            console.log(item)
            const result = await userCollection.insertOne(item)
            res.send(result)
        })


        // payment section
        app.post("/create-payment-intent", async (req, res) => {
            const { price } = req.body;
            console.log(price)
            if (price) {
                const amount = parseInt(price) * 100
                const paymentIntent = await stripe.paymentIntents.create({
                    amount: amount,
                    currency: "usd",
                    payment_method_types: ['card']
                });
                res.send({
                    clientSecret: paymentIntent.client_secret,
                });
            }
        });

        // get payment api

        app.post('/payments', async (req, res) => {
            const payment = req.body
            console.log(payment)
            const instructorId = payment.instructorId;
            const query = { _id: new ObjectId(instructorId) }
            // Assuming you have the instructorId in the payment object

            // Get the current values of availableSeatForEnrollment and currentEnrollStudent
            const instructor = await instructorCollection.findOne(query);
            console.log(instructor)
            const currentAvailableSeat = instructor.availableSeatForEnrollment;
            console.log(currentAvailableSeat)
            const currentEnrollStudent = instructor.currentEnrollStudent;
            console.log(currentEnrollStudent)
            const updatedAvailableSeat = currentAvailableSeat - 1;
            const updatedEnrollStudent = currentEnrollStudent + 1;
            console.log(updatedAvailableSeat, updatedEnrollStudent)
            const updateSeat = {
                filter: query,
                update: {
                    $set: { availableSeatForEnrollment: updatedAvailableSeat, currentEnrollStudent: updatedEnrollStudent }
                }
            };
        
            const updateSeatDetails = await instructorCollection.updateMany(updateSeat.filter, updateSeat.update);
            const result = await paymentCollection.insertOne(payment)
            res.send(result)
        })
        app.get('/payments', async (req, res) => {
            const result = await paymentCollection.find().toArray()
            res.send(result)
        })
        app.get('/payments/:email', async (req, res) => {

            const email = req.params.email;
            const query = { email: email }
            console.log(email, query)
            const options = { sort: { 'date': -1 } }
            const user = await paymentCollection.find(query, options).toArray();
            res.send(user)
        })

        // get  selected Course data for email

        app.get('/usersData', async (req, res) => {


            // const decodedEmail = req.decoded.email;
            // if (email !== decodedEmail) {
            //   return res.status(403).send({ error: true, message: 'access denied' })
            // }


            let query = {}
            if (req.query.email) {
                query = { email: req.query.email }
            }
            const result = await userCollection.find(query).toArray()
            res.send(result)
        })

        app.delete('/usersData/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await userCollection.deleteOne(query)
            res.send(result)
        })

        app.get('/usersData/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await userCollection.findOne(query)
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
