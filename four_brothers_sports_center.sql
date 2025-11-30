-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Nov 30, 2025 at 09:37 PM
-- Server version: 9.1.0
-- PHP Version: 8.3.14

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `four_brothers_sports_center`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin_notifications`
--

DROP TABLE IF EXISTS `admin_notifications`;
CREATE TABLE IF NOT EXISTS `admin_notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `content` text NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `type` enum('email','announcement') NOT NULL DEFAULT 'announcement',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `admin_notifications`
--

INSERT INTO `admin_notifications` (`id`, `content`, `created_at`, `type`) VALUES
(11, 'Karibu Sana Four Brothers Sports Center', '2025-11-30 18:59:53', 'announcement'),
(10, 'Karibu Sana Four Brothers Sports Center', '2025-11-30 18:59:53', 'announcement'),
(9, 'Karibu Sana Four Brothers Sports Center', '2025-11-30 18:59:53', 'announcement');

-- --------------------------------------------------------

--
-- Table structure for table `admin_otps`
--

DROP TABLE IF EXISTS `admin_otps`;
CREATE TABLE IF NOT EXISTS `admin_otps` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `otp_code` varchar(6) NOT NULL,
  `expires_at` datetime NOT NULL,
  `verified` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`)
) ENGINE=MyISAM AUTO_INCREMENT=62 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `admin_otps`
--

INSERT INTO `admin_otps` (`id`, `user_id`, `otp_code`, `expires_at`, `verified`, `created_at`) VALUES
(48, 1, '252187', '2025-10-06 23:11:04', 1, '2025-10-06 17:36:04'),
(50, 1, '834746', '2025-10-07 15:38:06', 1, '2025-10-07 10:03:06'),
(51, 1, '104034', '2025-10-09 12:53:45', 1, '2025-10-09 07:18:44'),
(52, 1, '845144', '2025-10-28 18:13:52', 1, '2025-10-28 12:38:51'),
(53, 1, '408143', '2025-12-01 00:12:25', 1, '2025-11-30 18:37:25'),
(54, 1, '950069', '2025-12-01 00:30:01', 1, '2025-11-30 18:55:01'),
(55, 1, '987374', '2025-12-01 00:31:52', 1, '2025-11-30 18:56:51'),
(61, 2, '962274', '2025-12-01 02:19:49', 1, '2025-11-30 20:44:48'),
(60, 2, '333439', '2025-12-01 02:12:28', 1, '2025-11-30 20:37:28'),
(59, 2, '916461', '2025-12-01 02:07:27', 1, '2025-11-30 20:32:26');

-- --------------------------------------------------------

--
-- Table structure for table `ads`
--

DROP TABLE IF EXISTS `ads`;
CREATE TABLE IF NOT EXISTS `ads` (
  `id` int NOT NULL AUTO_INCREMENT,
  `image_url` varchar(255) NOT NULL,
  `link` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `ads`
--

INSERT INTO `ads` (`id`, `image_url`, `link`, `created_at`) VALUES
(8, '/uploads/products/1759770659450-170506593.jpg', 'https://www.instagram.com/p/DPdeVHAEbCr/?igsh=cWl5bDZ5c2d2dGRm', '2025-10-06 17:10:59'),
(7, '/uploads/products/1759770640409-126287315.jpg', 'https://www.instagram.com/p/DPdeVHAEbCr/?igsh=cWl5bDZ5c2d2dGRm', '2025-10-06 17:10:40'),
(10, '/uploads/products/1764528991797-472983448.png', 'https://www.instagram.com/four_brothers_sports_center?igsh=d20xYno3dmlwcnJ4', '2025-11-30 18:56:31');

-- --------------------------------------------------------

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
CREATE TABLE IF NOT EXISTS `customers` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `email` varchar(150) DEFAULT NULL,
  `gender` enum('mwanaume','mwanamke','nyengine') NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `address` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `phone` (`phone`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `customers`
--

INSERT INTO `customers` (`id`, `first_name`, `last_name`, `phone`, `email`, `gender`, `created_at`, `updated_at`, `address`) VALUES
(12, 'Mundhir', 'Shehe', '0777730606', 'mosnake111@gmail.com', 'mwanaume', '2025-11-30 20:48:14', '2025-11-30 20:48:14', 'Fuoni Kisimani'),
(13, 'Haji', 'Haji', '0677532140', 'fourbrothers10112627@gmail.com', 'mwanaume', '2025-11-30 21:09:57', '2025-11-30 21:09:57', 'Fuoni');

-- --------------------------------------------------------

--
-- Table structure for table `customer_notifications`
--

DROP TABLE IF EXISTS `customer_notifications`;
CREATE TABLE IF NOT EXISTS `customer_notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_id` int NOT NULL,
  `message` text NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `customer_id` (`customer_id`)
) ENGINE=MyISAM AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `customer_otps`
--

DROP TABLE IF EXISTS `customer_otps`;
CREATE TABLE IF NOT EXISTS `customer_otps` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `customer_id` int UNSIGNED DEFAULT NULL,
  `phone` varchar(20) NOT NULL,
  `otp` varchar(10) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `customer_id` (`customer_id`),
  KEY `phone` (`phone`),
  KEY `expires_at` (`expires_at`)
) ENGINE=InnoDB AUTO_INCREMENT=70 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `customer_otps`
--

INSERT INTO `customer_otps` (`id`, `customer_id`, `phone`, `otp`, `expires_at`, `used`, `created_at`) VALUES
(58, NULL, '0777730606', '174936', '2025-10-07 15:34:10', 1, '2025-10-07 09:59:10'),
(60, NULL, '0677532140', '581088', '2025-10-09 12:57:08', 1, '2025-10-09 07:22:08'),
(62, NULL, '0788365067', '027256', '2025-10-28 18:11:45', 1, '2025-10-28 12:36:45'),
(64, NULL, '0788365067', '210101', '2025-12-01 00:10:17', 1, '2025-11-30 18:35:17'),
(65, 12, '0777730606', '748631', '2025-12-01 02:23:20', 1, '2025-11-30 20:48:20'),
(66, 12, '+255777730606', '143304', '2025-12-01 02:39:17', 1, '2025-11-30 21:04:17'),
(67, 12, '+255777730606', '337923', '2025-12-01 02:41:12', 1, '2025-11-30 21:06:12'),
(68, 12, '+255777730606', '394464', '2025-12-01 02:43:35', 0, '2025-11-30 21:08:35'),
(69, 13, '+255677532140', '781498', '2025-12-01 02:45:02', 0, '2025-11-30 21:10:02');

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

DROP TABLE IF EXISTS `messages`;
CREATE TABLE IF NOT EXISTS `messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `content` text NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
CREATE TABLE IF NOT EXISTS `orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_id` int NOT NULL,
  `total_price` decimal(12,2) NOT NULL,
  `status` enum('Imewekwa','Inasafirishwa','Imepokelewa','Imepokelewa_PENDING','Ghairishwa','Kurudishwa') NOT NULL DEFAULT 'Imewekwa',
  `otp` varchar(6) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_orders_customer` (`customer_id`)
) ENGINE=MyISAM AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `customer_id`, `total_price`, `status`, `otp`, `created_at`, `updated_at`) VALUES
(10, 10, 300000.00, 'Imepokelewa', NULL, '2025-10-09 07:23:41', '2025-10-09 07:25:08'),
(9, 9, 180000.00, 'Kurudishwa', NULL, '2025-10-07 10:00:54', '2025-10-07 10:07:29'),
(11, 11, 360000.00, 'Imepokelewa', NULL, '2025-10-28 12:38:21', '2025-10-28 12:39:58'),
(12, 11, 120000.00, 'Imepokelewa', NULL, '2025-11-30 18:36:53', '2025-11-30 18:38:32');

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
CREATE TABLE IF NOT EXISTS `order_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `unit_price` decimal(12,2) NOT NULL,
  `line_total` decimal(12,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_order_items_order` (`order_id`),
  KEY `fk_order_items_product` (`product_id`)
) ENGINE=MyISAM AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `quantity`, `unit_price`, `line_total`) VALUES
(9, 9, 13, 3, 60000.00, 180000.00),
(10, 10, 12, 5, 60000.00, 300000.00),
(11, 11, 13, 6, 60000.00, 360000.00),
(12, 12, 9, 2, 60000.00, 120000.00);

-- --------------------------------------------------------

--
-- Table structure for table `order_ratings`
--

DROP TABLE IF EXISTS `order_ratings`;
CREATE TABLE IF NOT EXISTS `order_ratings` (
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

--
-- Dumping data for table `order_ratings`
--

INSERT INTO `order_ratings` (`id`, `order_id`, `customer_id`, `package_rating`, `delivery_rating`, `product_rating`, `overall_comment`, `created_at`, `updated_at`) VALUES
(6, 9, 9, 4, 5, 5, 'Nimependa bidhaa zenu', '2025-10-07 10:05:44', '2025-10-07 10:05:44'),
(7, 10, 10, 4, 5, 5, 'HAJSKK', '2025-10-09 07:25:33', '2025-10-09 07:25:33'),
(8, 11, 11, 4, 5, 5, NULL, '2025-10-28 12:40:18', '2025-10-28 12:40:18');

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
CREATE TABLE IF NOT EXISTS `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `company` varchar(100) NOT NULL,
  `color` varchar(50) DEFAULT NULL,
  `discount_percent` int DEFAULT '0',
  `type` enum('Njumu','Trainer','Njumu na Trainer') NOT NULL,
  `size_us` varchar(10) NOT NULL,
  `stock` int DEFAULT '0',
  `price` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `name`, `company`, `color`, `discount_percent`, `type`, `size_us`, `stock`, `price`, `created_at`) VALUES
