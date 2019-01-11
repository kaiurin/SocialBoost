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
const private_key = '5K7oSUcaUjzW1sMrDpCe3xfPEiiwZbuT9oBunHLumkk46DCkaGN';
const privateKey = PrivateKey.fromString(private_key);

const voter = 'opposition';
const author = 'byteball.org';
const permlink = 'byteball-bot-war-week-3';
const weight = 100;

console.log(privateKey);

const voteData = {
    voter,
    author,
    permlink,
    weight, //needs to be an integer for the vote function
};

function upVote (voteData, privateKey) {
    client.broadcast.vote(voteData, privateKey).then(
        function(result) {
            console.log('success:', result);
        },
        function(error) {
            console.log('error:', error);
        }
    );
}


upVote (voteData, privateKey);



/*
const createPrivateKey = function(private_key) {
    try {
        return PrivateKey.fromString(private_key);
    } catch (e) {
        throw e;
    }
};

or

function getPrivateKey(private_key) {
    try {
        return PrivateKey.fromString(private_key);
    } catch (e) {
        throw e;
    }
}
 */
