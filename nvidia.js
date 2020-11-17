// Usage:
// 1. install node.js with npm
// 2. (optional) change hardcoded email, telegram etc. info below
// 3. run "npm start"

const {exec, execFile} = require('child_process');
const fetch = require('node-fetch');
const nodemailer = require('nodemailer');
const {TelegramClient} = require('messaging-api-telegram');
const openUrl = require('open');

const makeNoise = !!Number(process.argv[2]);
console.log("Making noise:", makeNoise);
if (!makeNoise) {
  console.log("Add parameter 1 if you want to have sounds");
}

function sendTelegram() {
  // only required for telegram messaging
  const client = new TelegramClient({
    accessToken: 'MY-TELEGRAM-ACCESS-TOKEN',
  });

  const telegramChatId = 1337; // MY TELEGRAM CHAT ID
  client.sendMessage(telegramChatId, "RTX 3080 seems to be back in stock!!");
}


function sendMail() {
  let trans = nodemailer.createTransport({
    host: 'SMTP ADDRESS',
    port: 465, // MAIL SERVER PORT
    secure: true,
    auth: {
      user: 'USERNAME',
      pass: 'PASSWORD',
    },
  });

  // ENTER SENDER AND RECIPIENT INFO BELOW!
  trans.sendMail({
    from: '"John Doe" <john.doe@example.com>',
    to: 'recipient@gmail.com',
    subject: 'RTX 3080 is back in store!',
    text: 'The RTX 3080 seems to be back in store!',
  }).then(info => console.log('Message sent: ', info));
}

function notify() {
  console.error("BUY NOW BUY NOW BUY NOW");
  try {
    sendMail();
    sendTelegram();
  } catch(e) {
    console.error(e);
  }

  if (makeNoise) {
    exec('rundll32 user32.dll,MessageBeep');
    const bing = setInterval(() => {
      exec('rundll32 user32.dll,MessageBeep');
    }, 3000);
  }
}

let foundProduct = false;
let numChecks = 0;

function doFetch(func) {
  func().finally(() => {
    numChecks += 1;
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(String(numChecks));
    if (foundProduct) {
      notify();
    } else {
      setTimeout(() => doFetch(func), 10000);
    }
  });
}


function main() {
  // This is the GERMAN URL!
  const url = 'https://api.nvidia.partners/edge/product/search?page=1&limit=9&locale=de-de&manufacturer=NVIDIA&gpu=RTX%203080&gpu_filter=RTX%203090~1,RTX%203080~1,RTX%203070~1,TITAN%20RTX~1,RTX%202080%20Ti~10,RTX%202080%20SUPER~1,RTX%202080~33,RTX%202070%20SUPER~71,RTX%202070~74,RTX%202060%20SUPER~35,RTX%202060~126,GTX%201660%20Ti~117,GTX%201660%20SUPER~34,GTX%201660~39,GTX%201650%20Ti~48,GTX%201650%20SUPER~21,GTX%201650~164';
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.102 Safari/537.36',
    Accept: 'application/json, text/plain, */*',
  };

  // Nvidia store
  doFetch(() => fetch(url, {headers})
    .then(res => res.json())
    .then((json) => {
      const products = [
        json.searchedProducts.featuredProduct,
        ...(json.searchedProducts.productDetails || []),
      ].filter(p => p && p.gpu === 'RTX 3080' && p.isFounderEdition);
      if (products.length === 0) {
        console.error('No product found?!');
      }
      products.forEach((prod) => {
        if (prod.digitalRiverID) {
          console.log('Digital river id found:', prod.digitalRiverID);
          foundProduct = true;
        } else if (prod.retailers && prod.retailers.length > 0) {
          console.log('Retailers found: ', prod.retailers);
          openUrl(prod.retailers[0].purchaseLink, {app: 'chrome'});
          foundProduct = true;
        }
      });
    })
    .catch(e => console.error(e))
  );
}

// uncomment below to test notification
// notify();


// run script loop
main();