(8, 'AirZoom ya Kawaida', 'AirZoom', 'Buluu', 0, 'Trainer', '10', 15, 60000.00, '2025-10-06 12:34:04'),
(9, 'Mercurial Training', 'Mercurial', 'Nyeusi', 0, 'Trainer', '8', 8, 60000.00, '2025-10-06 12:35:22'),
(10, 'Mercurial OG', 'Mercurial', 'Nyeusi', 0, 'Njumu na Trainer', '11', 12, 60000.00, '2025-10-06 12:37:42'),
(11, 'Training Safi Kabisa', 'Nike', 'Nyeupe', 0, 'Trainer', '11', 27, 60000.00, '2025-10-06 12:39:56'),
(12, 'Nike za msimu Huu', 'Nike', 'Buluu', 0, 'Njumu na Trainer', '10', 5, 60000.00, '2025-10-06 12:41:37'),
(13, 'Nike mpya', 'Nike', 'Buluu', 0, 'Trainer', '7', 4, 60000.00, '2025-10-06 12:42:55');

-- --------------------------------------------------------

--
-- Table structure for table `product_images`
--

DROP TABLE IF EXISTS `product_images`;
CREATE TABLE IF NOT EXISTS `product_images` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `image_url` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`)
) ENGINE=MyISAM AUTO_INCREMENT=58 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `product_images`
--

INSERT INTO `product_images` (`id`, `product_id`, `image_url`) VALUES
(10, 1, '/uploads/products/1758960374587-19671628.png'),
(9, 1, '/uploads/products/1758960374600-245062949.jpg'),
(8, 1, '/uploads/products/1758960374575-679907374.jpg'),
(7, 1, '/uploads/products/1758960374577-219108605.png'),
(6, 1, '/uploads/products/1758960374556-641829947.jpg'),
(29, 2, '/uploads/products/1759593426842-327025997.png'),
(12, 3, '/uploads/products/1759056876569-844094136.png'),
(13, 3, '/uploads/products/1759056876587-930807879.png'),
(14, 3, '/uploads/products/1759056876576-173167661.png'),
(15, 3, '/uploads/products/1759056876580-659558816.png'),
(16, 3, '/uploads/products/1759056876595-377470273.png'),
(17, 4, '/uploads/products/1759057921036-231516799.png'),
(18, 4, '/uploads/products/1759057921050-860029991.png'),
(19, 4, '/uploads/products/1759057921060-55195798.png'),
(36, 6, '/uploads/products/1759593482757-960791716.png'),
(31, 7, '/uploads/products/1759593453740-661757828.png'),
(28, 2, '/uploads/products/1759593426834-471504011.png'),
(27, 2, '/uploads/products/1759593426828-804944288.png'),
(26, 2, '/uploads/products/1759593426818-898886401.png'),
(30, 2, '/uploads/products/1759593426843-974984029.png'),
(32, 7, '/uploads/products/1759593453747-986819944.png'),
(33, 7, '/uploads/products/1759593453752-472400567.png'),
(34, 7, '/uploads/products/1759593453760-162580452.png'),
(37, 6, '/uploads/products/1759593482762-12005833.png'),
(38, 8, '/uploads/products/1759754044888-353014849.jpg'),
(39, 8, '/uploads/products/1759754044889-727925286.jpg'),
(40, 8, '/uploads/products/1759754044895-692231125.jpg'),
(41, 8, '/uploads/products/1759754044894-524342108.jpg'),
(42, 9, '/uploads/products/1759754122291-267697360.jpg'),
(43, 9, '/uploads/products/1759754122291-764134283.jpg'),
(44, 9, '/uploads/products/1759754122297-673711320.jpg'),
(45, 10, '/uploads/products/1759754262736-310993273.jpg'),
(46, 10, '/uploads/products/1759754262737-87616320.jpg'),
(47, 10, '/uploads/products/1759754262740-51772038.jpg'),
(48, 10, '/uploads/products/1759754262745-631552068.jpg'),
(49, 11, '/uploads/products/1759754396875-810948657.jpg'),
(50, 11, '/uploads/products/1759754396875-427873613.jpg'),
(51, 12, '/uploads/products/1759754497220-796254803.jpg'),
(52, 12, '/uploads/products/1759754497221-12957173.jpg'),
(53, 12, '/uploads/products/1759754497223-225955718.jpg'),
(54, 12, '/uploads/products/1759754497226-382821840.jpg'),
(55, 13, '/uploads/products/1759754575583-608994454.jpg'),
(56, 13, '/uploads/products/1759754575583-272344677.jpg'),
(57, 13, '/uploads/products/1759754575588-199130526.jpg');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `mobile` varchar(20) NOT NULL,
  `is_admin` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `mobile` (`mobile`)
) ENGINE=MyISAM AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `first_name`, `last_name`, `mobile`, `is_admin`, `created_at`) VALUES
(2, 'Mohammed', 'Shehe', '+917681969865', 1, '2025-11-30 19:44:26'),
(3, 'Abdul-warith', 'Shehe', '+255684897930', 1, '2025-11-30 19:44:26'),
(4, 'Aminu', 'Juma', '+255774730606', 1, '2025-11-30 19:44:26'),
(5, 'Fahima', 'Issa', '+255777730606', 1, '2025-11-30 19:44:26'),
(6, 'Khayriya', 'Haji', '+255717805380', 1, '2025-11-30 19:44:26');

--
-- Constraints for dumped tables
--

--
-- Constraints for table `customer_otps`
--
ALTER TABLE `customer_otps`
  ADD CONSTRAINT `customer_otps_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
