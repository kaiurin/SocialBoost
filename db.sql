# Create your custom tables here and import them into your database by running sqlite3 client and copy/pasting the SQL.
# To install sqlite3 client, run `apt-get install sqlite3`

/*
CREATE TABLE users (
  device_address CHAR(33) NULL PRIMARY KEY,
  user_address CHAR(32) NULL,
  assoc_address CHAR(32) NULL,
  step_worker CHAR(32) NULL,
  step_booster CHAR(32) NULL,
  account_type CHAR(32) NULL,
  steem_login CHAR(32) NULL,
  steem_private_post_key CHAR(60) NULL,
  balance INT NULL DEFAULT 0,
  FOREIGN KEY (device_address) REFERENCES correspondent_devices(device_address));

CREATE TABLE workers_log (
        steem_login CHAR(32) NULL,
        login_action CHAR(32) NULL,
        task_id INTEGER NOT NULL,
        post_author CHAR(32) NULL,
        post_perm_link CHAR(256) NULL);

CREATE TABLE boost_tasks (
  task_id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  device_address CHAR(33) NULL,
  assoc_address CHAR(32) NULL,
  user_address CHAR(32) NULL,
  author_steem_login CHAR(32) NULL,
  post_perm_link CHAR(256) NULL,
  like_target INT NULL,
  repost_target INT NULL,
  like_status INT NULL DEFAULT 0,
  repost_status INT NULL DEFAULT 0,
  status CHAR(32) NULL,
  FOREIGN KEY (device_address) REFERENCES correspondent_devices(device_address));

CREATE TABLE worker_stats (
	device_address CHAR(33) NULL PRIMARY KEY,
	user_address CHAR(33) NULL,
	user_balance INT NULL DEFAULT 0,
	like_count INT NULL DEFAULT 0,
	repost_count INT NULL DEFAULT 0,
	FOREIGN KEY (device_address) REFERENCES correspondent_devices(device_address));

CREATE TABLE receiving_addresses (
	receiving_address CHAR(32) NOT NULL PRIMARY KEY,
	device_address CHAR(33) NOT NULL,
	user_address CHAR(32) NOT NULL,
	creation_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	price INT NULL,
	last_price_date TIMESTAMP NULL,
	UNIQUE (device_address, user_address),
	FOREIGN KEY (device_address) REFERENCES correspondent_devices(device_address),
	FOREIGN KEY (receiving_address) REFERENCES my_addresses(address)
);
CREATE INDEX byReceivingAddress ON receiving_addresses(receiving_address);
CREATE INDEX ra_byUserAddress ON receiving_addresses(user_address);

CREATE TABLE transactions (
	transaction_id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
	receiving_address CHAR(32) NOT NULL,
	creation_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (receiving_address) REFERENCES receiving_addresses(receiving_address)
);

CREATE TABLE accepted_payments (
	transaction_id INTEGER NOT NULL PRIMARY KEY,
	receiving_address CHAR(32) NOT NULL,
	price INT NOT NULL,
	received_amount INT NOT NULL,
	payment_unit CHAR(44) NOT NULL UNIQUE,
	payment_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	is_confirmed INT NOT NULL DEFAULT 0,
	confirmation_date TIMESTAMP NULL,
	FOREIGN KEY (receiving_address) REFERENCES receiving_addresses(receiving_address),
	FOREIGN KEY (transaction_id) REFERENCES transactions(transaction_id)
--	FOREIGN KEY (payment_unit) REFERENCES units(unit) ON DELETE CASCADE
);

CREATE TABLE rejected_payments (
	rejected_payment_id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
	receiving_address CHAR(32) NOT NULL,
	price INT NOT NULL,
	received_amount INT NOT NULL,
	payment_unit CHAR(44) NOT NULL UNIQUE,
	payment_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	error TEXT NOT NULL,
	FOREIGN KEY (receiving_address) REFERENCES receiving_addresses(receiving_address)
--	FOREIGN KEY (payment_unit) REFERENCES units(unit) ON DELETE CASCADE
);
*/
