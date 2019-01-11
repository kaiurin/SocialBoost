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

setInterval(upVote, 10000);  //time in ms

function upVote() {
    const weight = 100;
    let voter;
    let author_login;
    let perm_link;
    let private_key;
    db.query("SELECT task_id, author_steem_login, post_perm_link FROM boost_tasks WHERE status = 'paid' AND like_target > like_status", rows => {
        if (rows[0].task_id === undefined) {
            console.error('No jobs found!')
        } else {
            let task_id = rows[0].task_id;
            author_login = rows[0].author_steem_login;
            perm_link = rows[0].post_perm_link;
            db.query("SELECT steem_login, steem_private_post_key FROM users WHERE step_worker = ? AND NOT EXISTS \n\
                (SELECT * FROM workers_log WHERE workers_log.steem_login = users.steem_login \n\
                 AND workers_log.login_action = 'like' AND workers_log.task_id = ?)", ['worker_info', task_id], rows => {
                if (rows[0].steem_login === undefined) {
                    console.error('No free workers found!')
                } else {
                    voter = rows[0].steem_login;
                    private_key = rows[0].steem_private_post_key;
                    let privateKey = PrivateKey.fromString(private_key);
                    const voteData = {
                        voter,
                        author_login,
                        perm_link,
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
            console.log('success:', result);
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
            console.log('error:', error);
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
            console.error('No jobs found!')
        } else {
            let task_id = rows[0].task_id;
            theAuthor = rows[0].author_steem_login;
            thePermLink = rows[0].post_perm_link;
            db.query("SELECT steem_login, steem_private_post_key FROM users WHERE step_worker = ? AND NOT EXISTS \n\
                (SELECT * FROM workers_log WHERE workers_log.steem_login = users.steem_login \n\
                 AND workers_log.login_action = 'like' AND workers_log.task_id = ?)", ['worker_info', task_id], rows => {
                if (rows[0] === undefined) {  //.steem_login
                    console.error('No free workers found!')
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
            console.log('client broadcast result: ', result);
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

