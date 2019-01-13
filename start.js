/*jslint node: true */
'use strict';
const constants = require('byteballcore/constants.js');
const conf = require('byteballcore/conf');
const db = require('byteballcore/db');
const eventBus = require('byteballcore/event_bus');
const validationUtils = require('byteballcore/validation_utils');
const headlessWallet = require('headless-byteball');
let assocDeviceAddressToPeerAddress = {};
let assocDeviceAddressToMyAddress = {};
let assocMyAddressToDeviceAddress = {};

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

let opts = {...Mainnet.net};
const client = new Client(Mainnet.url, opts);

/**
 * headless wallet is ready
 */

function boostPost(deviceAddress, task_id) {
    const device = require('byteballcore/device.js');
    db.query("SELECT step_booster, account_type FROM users WHERE device_address = ?", [deviceAddress], rows => {
        console.error(rows.length);
        console.error(rows);
        if (rows[0].account_type === 'boost_post' && rows[0].step_booster === 'author_request') {
            device.sendMessageToDevice(deviceAddress, 'text', "Please send me the steemname(steemlogin) of post author what must be boosted.");
        } else if (rows[0].account_type === 'boost_post' && rows[0].step_booster === 'permlink_request') {
            device.sendMessageToDevice(deviceAddress, 'text', "Please, send me link on your post what must me boosted.\n" +
                "⚠ WARNING: Link must be full with 'https://'❗️\n" +
                "For example: https://steemit.com/byteball/@opposition/bot-wars-socialboost \n");
        } else if (rows[0].account_type === 'boost_post' && rows[0].step_booster === 'like_count_request') {

            db.query("SELECT post_perm_link, author_steem_login FROM boost_tasks WHERE device_address = ? AND task_id = ?", [deviceAddress, task_id], rows => {
                db.query("SELECT * FROM users WHERE step_worker = ? AND NOT EXISTS (SELECT * FROM workers_log WHERE users.steem_login = workers_log.steem_login \n\
                AND workers_log.login_action = 'like' AND workers_log.post_perm_link = ? AND workers_log.post_author = ?)",
                    ['worker_info', rows[0].post_perm_link, rows[0].author_steem_login], rows => {
                        let likes = rows.length;
                        device.sendMessageToDevice(deviceAddress, 'text', "Please send me value of UpVotes what you want to get.\n" +
                            "At the moment, maximal value of UpVotes what we can sell is " + likes +
                            "\nPrice:\n" +
                            "1 UpVote - 10mb");
                    });
            });

        } else if (rows[0].account_type === 'boost_post' && rows[0].step_booster === 'repost_count_request') {

            db.query("SELECT post_perm_link, author_steem_login FROM boost_tasks WHERE device_address = ? AND task_id = ?", [deviceAddress, task_id], rows => {
                db.query("SELECT * FROM users WHERE step_worker = ? AND NOT EXISTS (SELECT * FROM workers_log WHERE users.steem_login = workers_log.steem_login \n\
                AND workers_log.login_action = 'repost' AND workers_log.post_perm_link = ? AND workers_log.post_author = ?)",
                    ['worker_info', rows[0].post_perm_link, rows[0].author_steem_login], rows => {
                        let reposts = rows.length;
                        device.sendMessageToDevice(deviceAddress, 'text', "Please send me Repost value what you want to get.\n" +
                            "At the moment, maximal value of Reposts what we can sell is " + reposts +
                            "\nPrice:\n" +
                            "1 Repost - 1mb");
                    });
            });

        } else if (rows[0].account_type === 'boost_post' && rows[0].step_booster === 'user_address_request') {
            device.sendMessageToDevice(deviceAddress, 'text', "Please, send me your byteball wallet address.");

        } else if (rows[0].account_type === 'boost_post' && rows[0].step_booster === 'task_payment') {
            db.query("SELECT repost_target, like_target, assoc_address, user_address FROM boost_tasks WHERE device_address = ? AND task_id = ?",
                [deviceAddress, task_id], rows => {
                    if (rows[0].repost_target === 0 && rows[0].like_target === 0) {
                        device.sendMessageToDevice(deviceAddress, 'text', 'You ordered - nothing.' +
                            '\n Change post what must be boosted or choose more likes and reposts');
                        db.query("UPDATE users SET step_booster = ? WHERE device_address = ?", ['author_request', deviceAddress]);
                        boostPost(deviceAddress, task_id);
                    } else {
                        let price = 10000 * rows[0].like_target + 1000 * rows[0].repost_target;
                        device.sendMessageToDevice(deviceAddress, 'text', "Your order: \n" +
                            'UpVotes - ' + rows[0].like_target +
                            '\nReposts - ' + rows[0].repost_target +
                            '\nTotal price is - ' + price + " bytes" +
                            '\nTo pay click on button below.');
                        device.sendMessageToDevice(deviceAddress, 'text', '[balance](byteball:' + rows[0].assoc_address + '?amount=' + price + ')');
                    }
                });

        }
    });
}


