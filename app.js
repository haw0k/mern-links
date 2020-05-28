const express = require('express');
const config = require('config');
const mongoose = require('mongoose');
const path = require('path');

const app = express();

// добавляем новый middleware для преобразования req.body в формат json
app.use(express.json({ extended: true })); 

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/link', require('./routes/link.routes'));
app.use('/t', require('./routes/redirect.routes'));

if (process.env.NODE_ENV === 'production') {
  // если идет запрос на корень приложения, добавляем middleware с заданной статикой в build
  app.use('/', express.static(path.join(__dirname, 'client', 'build')));

  // любой другой get-запрос (кроме /api/..., /t) отправлять в файл index.html клиента
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'))
  });
  // таким образом и backend и frontend буду работать в node одновременно
}

const PORT = config.get('port') | 5000;

async function start() {
  try {
    await mongoose.connect(config.get('mongoUri'), {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true
    })
    app.listen(PORT, () => console.log(`App has been started on port ${PORT}...`));
  } catch (error) {
    console.error('Server Error', error.message);
    process.exit(1); // выходим из глобального процесса NodeJS с кодом 1
  }
};

start();

