-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: mainline.proxy.rlwy.net    Database: railway
-- ------------------------------------------------------
-- Server version	9.4.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `admin_notifications`
--

DROP TABLE IF EXISTS `admin_notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `content` text NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `type` enum('email','announcement') NOT NULL DEFAULT 'announcement',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_notifications`
--

LOCK TABLES `admin_notifications` WRITE;
/*!40000 ALTER TABLE `admin_notifications` DISABLE KEYS */;
INSERT INTO `admin_notifications` VALUES (12,'Pata discount ya 10% kwa kununua bidhaa zaidi ya tatu','2025-12-01 02:02:10','announcement'),(13,'Pata discount ya 10% kwa kununua bidhaa zaidi ya tatu','2025-12-01 02:02:10','announcement');
/*!40000 ALTER TABLE `admin_notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ads`
--

DROP TABLE IF EXISTS `ads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ads` (
  `id` int NOT NULL AUTO_INCREMENT,
  `image_url` varchar(255) NOT NULL,
  `link` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ads`
--

LOCK TABLES `ads` WRITE;
/*!40000 ALTER TABLE `ads` DISABLE KEYS */;
INSERT INTO `ads` VALUES (12,'https://res.cloudinary.com/dmluieytq/image/upload/v1764555613/four_brothers_ads/spclvh3qsitnxenzrgak.jpg','https://www.instagram.com/four_brothers_sports_center?igsh=d20xYno3dmlwcnJ4','2025-12-01 02:20:15'),(13,'https://res.cloudinary.com/dmluieytq/image/upload/v1764555631/four_brothers_ads/sqlumrtcmvmioo57gbbs.jpg','https://www.instagram.com/four_brothers_sports_center?igsh=d20xYno3dmlwcnJ4','2025-12-01 02:20:31');
/*!40000 ALTER TABLE `ads` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer_notification_logs`
--

DROP TABLE IF EXISTS `customer_notification_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_notification_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_notification_id` int NOT NULL,
  `admin_viewed` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `customer_notification_id` (`customer_notification_id`),
  CONSTRAINT `customer_notification_logs_ibfk_1` FOREIGN KEY (`customer_notification_id`) REFERENCES `customer_notifications` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_notification_logs`
--

LOCK TABLES `customer_notification_logs` WRITE;
/*!40000 ALTER TABLE `customer_notification_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `customer_notification_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer_notifications`
--

DROP TABLE IF EXISTS `customer_notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_id` int NOT NULL,
  `message` text NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `customer_id` (`customer_id`)
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_notifications`
--

LOCK TABLES `customer_notifications` WRITE;
/*!40000 ALTER TABLE `customer_notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `customer_notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `password` varchar(255) NOT NULL,
  `reset_token` varchar(100) DEFAULT NULL,
  `reset_token_expires` datetime DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `gender` enum('mwanaume','mwanamke','nyengine') NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `address` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `phone` (`phone`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
INSERT INTO `customers` VALUES (12,'Mundhir','Shehe','0777730606','$2b$10$z3vr3K1.pzXxXhvjYbjNNO1Yo2wfMoovcMnAmkjHcxN90dwy1wEa2',NULL,NULL,'mosnake111@gmail.com','mwanaume','2025-11-30 20:48:14','2025-12-03 08:31:53','Fuoni Kisimani'),(13,'Haji','Haji','0677532140','$2b$10$z3vr3K1.pzXxXhvjYbjNNO1Yo2wfMoovcMnAmkjHcxN90dwy1wEa2',NULL,NULL,'fourbrothers10112627@gmail.com','mwanaume','2025-11-30 21:09:57','2025-12-03 08:31:53','Fuoni'),(15,'Ali','Ali','0123456789','$2b$10$fBo6BvzveQpF32nUw7k29uRpTK3q8XtTin0iySksuwHBRKCca.uky',NULL,NULL,'Mohammed11@gmail.com','mwanaume','2025-12-03 09:50:06','2025-12-03 09:50:06','Anuwani');
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `messages`
--

DROP TABLE IF EXISTS `messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `content` text NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `messages`
--

LOCK TABLES `messages` WRITE;
/*!40000 ALTER TABLE `messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `unit_price` decimal(12,2) NOT NULL,
  `line_total` decimal(12,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_order_items_order` (`order_id`),
  KEY `fk_order_items_product` (`product_id`)
) ENGINE=MyISAM AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
INSERT INTO `order_items` VALUES (9,9,13,3,60000.00,180000.00),(10,10,12,5,60000.00,300000.00),(11,11,13,6,60000.00,360000.00),(12,12,9,2,60000.00,120000.00),(13,13,20,1,60000.00,60000.00);
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_notifications`
--

DROP TABLE IF EXISTS `order_notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `admin_viewed` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  CONSTRAINT `order_notifications_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_notifications`
--

LOCK TABLES `order_notifications` WRITE;
/*!40000 ALTER TABLE `order_notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `order_notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_ratings`
--

DROP TABLE IF EXISTS `order_ratings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_ratings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `customer_id` int NOT NULL,
  `package_rating` tinyint NOT NULL,
  `delivery_rating` tinyint NOT NULL,
  `product_rating` tinyint NOT NULL,
  `overall_comment` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_order_customer` (`order_id`,`customer_id`),
  UNIQUE KEY `unique_order_rating` (`order_id`,`customer_id`),
  KEY `customer_id` (`customer_id`)
) ENGINE=MyISAM AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_ratings`
--

LOCK TABLES `order_ratings` WRITE;
/*!40000 ALTER TABLE `order_ratings` DISABLE KEYS */;
INSERT INTO `order_ratings` VALUES (6,9,9,4,5,5,'Nimependa bidhaa zenu','2025-10-07 10:05:44','2025-10-07 10:05:44'),(7,10,10,4,5,5,'HAJSKK','2025-10-09 07:25:33','2025-10-09 07:25:33'),(8,11,11,4,5,5,NULL,'2025-10-28 12:40:18','2025-10-28 12:40:18');
/*!40000 ALTER TABLE `order_ratings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_id` int NOT NULL,
  `total_price` decimal(12,2) NOT NULL,
  `status` enum('Imewekwa','Inasafirishwa','Imepokelewa','Imepokelewa_PENDING','Ghairishwa','Kurudishwa') NOT NULL DEFAULT 'Imewekwa',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_orders_customer` (`customer_id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (9,9,180000.00,'Kurudishwa','2025-10-07 10:00:54','2025-10-07 10:07:29'),(10,10,300000.00,'Imepokelewa','2025-10-09 07:23:41','2025-10-09 07:25:08'),(11,11,360000.00,'Imepokelewa','2025-10-28 12:38:21','2025-10-28 12:39:58'),(12,11,120000.00,'Imepokelewa','2025-11-30 18:36:53','2025-11-30 18:38:32'),(13,15,60000.00,'Inasafirishwa','2025-12-03 09:51:23','2025-12-03 12:56:48');
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_images`
--

DROP TABLE IF EXISTS `product_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_images` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `image_url` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`)
) ENGINE=MyISAM AUTO_INCREMENT=91 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_images`
--

LOCK TABLES `product_images` WRITE;
/*!40000 ALTER TABLE `product_images` DISABLE KEYS */;
INSERT INTO `product_images` VALUES (85,21,'https://res.cloudinary.com/dmluieytq/image/upload/v1764554105/products/qyu8ww5rdyzz1swm3wu5.jpg'),(86,21,'https://res.cloudinary.com/dmluieytq/image/upload/v1764554105/products/cqgvm6pmgo5pfrvlckz7.jpg'),(83,18,'https://res.cloudinary.com/dmluieytq/image/upload/v1764554043/products/jod3pbasozhyq6lxspks.jpg'),(84,21,'https://res.cloudinary.com/dmluieytq/image/upload/v1764554105/products/alnpiiahcjygcknqp1tb.jpg'),(90,22,'https://res.cloudinary.com/dmluieytq/image/upload/v1764554250/products/cdkrm6defijr05h112cy.jpg'),(89,22,'https://res.cloudinary.com/dmluieytq/image/upload/v1764554250/products/m2swk3eeksngrmkhl1b7.jpg'),(60,14,'https://res.cloudinary.com/dmluieytq/image/upload/v1764552521/products/oog6ytjxf2kqeuwmgk8d.jpg'),(61,14,'https://res.cloudinary.com/dmluieytq/image/upload/v1764552521/products/ttato8vtryktcgq32iz1.jpg'),(62,15,'https://res.cloudinary.com/dmluieytq/image/upload/v1764552772/products/slwr2vfxfbmnfbvaiptt.jpg'),(63,15,'https://res.cloudinary.com/dmluieytq/image/upload/v1764552773/products/sisuhq4cgagmxfqpmilg.jpg'),(64,15,'https://res.cloudinary.com/dmluieytq/image/upload/v1764552773/products/yjtdwgjamxq73fg4ljmf.jpg'),(82,16,'https://res.cloudinary.com/dmluieytq/image/upload/v1764553721/products/mmzaiiusj6yfqvo3sr6z.jpg'),(87,17,'https://res.cloudinary.com/dmluieytq/image/upload/v1764554174/products/xrjhmbzentsflu4ivcow.jpg'),(88,22,'https://res.cloudinary.com/dmluieytq/image/upload/v1764554250/products/kbqtuew1qcmdnknxe2mg.jpg'),(80,16,'https://res.cloudinary.com/dmluieytq/image/upload/v1764553722/products/bnevxr5jtqg7jotlyk9d.jpg'),(81,16,'https://res.cloudinary.com/dmluieytq/image/upload/v1764553721/products/gxo8jqjuqxmdpfqy2jmi.jpg'),(59,14,'https://res.cloudinary.com/dmluieytq/image/upload/v1764552521/products/ud88bovjudj8zglnnixh.jpg'),(58,14,'https://res.cloudinary.com/dmluieytq/image/upload/v1764552521/products/gc3gz5sg4jxf5wvjyfbe.jpg'),(77,19,'https://res.cloudinary.com/dmluieytq/image/upload/v1764553380/products/vnxqgm8xkcovhuqnusk5.jpg'),(78,19,'https://res.cloudinary.com/dmluieytq/image/upload/v1764553379/products/xsloolgcdic36eyw9tct.jpg'),(79,20,'https://res.cloudinary.com/dmluieytq/image/upload/v1764553558/products/jhswih0lnwfysxhmkplq.jpg');
/*!40000 ALTER TABLE `product_images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_sizes`
--

DROP TABLE IF EXISTS `product_sizes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_sizes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `size_code` varchar(10) NOT NULL,
  `size_label` varchar(50) NOT NULL,
  `stock` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_product_size` (`product_id`,`size_code`),
  CONSTRAINT `product_sizes_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_sizes`
--

LOCK TABLES `product_sizes` WRITE;
/*!40000 ALTER TABLE `product_sizes` DISABLE KEYS */;
INSERT INTO `product_sizes` VALUES (1,14,'M','Medium',5,'2025-12-04 11:51:49'),(2,15,'M','Medium',5,'2025-12-04 11:51:49'),(3,16,'M','Medium',20,'2025-12-04 11:51:49'),(4,17,'M','Medium',5,'2025-12-04 11:51:49'),(5,18,'M','Medium',5,'2025-12-04 11:51:49'),(6,19,'M','Medium',5,'2025-12-04 11:51:49'),(7,20,'M','Medium',4,'2025-12-04 11:51:49'),(8,21,'M','Medium',10,'2025-12-04 11:51:49'),(9,22,'M','Medium',10,'2025-12-04 11:51:49');
/*!40000 ALTER TABLE `product_sizes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `company` varchar(100) NOT NULL,
  `color` varchar(50) DEFAULT NULL,
  `discount_percent` int DEFAULT '0',
  `type` enum('Njumu','Trainer','Njumu na Trainer') NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (14,'Nike - Toleo Jipya (Njumu)','Nike','Buluu',0,'Njumu',60000.00,NULL,'2025-12-01 01:28:40'),(15,'Nike - Training ya Kwenda','Nike','Buluu',0,'Trainer',60000.00,NULL,'2025-12-01 01:32:52'),(16,'AirZoom Trainer - Kiatu cha Kisasa','AirZoom','Buluu',0,'Trainer',60000.00,NULL,'2025-12-01 01:36:22'),(17,'Mercurial Njumu','Mercurial','Nyeusi',0,'Njumu',60000.00,NULL,'2025-12-01 01:38:16'),(18,'AirZoom Njumu ','AirZoom','Nyeusi',0,'Njumu',60000.00,NULL,'2025-12-01 01:41:07'),(19,'Trainer ya Kisasa - Adimu','Mercurial','Nyeupe',0,'Trainer',60000.00,NULL,'2025-12-01 01:42:59'),(20,'Mercurial Njumu','Mercurial','Buluu',0,'Njumu',60000.00,NULL,'2025-12-01 01:45:58'),(21,'AirZoom - Njumu (goldish)','AirZoom','Nyeusi',0,'Njumu',60000.00,NULL,'2025-12-01 01:55:04'),(22,'Mercurial Trainer','Mercurial','Nyeusi',0,'Trainer',60000.00,NULL,'2025-12-01 01:57:29');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `mobile` varchar(20) NOT NULL,
  `password` varchar(255) NOT NULL,
  `is_admin` tinyint(1) DEFAULT '0',
  `can_manage_admins` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `mobile` (`mobile`)
) ENGINE=MyISAM AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Mohammed','Shehe','+917681969865','$2b$10$jJTrGY8T0gXwUTq4oQasCuBNz4eZb4Fl.PXO819ssh0RjgGZ/Ha8S',1,1,'2025-11-30 19:44:26'),(2,'Abdul-warith','Shehe','0684123456','$2b$10$Q1.V9UnD9jTcJb/1zkLob.h5ye7jzixnQ1AvHNzFsffmCzZcWV8ji',1,0,'2025-11-30 19:44:26'),(3,'Aminu','Juma','0774730606','$2b$10$QMWOjzTDF6FCHC3bE98WyOtlINjDABtNOUfI64YWaZNB77C1SEPgG',1,0,'2025-11-30 19:44:26'),(4,'Fahima','Issa','0777730606','$2b$10$8DiEeIbsctke0IRwxzFR6.zz8w9Bv2i0urLtL7pn.Xql6S9JVwV9C',1,0,'2025-11-30 19:44:26'),(5,'Khayriya','Haji','0717805380','$2b$10$LImG0ldFb7o/oDskWc6Rjur4uE7HDEgOXSOK5e70ey64kZDyoY03O',1,0,'2025-11-30 19:44:26'),(8,'MO','11','0677532140','$2b$10$4Cm7wcJmQAh5EVQQ1zNS3uz5sQHRs1UXOdUy32NuxvV07wNVNn1uO',1,0,'2025-12-03 12:54:45');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-12-04 19:35:10
