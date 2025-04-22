const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('../generated/prisma');

require('dotenv').config();

const app = express();
const prisma = new PrismaClient();
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const healthRoutes = require('./routes/health');
const preferencesRoutes = require('./routes/preferences');
const eventsRoutes = require('./routes/events');
const myEventsRoutes = require('./routes/myEvents');
const savedEventsRoutes = require('./routes/savedEvents');

app.use(helmet());


app.use(cors({ origin: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api', healthRoutes);
app.use('/api/preferences', preferencesRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/my-events', myEventsRoutes);
app.use('/api/saved-events', savedEventsRoutes);
app.use('/api/stripe', require('./routes/stripe'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(limiter);


app.get('/', (req, res) => {
  res.send('Viva backend is running');
});


app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack || err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
  });
});


const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});