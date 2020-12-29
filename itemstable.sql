Database: Ecommercedb

CREATE TABLE items(i_no INTEGER(5) NOT NULL UNIQUE AUTO_INCREMENT, 
i_name VARCHAR(50) NOT NULL, 
price DECIMAL(10,2), 
quantity INTEGER, 
image VARCHAR(255), 
status CHAR DEFAULT "y", 
offer CHAR DEFAULT "n", 
PRIMARY KEY(i_no))ENGINE=InnoDB;
