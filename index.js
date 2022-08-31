const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config();
const bodyParser = require('body-parser')
const mongoose = require('mongoose');
const mySecret = process.env.MONGODB_URI

//bd connection and schemas

mongoose.connect(mySecret, { useNewUrlParser: true, useUnifiedTopology: true});

//bd schema and model
const userSchema = mongoose.Schema({
  username:             {type: String, required: true}
}, { versionKey: false });

const Users= mongoose.model('Users', userSchema);

const exerciseSchema = mongoose.Schema({
  description:           {type: String, required: true},
  duration:              {type: Number, required: true},
  date:                  {type: String},
  userId:   {
    type: mongoose.Schema.Types.ObjectId,
    ref:'Users',
    required: true
  },
}, { versionKey: false });

const Exercise = mongoose.model('Exercise', exerciseSchema);


//middlewares
app.use(cors())
app.use(bodyParser.urlencoded({extended: false}))
app.use(express.static('public'))


//routes
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.get('/api/users', (req, res)=>{
  Users.find({}, (err, data)=>{
    if(err) return console.error(err);
    data && data.length!==0  ? res.send(data) : res.send({"error": "No hay users"});
  });
})

app.post('/api/users', (req, res)=>{
  const {username} = req.body;
  console.log(username)
  
  const newUser = new Users({
    username: username
  })
  newUser.save((err, data)=>{
    if(err){
      return res.status(400).send(err)
    } 
    res.send(data);
  })
  
});

app.post('/api/users/:id/exercises', (req, res)=>{
  const {id} = req.params;
  console.log(!req.body['date'])
  var checkDate;
  if(req.body['date']){
    
    checkDate = new Date(req.body['date'])
    
    checkDate = checkDate.toDateString();
  }
  else{
    checkDate = new Date();
    
    checkDate = checkDate.toDateString();
  }
  const {description, duration} =  req.body;
  console.log(checkDate)
  Users.findById(id, (err, data)=>{
    if(err){
      return res.status(400).send(err.message)
    }
    const name = data.username;
    const newExercise = new Exercise({
      date: checkDate,
      duration: duration,
      description: description,
      userId: id
    });
    newExercise.save((err, data)=>{
      if(err){
        return res.status(400).send(err.message)
      }
      res.send({
      "_id": id,
      "username": name,
      "date": data.date,
      "duration": data.duration,
      "description": data.description
      });
    });
    
  });
});

app.get('/api/users/:id/logs', async(req, res)=>{
  const {id} = req.params;
  var from;
  var to;
  var limit = 0;
  
  
  try {
    const user = await Users.findById(id);
    if (user.length === 0) {
      return res.status(400).send('there is no users')
    }else{
      var exerciseFind = await Exercise.find({userId : id}, { description: 1, duration: 1, date: 1, _id: 0 });
      // var newArr = [...exerciseFind];
      if(exerciseFind){
        var newArr = exerciseFind.slice(0);
        if(req.query['from']){
          from = new Date(req.query['from'])
          newArr= newArr.filter(e => new Date(e.date)>=from);
        }
        if(req.query['to']){
          to = new Date(req.query['to'])
          newArr = newArr.filter(e => new Date(e.date)<=to);
        }
        if(req.query['limit']){
          limit = Number(req.query['limit']);
          newArr = newArr.slice(0,limit)
        }

        res.send({
          "_id":id,
          "username": user.username,
          "count": newArr.length,
          "log": newArr
        })
      }
    }

  } catch(e) {
    return res.status(400).send(e.message)
    console.log(e);
  }

})



//listen
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
