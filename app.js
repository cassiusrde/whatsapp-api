const { Client, LocalAuth, NoAuth, MessageMedia, WAState } = require('whatsapp-web.js');
const express = require('express');
const { body, validationResult } = require('express-validator');
const socketIO = require('socket.io');
const qrcode = require('qrcode');
const http = require('http');
const fs = require('fs');
const { phoneNumberFormatter } = require('./helpers/formatter');
const fileUpload = require('express-fileupload');
const axios = require('axios');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

let clientState = WAState.UNLAUNCHED;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  fileUpload({
    debug: false,
  })
);

app.get('/status', async (req, res) => {
  clientState = await client.getState();
  console.log(clientState)

  if(clientState == WAState.CONNECTED){
    return res.status(200).json({
      status: true,
      message: '',
    });
  } else{
    return res.status(503).json({
      status: false,
      message: clientState,
    });
  }
});

app.get('/', (req, res) => {
  res.sendFile('index.html', { root: __dirname });
});

const client = new Client({
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process', // <- this one doesn't works in Windows
      '--disable-gpu',
    ],
  },
  //authStrategy: new NoAuth()
  authStrategy: new LocalAuth()
});

client.on('message', (msg) => {
  //console.log(msg.body)
  if((clientState == WAState.CONNECTED) && (message.body === '!ping')) {
		client.sendMessage(message.from, 'pong');
	}
});

client.initialize();

// Socket IO
io.on('connection', function (socket) {
  socket.emit('message', 'Connecting...');

  if(clientState == WAState.CONNECTED){
    socket.emit('ready', 'Whatsapp is ready!');
    socket.emit('message', 'Whatsapp is ready!');
  }
  
  client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
    qrcode.toDataURL(qr, (err, url) => {
      socket.emit('qr', url);
      socket.emit('message', 'QR Code received, scan please!');
    });
  });

  client.on('ready', () => {
    socket.emit('ready', 'Whatsapp is ready!');
    socket.emit('message', 'Whatsapp is ready!');
  });

  client.on('authenticated', (session) => {
    socket.emit('authenticated', 'Whatsapp is authenticated!');
    socket.emit('message', 'Whatsapp is authenticated!');
    console.log('AUTHENTICATED', session);
    /*if( session ){
    }*/ 
  });

  client.on('auth_failure', function (session) {
    socket.emit('message', 'Auth failure, restarting...');
  });

  client.on('disconnected', (reason) => {
    socket.emit('message', 'Whatsapp is disconnected!');
    client.destroy();
    client.initialize();
  });

  client.on('change_state', (state) => {
    clientState = state;
  });

});

const checkRegisteredNumber = async function (number) {
  try{
    const isRegistered = await client.isRegisteredUser(number);
    return isRegistered;
  }catch(error){
    console.log(error);
    return false;
  }
};

const checkRegisteredGroup = async function (groupName) {
  try{
    const chats = await client.getChats()
    const groups = chats.filter(chat => chat.isGroup && chat.name == groupName)
    
    if(groups.length){
      return groups[0];
    }

    return null;
  }catch(error){
    console.log(error);
    return null;
  }
};


// Send message
app.post(
  '/send-message-group',
  [body('group').notEmpty(), body('message').notEmpty()],
  async (req, res) => {
    const errors = validationResult(req).formatWith(({ msg }) => {
      return msg;
    });

    if (!errors.isEmpty()) {
      return res.status(422).json({
        status: false,
        message: errors.mapped(),
      });
    }

    const groupName = req.body.group;
    const message = req.body.message;

    const chatGroup = await checkRegisteredGroup(groupName)

    if (chatGroup==null) {
      return res.status(422).json({
        status: false,
        message: 'The group is not registered',
      });
    }

    chatGroup.sendMessage(message)   
      .then((response) => {
        res.status(200).json({
          status: true,
          response: response,
        });
      })
      .catch((err) => {
        res.status(500).json({
          status: false,
          response: err,
        });
      });   
        
  }
);


// Send message
app.post(
  '/send-message',
  [body('number').notEmpty(), body('message').notEmpty()],
  async (req, res) => {
    const errors = validationResult(req).formatWith(({ msg }) => {
      return msg;
    });

    if (!errors.isEmpty()) {
      return res.status(422).json({
        status: false,
        message: errors.mapped(),
      });
    }

    const number = phoneNumberFormatter(req.body.number);
    const message = req.body.message;
    
    const isRegisteredNumber = await checkRegisteredNumber(number);
    
    if (!isRegisteredNumber) {
      return res.status(422).json({
        status: false,
        message: 'The number is not registered',
      });
    }
    
    client
      .sendMessage(number, message)
      .then((response) => {
        res.status(200).json({
          status: true,
          response: response,
        });
      })
      .catch((err) => {
        res.status(500).json({
          status: false,
          response: err,
        });
      });
  }
);

// Send media
app.post('/send-media', async (req, res) => {
  const number = phoneNumberFormatter(req.body.number);
  const caption = req.body.caption;
  const fileUrl = req.body.file;

  const isRegisteredNumber = await checkRegisteredNumber(number);
    
  if (!isRegisteredNumber) {
    return res.status(422).json({
      status: false,
      message: 'The number is not registered',
    });
  }
  
  let mimetype;
  const attachment = await axios
    .get(fileUrl, { responseType: 'arraybuffer' })
    .then((response) => {
      mimetype = response.headers['content-type'];
      return response.data.toString('base64');
    });

  const media = new MessageMedia(mimetype, attachment, 'Media');

  client
    .sendMessage(number, media, { caption: caption })
    .then((response) => {
      res.status(200).json({
        status: true,
        response: response,
      });
    })
    .catch((err) => {
      res.status(500).json({
        status: false,
        response: err,
      });
    });
});

server.listen(8000, function () {
  console.log('App running on http://localhost:' + 8000);
});