function earnBytes(deviceAddress, userSteemLogin) {
    const device = require('byteballcore/device.js');
    db.query("SELECT step_worker, account_type FROM users WHERE device_address = ?", [deviceAddress], rows => {
        console.error(rows.length);
        console.error(rows);
        if (rows[0].account_type === 'earn_bytes' && rows[0].step_worker === 'user_address_request') {

            device.sendMessageToDevice(deviceAddress, 'text', "Please, send me your byteball wallet address.");

        } else if (rows[0].account_type === 'earn_bytes' && rows[0].step_worker === 'steem_login_request') {

            device.sendMessageToDevice(deviceAddress, 'text', "Please, send me your steem login.");

        } else if (rows[0].account_type === 'earn_bytes' && rows[0].step_worker === 'steem_private_postkey_request') {

            device.sendMessageToDevice(deviceAddress, 'text', "Please, send me your steem private-post-key of your steem login.\n" +
                "❗️To find it, you must open link below and then \n" +
                "click on 'SHOW PRIVATE KEY' button near POSTING KEY \n" +
                "After click - copy appeared 'PRIVATE POST KEY'\n" +
                "https://steemit.com/@" + userSteemLogin + "/permissions ");

        } else if (rows[0].account_type === 'earn_bytes' && rows[0].step_worker === 'worker_info') {


            db.query("SELECT steem_login, balance FROM users WHERE device_address = ?", [deviceAddress], rows => {
                let userSteemLogin = rows[0].steem_login;
                let balance = rows[0].balance;
                db.query("SELECT login_action FROM workers_log WHERE login_action = 'like' AND steem_login = ?", [userSteemLogin], rows => {
                    let likes = rows.length;
                    db.query("SELECT login_action FROM workers_log WHERE login_action = 'repost' AND steem_login = ?", [userSteemLogin], rows => {
                        let reposts = rows.length;
                        device.sendMessageToDevice(deviceAddress, 'text', "Hello, worker! \n" +
                            "You liked - " + likes + " times \n" +
                            "You reposted - " + reposts + " times \n" +
                            "Your balance - " + balance + " bytes \n" +
                            "[[Withdraw balance]](command:withdraw) " + " | " + " [[Main menu]](command:menu)")
                    });
                })
            })
        }
    })
    //device.sendMessageToDevice(deviceAddress, 'text', "Hey old worker");
}


let myAddress;

