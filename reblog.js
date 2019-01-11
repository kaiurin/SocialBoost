// https://github.com/steemit/steem/blob/master/libraries/protocol/include/steem/protocol/config.hpp

const {Client, PrivateKey} = require('dsteem');
const Mainnet = {
    accounts: [],
    url: 'https://api.steemit.com',
    net: {
        addressPrefix: 'STM',
        chainId:
            '0000000000000000000000000000000000000000000000000000000000000000',
    },
};
let opts = { ...Mainnet.net };
const client = new Client(Mainnet.url, opts);

let private_key = '5K7oSUcaUjzW1sMrDpCe3xfPEiiwZbuT9oBunHLumkk46DCkaGN';
let privateKey = PrivateKey.fromString(private_key);
let theReposter = 'opposition';
let theAuthor = 'byteball.org';
let thePermLink = 'byteball-bot-war-week-3';

let jsonOp = JSON.stringify([
    'reblog',
    {
        account: theReposter,
        author: theAuthor,
        permlink: thePermLink,
    },
]);
let reblogData = {
    id: 'follow',
    json: jsonOp,
    required_auths: [],
    required_posting_auths: [theReposter],
};

console.log();


/*
function reBlog (reblogData, privateKey) {
    client.broadcast.json(reblogData, privateKey).then(
        function(result) {
            console.log('client broadcast result: ', result);
        },
        function(error) {
            console.error(error);
        }
    );

}

reBlog(reblogData, privateKey);
*/

