# ************************************************************
# Sequel Pro SQL dump
# Version 5427
#
# https://www.sequelpro.com/
# https://github.com/sequelpro/sequelpro
#
# Host: chaindata.bithereum.network (MySQL 5.7.25-0ubuntu0.18.04.2)
# Database: chaindata
# Generation Time: 2019-03-17 18:31:37 +0000
# ************************************************************


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
SET NAMES utf8mb4;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


# Dump of table bth_addresses
# ------------------------------------------------------------

DROP TABLE IF EXISTS `bth_addresses`;

CREATE TABLE `bth_addresses` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `address` varchar(255) DEFAULT NULL,
  `balance` double DEFAULT NULL,
  `added_on` datetime DEFAULT NULL,
  `updated_on` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `address` (`address`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table bth_block_transactions
# ------------------------------------------------------------

DROP TABLE IF EXISTS `bth_block_transactions`;

CREATE TABLE `bth_block_transactions` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `block` bigint(20) DEFAULT NULL,
  `blockhash` varchar(255) DEFAULT NULL,
  `address` varchar(255) NOT NULL DEFAULT '',
  `txid` varchar(255) DEFAULT NULL,
  `added_on` datetime DEFAULT NULL,
  `updated_on` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `address` (`block`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;




/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