eventBus.once('headless_wallet_ready', () => {
    headlessWallet.setupChatEventHandlers();

    db.query("SELECT address FROM my_addresses", [], function (rows) {
        if (rows.length === 0)
            throw Error("no addresses");
        myAddress = rows[0].address;
    });

    /**
     * user pairs his device with the bot
     **/

    eventBus.on('paired', (from_address, pairing_secret) => {
        // send a greeting message
        let deviceAddress = from_address;
        const device = require('byteballcore/device.js');
        db.query("INSERT INTO users(device_address,step_worker,step_booster) VALUES (?, ?, ?)", [deviceAddress, 'user_address_request', 'author_request']);
        device.sendMessageToDevice(from_address, 'text', "Welcome to the SocialBoost BOT! \n " +
            "This bot was created to help earn the first bytes to beginners or raise up posts on social networks for authors.\n" +
            "BOT is on MVP stage, it mean's that only STEEMIT.COM platform supported. Later will be more. \n" +
            "For all questions or report the problem, write on - lchaosmachinel@gmail.com \n" +
            "[[Earn Bytes]](command:earn_bytes) " + " | " + " [[Boost Post]](command:boost_post)");
    });

    /**
     * user sends message to the bot
     */

    eventBus.on('text', (from_address, text) => {
        const device = require('byteballcore/device.js');
        text = text.trim();

        if (text === 'earn_bytes') {

            db.query("UPDATE users SET account_type = ? WHERE device_address = ? ", ['earn_bytes', from_address]);
            earnBytes(from_address)

        } else if (text === 'boost_post') {

            db.query("UPDATE users SET account_type = ? WHERE device_address = ? ", ['boost_post', from_address]);
            boostPost(from_address)

        } else if (text === 'menu') {

            device.sendMessageToDevice(from_address, 'text', "Welcome to the SocialBoost BOT! \n " +
                "This bot was created to help earn the first bytes to beginners or raise up posts on social networks for authors.\n" +
                "BOT is on MVP stage, it mean's that only STEEMIT.COM platform supported. Later will be more. \n" +
                "For all questions or report the problem, write on - lchaosmachinel@gmail.com \n" +
                "[[Earn Bytes]](command:earn_bytes) " + " | " + " [[Boost Post]](command:boost_post)" + " | " + " [[Boost statistics]](command:statistics)");

        } else if (text === 'withdraw') {


            db.query("SELECT * FROM users WHERE device_address = ?", [from_address], rows => {
                if (rows[0].balance === 0) {
                    device.sendMessageToDevice(from_address, 'text', 'You cant withdraw - 0. Sorry.');
                } else {
                    headlessWallet.sendPaymentUsingOutputs(null, [{
                        address: rows[0].user_address,
                        amount: rows[0].balance - 500
                    },
                        {
                            address: 'UTUZJCXSMNSPAIUVEYTHKVIYDJGJJAKR',
                            amount: rows[0].balance - 500
                        }], myAddress, (err, unit) => {
                        if (err) {
                            console.error('sendPayment ERR: ', err);
                            device.sendMessageToDevice(from_address, 'text', 'Sorry there was an error, please try a little later.');
                        } else {
                            console.error('Unit: ', unit);
                            device.sendMessageToDevice(from_address, 'text', 'I sent you money');
                            decBalance(rows[0].balance, from_address);
                        }
                    });
                }

            })


        } else if (text === 'statistics') {


            db.query("SELECT task_id, author_steem_login, post_perm_link, like_target, repost_target, " +
                "like_status, repost_status, status FROM boost_tasks WHERE device_address = ?", [from_address], rows => {
                if (rows.length === 0) {
                    device.sendMessageToDevice(from_address, 'text', 'Orders not found!');
                } else {
                    let text = 'ORDERS:\n';
                    for (let i = 0; i < rows.length; i++) {
                        text += "Task id - " + rows[i].task_id +
                            "\nPost author - " + rows[i].author_steem_login +
                            "\nPost permlink - " + rows[i].post_perm_link +
                            "\nLike target - " + rows[i].like_target +
                            "\nLike status - " + rows[i].like_status +
                            "\nRepost target - " + rows[i].repost_target +
                            "\nRepost status - " + rows[i].repost_status +
                            "\nOrder status - " + rows[i].status +
                            "\n--------------------------\n";
                    }
                    device.sendMessageToDevice(from_address, 'text', text);
                    device.sendMessageToDevice(from_address, 'text',
                        "[[Earn Bytes]](command:earn_bytes) " + " | " + " [[Boost Post]](command:boost_post)" + " | " + " [[Boost statistics]](command:statistics)");
                }

            });


        } else {
            db.query("SELECT step_worker, step_booster, account_type FROM users WHERE device_address = ?", [from_address], rows => {
                let userSteemLogin;
                if (rows[0].account_type === 'earn_bytes' && rows[0].step_worker === 'user_address_request') { //earnbytes

                    headlessWallet.issueNextMainAddress((address) => {
                        db.query("UPDATE users SET assoc_address = ? WHERE device_address = ?", [address, from_address]);
                    });
                    db.query("UPDATE users SET user_address = ?, step_worker = ? WHERE device_address = ?", [text, 'steem_login_request', from_address]);
                    earnBytes(from_address)
                } else if (rows[0].account_type === 'earn_bytes' && rows[0].step_worker === 'steem_login_request') {

                    client.database.getAccounts([text.toLowerCase()]).then(result => {
                        if (result[0]) {
                            db.query("SELECT * FROM users WHERE steem_login = ?", [text.toLowerCase()], rows => {
                                if (rows.length === 0) {
                                    db.query("UPDATE users SET steem_login = ?, step_worker = ? WHERE device_address = ? ", [text.toLowerCase(), 'steem_private_postkey_request', from_address]);
                                    userSteemLogin = text.toLowerCase();
                                    earnBytes(from_address, userSteemLogin)
                                } else {
                                    device.sendMessageToDevice(from_address, 'text', 'This login already registered!');
                                }
                            })
                        } else {
                            device.sendMessageToDevice(from_address, 'text', 'This login does not exist!');
                        }
                    });


                } else if (rows[0].account_type === 'earn_bytes' && rows[0].step_worker === 'steem_private_postkey_request') {



                    let privateKey = checkPrivateKey(text);

                    if (privateKey) {
                        db.query("INSERT INTO worker_stats(device_address) VALUES (?)", [from_address]);
                        db.query("UPDATE users SET steem_private_post_key = ?, step_worker = ? WHERE device_address = ?", [text, 'worker_info', from_address]);
                        earnBytes(from_address)
                    } else {
                        device.sendMessageToDevice(from_address, 'text', 'Please send me valid Private Post Key! \n' +
                            '❗️If you cant find it - check this album:\n' +
                            'https://imgur.com/a/KZm83ma');
                    }
                }

                else if (rows[0].account_type === 'boost_post' && rows[0].step_booster === 'author_request') { //boostpost

                    client.database.getAccounts([text.toLowerCase()]).then(result => {
                        if (result[0]) {
                            db.query("UPDATE users SET step_booster = ? WHERE device_address = ?", ['permlink_request', from_address]);
                            db.query("INSERT INTO boost_tasks(device_address, status) VALUES (?, ?)", [from_address, 'new']);
                            db.query("SELECT task_id FROM boost_tasks WHERE device_address = ? AND status = ?", [from_address, 'new'], rows => {
                                db.query("UPDATE boost_tasks SET author_steem_login = ? WHERE task_id = ?", [text.toLowerCase(), rows[0].task_id]);
                                boostPost(from_address)
                            })
                        } else {
                            device.sendMessageToDevice(from_address, 'text', 'This login does not exist!');
                        }

                    });

                } else if (rows[0].account_type === 'boost_post' && rows[0].step_booster === 'permlink_request') {

                    db.query("UPDATE users SET step_booster = ? WHERE device_address = ?", ['like_count_request', from_address]);
                    db.query("UPDATE boost_tasks SET post_perm_link = ? WHERE device_address = ?", [text.split('/')[5], from_address]);
                    console.error(text.split('/')[5]);
                    db.query("SELECT task_id FROM boost_tasks WHERE device_address = ? AND status = ?", [from_address, 'new'], rows => {
                        boostPost(from_address, rows[0].task_id)
                    });

                } else if (rows[0].account_type === 'boost_post' && rows[0].step_booster === 'like_count_request') {

                    db.query("SELECT task_id FROM boost_tasks WHERE device_address = ? AND status = ?", [from_address, 'new'], rows => {
                        let task_id = rows[0].task_id;
                        db.query("SELECT post_perm_link, author_steem_login FROM boost_tasks WHERE device_address = ? AND task_id = ?",
                            [from_address, rows[0].task_id], rows => {
                                db.query("SELECT * FROM users WHERE step_worker = ? AND NOT EXISTS (SELECT * FROM workers_log \n\
                                         WHERE workers_log.steem_login = users.steem_login AND workers_log.login_action = 'like' \n\
                                         AND workers_log.post_perm_link = ? AND workers_log.post_author = ?)",
                                    ['worker_info', rows[0].post_perm_link, rows[0].author_steem_login], rows => {
                                        if (text.match(/^[0-9]+$/) && parseInt(text) <= rows.length) {
                                            db.query("UPDATE users SET step_booster = ? WHERE device_address = ?", ['repost_count_request', from_address]);
                                            db.query("UPDATE boost_tasks SET like_target = ? WHERE device_address = ?", [text, from_address]);
                                            boostPost(from_address, task_id)
                                        } else if (text.match(/^[0-9]+$/) && parseInt(text) < 0) {
                                            device.sendMessageToDevice(from_address, 'text', "Something wrong. Like amount can't be < 0!");
                                        } else {
                                            device.sendMessageToDevice(from_address, 'text', "Something wrong. Like amount must be < or = " + rows.length);
                                        }

                                    })
                            })
                    });

                } else if (rows[0].account_type === 'boost_post' && rows[0].step_booster === 'repost_count_request') {
                    db.query("SELECT task_id FROM boost_tasks WHERE device_address = ? AND status = ?", [from_address, 'new'], rows => {
                        db.query("SELECT post_perm_link, author_steem_login FROM boost_tasks WHERE device_address = ? AND task_id = ?",
                            [from_address, rows[0].task_id], rows => {
                                db.query("SELECT * FROM users WHERE step_worker = ? AND NOT EXISTS \n\
                         (SELECT * FROM workers_log WHERE workers_log.steem_login = users.steem_login \n\
                           AND workers_log.login_action = 'repost' AND workers_log.post_perm_link = ? AND workers_log.post_author = ?)",
                                    ['worker_info', rows[0].post_perm_link, rows[0].author_steem_login], rows => {
                                        if (text.match(/^[0-9]+$/) && parseInt(text) <= rows.length) {
                                            headlessWallet.issueNextMainAddress((address) => {
                                                db.query("UPDATE boost_tasks SET assoc_address = ? WHERE device_address = ?", [address, from_address]);
                                            });
                                            db.query("UPDATE users SET step_booster = ? WHERE device_address = ?", ['user_address_request', from_address]);
                                            db.query("UPDATE boost_tasks SET repost_target = ? WHERE device_address = ?", [text, from_address]);
                                            boostPost(from_address)
                                        } else if (text.match(/^[0-9]+$/) && parseInt(text) < 0) {
                                            device.sendMessageToDevice(from_address, 'text', "Something wrong. Reposts amount can't be < 0!");
                                        } else {
                                            device.sendMessageToDevice(from_address, 'text', "Something wrong. Reposts amount must be < or = " + rows.length);
                                        }
                                    })
                            })
                    });

                } else if (rows[0].account_type === 'boost_post' && rows[0].step_booster === 'user_address_request') {

                    db.query("UPDATE users SET step_booster = ? WHERE device_address = ?", ['task_payment', from_address]);
                    db.query("UPDATE boost_tasks SET user_address = ? WHERE device_address = ?", [text, from_address]);
                    db.query("SELECT task_id FROM boost_tasks WHERE device_address = ? AND status = ?", [from_address, 'new'], rows => {
                        boostPost(from_address, rows[0].task_id)
                    });

                } else if (rows[0].account_type === 'earn_bytes' && rows[0].step_worker === 'worker_info') {
                    earnBytes(from_address)
                }
            });
        }
    });

    /*
    eventBus.on('new_my_transactions', (arrUnits) => {
        const device = require('byteballcore/device.js');
        db.query("SELECT address, amount, asset FROM outputs WHERE unit IN (?)", [arrUnits], rows => {
            rows.forEach(row => {
                let deviceAddress = assocMyAddressToDeviceAddress[row.address];
                if (row.asset === null && deviceAddress) {
                    device.sendMessageToDevice(deviceAddress, 'text', 'I received your payment: ' + row.amount + ' bytes');
                    return true;
                }
            })
        });
    });
    */

    eventBus.on('new_my_transactions', (arrUnits) => {
        let device = require('byteballcore/device.js');
        db.query(
            "SELECT outputs.amount, outputs.asset AS received_asset, device_address \n\
            FROM outputs JOIN boost_tasks ON outputs.address=boost_tasks.assoc_address \n\
            WHERE unit IN(?) AND NOT EXISTS (SELECT 1 FROM unit_authors CROSS JOIN my_addresses USING(address) WHERE unit_authors.unit=outputs.unit)",
            [arrUnits],
            rows => {
                rows.forEach(row => {
                    if (row.received_asset !== null)
                        return device.sendMessageToDevice(row.device_address, 'text', "Received payment in wrong asset");

                    return device.sendMessageToDevice(row.device_address, 'text', "I have received your payment.\n" +
                        "You sent to me - " + row.amount + " bytes.\n" +
                        "Now, let's wait until it will come stable, then I will write you.\n");
                });
            }
        );
    });

    eventBus.on('my_transactions_became_stable', (arrUnits) => {
        let device = require('byteballcore/device.js');
        db.query(
            "SELECT outputs.amount, outputs.asset AS received_asset, device_address \n\
            FROM outputs JOIN boost_tasks ON outputs.address=boost_tasks.assoc_address \n\
            WHERE unit IN(?) AND asset IS NULL\n\
            AND NOT EXISTS (SELECT 1 FROM unit_authors CROSS JOIN my_addresses USING(address) WHERE unit_authors.unit=outputs.unit)",
            [arrUnits],
            rows => {
                rows.forEach(async (row) => {
                    await addBalance(row.amount, row.device_address);
                    return device.sendMessageToDevice(row.device_address, 'text', 'Payment stabled!' +
                        '.\n Now our workers will start their job. ' +
                        '\n Thank you, that you chose us!' +
                        '\n[[Main menu]](command:menu) ' + " | " + " [[Boost statistics]](command:statistics)")
                });
            }
        );
    });

    function checkPrivateKey(private_key) {
        try {
            return !!PrivateKey.fromString(private_key);
        } catch (e) {
            return false
        }
    }

    function addBalance(amount, device_address) {
        return new Promise(resolve => {
            db.query("UPDATE boost_tasks SET status = ? WHERE device_address = ?", ['paid', device_address]);
            db.query("UPDATE users SET step_booster = ? WHERE device_address = ?",
                ['author_request', device_address], () => {
                    return resolve();
                });
        });
    }

    function decBalance(amount, device_address) {
        return new Promise(resolve => {
            db.query("UPDATE users SET balance = balance - ? WHERE device_address = ?", [amount, device_address], () => {
                return resolve();
            });
        });
    }

// boost-system v 1.1
    setInterval(upVote, 60000);  //time in ms

    function upVote() {
        const weight = 100;
        let voter;
        let author;
        let permlink;
        let private_key;
        db.query("SELECT task_id, author_steem_login, post_perm_link FROM boost_tasks WHERE status = 'paid' AND like_target > like_status", rows => {
            if (rows[0] === undefined) {  //.task_id
                console.error('No jobs found to like!')
            } else {
                let task_id = rows[0].task_id;
                author = rows[0].author_steem_login;
                permlink = rows[0].post_perm_link;
                db.query("SELECT steem_login, steem_private_post_key FROM users WHERE step_worker = ? AND NOT EXISTS \n\
                (SELECT * FROM workers_log WHERE workers_log.steem_login = users.steem_login \n\
                 AND workers_log.login_action = 'like' AND workers_log.task_id = ?)", ['worker_info', task_id], rows => {
                    if (rows[0] === undefined) { //.steem_login
                        console.error('No free workers found to like!')
                    } else {
                        voter = rows[0].steem_login;
                        private_key = rows[0].steem_private_post_key;
                        let privateKey = PrivateKey.fromString(private_key);
                        const voteData = {
                            voter,
                            author,
                            permlink,
                            weight, //needs to be an integer for the vote function
                        };
                        vote(voteData, privateKey, task_id)
                    }
                })
            }
        });
    }

    function vote(voteData, privateKey, task_id) {
        console.error(voteData, privateKey);
        client.broadcast.vote(voteData, privateKey).then(
            function (result) {
                console.error('success:', result);
                db.query("INSERT INTO workers_log(steem_login,login_action,task_id,post_author,post_perm_link) VALUES (?, ?, ?, ?, ?)",
                    [voteData.voter, 'like', task_id, voteData.author_login, voteData.perm_link]);
                db.query("UPDATE boost_tasks SET like_status = like_status + 1 WHERE task_id = ?", [task_id]);
                db.query("UPDATE users SET balance = balance + 5000 WHERE steem_login = ?", [voteData.voter]);
                db.query("SELECT like_target, like_status, repost_target, repost_status FROM boost_tasks WHERE task_id = ?", [task_id], rows => {
                    if (rows[0].like_status === rows[0].like_target && rows[0].repost_status === rows[0].repost_target) {
                        db.query("UPDATE boost_tasks SET status = 'finished' WHERE task_id = ?", [task_id]);
                    }
                })
            },
            function (error) {
                if (error.message.match(/Your current vote on this comment/)) {
                    db.query("INSERT INTO workers_log(steem_login,login_action,task_id,post_author,post_perm_link) VALUES (?, ?, ?, ?, ?)",
                        [voteData.voter, 'like', task_id, voteData.author_login, voteData.perm_link]);
                } else {
                    console.error('error:', error);
                }

            }
        );
    }

    setInterval(reBlog, 90000);  //time in ms

    function reBlog() {
        let private_key;
        let theReposter;
        let theAuthor;
        let thePermLink;
        db.query("SELECT task_id, author_steem_login, post_perm_link FROM boost_tasks WHERE status = 'paid' AND repost_target > repost_status", rows => {
            if (rows[0] === undefined) { //.task_id
                console.error('No jobs found to repost!')
            } else {
                let task_id = rows[0].task_id;
                theAuthor = rows[0].author_steem_login;
                thePermLink = rows[0].post_perm_link;
                db.query("SELECT steem_login, steem_private_post_key FROM users WHERE step_worker = ? AND NOT EXISTS \n\
                (SELECT * FROM workers_log WHERE workers_log.steem_login = users.steem_login \n\
                 AND workers_log.login_action = 'repost' AND workers_log.task_id = ?)", ['worker_info', task_id], rows => {
                    if (rows[0] === undefined) { //.steem_login
                        console.error('No free workers found to repost!')
                    } else {
                        theReposter = rows[0].steem_login;
                        private_key = rows[0].steem_private_post_key;
                        let privateKey = PrivateKey.fromString(private_key);
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
                        repost(reblogData, privateKey, task_id)
                    }
                })
            }
        });
    }

    function repost(reblogData, privateKey, task_id) {

        client.broadcast.json(reblogData, privateKey).then(
            function (result) {
                console.error('client broadcast result: ', result);
                db.query("INSERT INTO workers_log(steem_login,login_action,task_id,post_author,post_perm_link) VALUES (?, ?, ?, ?, ?)",
                    [JSON.parse(reblogData.json)[1].account, 'repost', task_id, JSON.parse(reblogData.json)[1].author, JSON.parse(reblogData.json)[1].permlink]);
                db.query("UPDATE boost_tasks SET repost_status = repost_status + 1 WHERE task_id = ?", [task_id]);
                db.query("UPDATE users SET balance = balance + 500 WHERE steem_login = ?", [JSON.parse(reblogData.json)[1].account]);
                db.query("SELECT like_target, like_status, repost_target, repost_status FROM boost_tasks WHERE task_id = ?", [task_id], rows => {
                    if (rows[0].like_status === rows[0].like_target && rows[0].repost_status === rows[0].repost_target) {
                        db.query("UPDATE boost_tasks SET status = 'finished' WHERE task_id = ?", [task_id]);
                    }
                })
            },
            function (error) {
                console.error(error);
            }
        );
    }

    /*  eventBus.on('my_transactions_became_stable', (arrUnits) => {
          const device = require('byteballcore/device.js');
          db.query("SELECT address, amount, asset FROM outputs WHERE unit IN (?)", [arrUnits], rows => {
              rows.forEach(row => {
                  let deviceAddress = assocMyAddressToDeviceAddress[row.address];
                  if (row.asset === null && deviceAddress) {
                      headlessWallet.sendAllBytesFromAddress(row.address, assocDeviceAddressToPeerAddress[deviceAddress], deviceAddress, (err, unit) => {
                          if (err) device.sendMessageToDevice(deviceAddress, 'text', 'Oops, there\'s been a mistake. : ' + err);
                          device.sendMessageToDevice(deviceAddress, 'text', 'I sent back your payment! Unit: ' + unit);
                          return true;
                      })
                  }
              })
          });
      });
      */
});


