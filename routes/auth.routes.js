const { Router } = require('express');
const bcrypt = require('bcryptjs');
const config = require('config');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const User = require('../models/User');
const router = Router();

// /api/auth/register
router.post(
  '/register',
  // массив middleware для express - начало
  [
    check('email', 'Некорректный email').isEmail(),
    check('password', 'Минимальная длина пароля 6 символов')
      .isLength({ min: 6 })
  ],
  // массив middleware для express - конец
  async (req, res) => {
    try {
      const errors = validationResult(req); // Express валидирует входящие поля
      
      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array(),
          message: 'Некорректные данные при регистрации'
        })
      }
      const { email, password } = req.body; // это то что мы будем отправлять с фронтэнда

      const candidate = await User.findOne({ email: email });

      if (candidate) {
        return res.status(400).json({ message: 'Такой пользователь уже существует' });
      }

      const hashedPassword = await bcrypt.hash(password, 12); // 12 - salt
      const user = new User({
        email,
        password: hashedPassword
      });

      await user.save();

      res.status(201).json({
        message: 'Пользователь создан'
      }); // ответ - пользователь создан
    } catch (error) {
      res.status(500).json({ message: 'Что-то пошло не так, попробуйте снова' }) // 500 -серверная ошибка
    }
  })

// /api/auth/login
router.post(
  '/login',
  // массив middleware для express - начало
  [
    check('email', 'Введите корректный email').normalizeEmail().isEmail(),
    check('password', 'Введите пароль').exists()
  ],
  // массив middleware для express - конец
  async (req, res) => {
    try {
      const errors = validationResult(req); // Express валидирует входящие поля
      
      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array(),
          message: 'Некорректные данные при входе в систему'
        })
      }

      const { email, password } = req.body;

      const user = await User.findOne({ email });

      if (!user) {
        return res.status(400).json({
          message: 'Пользователь не найден'
        });
      };
      
      // сравниваем пароль из фронта с паролем из БД
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(400).json({
          message: 'Неверный пароль, попробуйте снова'
        })
      }

      // делаем авторизацию пользователя через JWT-token
      const token = jwt.sign(
        { userId: user.id },
        config.get('jwtSecret'), // jwtSecret - строчка из файла /config/default.json
        { expiresIn: '1h' } // expiresIn - через какое врем токен экспайрнется, тут - 1 час
      )
      // закончили формировать токен

      // можно успешно ответить пользователю
      // res.status(200).json({ token, userId: user.id })
      res.json({ token, userId: user.id }); // идентично строке выше, поскольку статус по умолчанию 200

    } catch (error) {
      res.status(500).json({ message: 'Что-то пошло не так, попробуйте снова' }) // 500 -серверная ошибка
    }
})

module.exports = router;