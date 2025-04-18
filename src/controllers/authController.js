const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('../../generated/prisma');
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET

const signup = async (req, res) => {
    const { email, password, name, preferences = [] } = req.body;
  
    try {
      // Check if the email is already registered
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already registered' });
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
  
      const user = await prisma.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          preferences: {
            create: preferences.map(pref => ({
              type: pref.type,  
              value: pref.value,
            })),
          },
        },
        include: {
          preferences: true, 
        },
      });
  
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
  
      res.status(201).json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          preferences: user.preferences,
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Something went wrong', error: err.message });
    }
  };
  

  const login = async (req, res) => {
    const { email, password } = req.body;
  
    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return res.status(401).json({ message: 'Invalid email or password' });
  
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) return res.status(401).json({ message: 'Invalid email or password' });
  
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
  
      res.json({ message: 'Login successful', token });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Login error', error: err.message });
    }
  };
  
  module.exports = { signup, login };