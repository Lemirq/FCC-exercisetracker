const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
require('dotenv').config();

// set up mongoose
mongoose.connect(process.env.MONGO_URI, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
});

// set up body parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(cors());
app.use(express.static('public'));

const userSchema = new mongoose.Schema({
	username: { type: String, required: true },
	log: [
		{
			description: { type: String, required: true },
			duration: { type: Number, required: true },
			date: { type: Date },
		},
	],
});

const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', userSchema);

const test = async () => {
	const user = await User.findById('64cda5aee68626405ea72b23');
	console.log(user);
};
test();

// set up post route
app.post('/api/users', (req, res) => {
	const username = req.body.username;
	const newUser = new User({ username: username });
	try {
		newUser.save();
		res.json({ username: username, _id: newUser._id });
	} catch (error) {
		res.json({ error: error });
	}
});

app.post('/api/users/:_id/exercises', async (req, res) => {
	const userId = req.params._id;
	const description = req.body.description;
	const duration = req.body.duration;
	const date = req.body.date;
	const newExercise = { description: description, duration: duration, date: date };
	try {
		const currentUser = await User.findById(userId);
		currentUser.log.push(newExercise);
		currentUser.save();

		res.json({
			_id: userId,
			username: currentUser.username,
			date: new Date(date).toDateString(),
			duration: parseInt(duration),
			description: description,
		});
	} catch (error) {
		console.error(error);
	}
});

app.get('/api/users/:_id/logs', async (req, res) => {
	const userId = req.params._id;
	const from = req.query.from;
	const to = req.query.to;
	const limit = req.query.limit;
	console.log(userId, from, to, limit);
	try {
		const currentUser = await User.findById(userId);
		const log = currentUser.log;
		console.log(log);
		// filter log by date
		const filteredLog = log.filter((item) => {
			const date = new Date(item.date);
			const fromDate = new Date(from);
			const toDate = new Date(to);
			return date >= fromDate && date <= toDate;
		});
		// limit the log
		const limitedLog = filteredLog.slice(0, limit);
		// return the log
		res.json({
			_id: userId,
			username: currentUser.username,
			count: limitedLog.length,
			log: limitedLog,
		});
	} catch (error) {
		console.error(error);
	}
});

// set up routes
app.get('/', (req, res) => {
	res.sendFile(__dirname + '/views/index.html');
});

const listener = app.listen(process.env.PORT || 3000, () => {
	console.log('Your app is listening on port ' + listener.address().port);
});
