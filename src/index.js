const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('../generated/prisma');

require('dotenv').config();

const app = express();
const prisma = new PrismaClient();

const authRoutes = require('./routes/auth');
const healthRoutes = require('./routes/health');

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Viva backend is running');
});

app.use('/api/auth', authRoutes);
app.use('/api', healthRoutes);









const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});