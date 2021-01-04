Database: Ecommercedb

CREATE TABLE items(i_no INTEGER(5) NOT NULL UNIQUE AUTO_INCREMENT, 
i_name VARCHAR(50) NOT NULL, 
price DECIMAL(10,2), 
quantity INTEGER, 
image VARCHAR(255), 
status CHAR DEFAULT "y", 
offer CHAR DEFAULT "n", 
PRIMARY KEY(i_no))ENGINE=InnoDB;

create table user(id INTEGER AUTO_INCREMENT,
name VARCHAR(50) not null, 
email VARCHAR(50) NOT NULL, 
password VARCHAR(200) NOT NULL, 
role VARCHAR(50) default "customer", 
primary key(id))ENGINE=InnoDB;