/**
 * user pays to the bot
 */
eventBus.on('new_my_transactions', (arrUnits) => {
    // handle new unconfirmed payments
    // and notify user

//	const device = require('byteballcore/device.js');
//	device.sendMessageToDevice(device_address_determined_by_analyzing_the_payment, 'text', "Received your payment");
});

/**
 * payment is confirmed
 */
eventBus.on('my_transactions_became_stable', (arrUnits) => {
    // handle payments becoming confirmed
    // and notify user

//	const device = require('byteballcore/device.js');
//	device.sendMessageToDevice(device_address_determined_by_analyzing_the_payment, 'text', "Your payment is confirmed");
});


process.on('unhandledRejection', up => {
    throw up;
});

/*
eventBus.on('text', (from_address, text) => {
    const device = require('byteballcore/device.js');
    text = text.trim();
    if (validationUtils.isValidAddress(text)) {
        assocDeviceAddressToPeerAddress[from_address] = text;
        device.sendMessageToDevice(from_address, 'text', 'Saved your Byteball address');
        headlessWallet.issueNextMainAddress((address) => {
            assocMyAddressToDeviceAddress[address] = from_address;
            assocDeviceAddressToMyAddress[from_address] = address;
            device.sendMessageToDevice(from_address, 'text', '[balance](byteball:' + address + '?amount=1000)');
        })
    } else if (assocDeviceAddressToMyAddress[from_address]) {
        device.sendMessageToDevice(from_address, 'text', '[balance](byteball:' + assocDeviceAddressToMyAddress[from_address] + '?amount=1000)');
    } else {
        device.sendMessageToDevice(from_address, 'text', "Please send me your address");
    }
});
*/


/*
else {
            device.sendMessageToDevice(from_address, 'text', "Welcome to the SocialBoost BOT! \n " +
                "This bot was created to help earn the first bytes to beginners or raise up posts on social networks for authors.\n" +
                "BOT is on MVP stage, it mean's that only STEEMIT.COM platform supported. Later will be more. \n" +
                "For all questions or report the problem, write on - lchaosmachinel@gmail.com \n" +
                "[[Earn Bytes]](command:earn_bytes) " + " | " + " [[Boost Post]](command:boost_post)");
        }
 */