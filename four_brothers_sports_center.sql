-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Oct 06, 2025 at 08:41 AM
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
) ENGINE=MyISAM AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `admin_notifications`
--

INSERT INTO `admin_notifications` (`id`, `content`, `created_at`, `type`) VALUES
(1, 'Hiyo ndiyo Logo yetu hapo juu', '2025-10-04 16:12:22', 'announcement'),
(3, 'Hiyo ndiyo Logo yetu hapo juu', '2025-10-04 16:12:22', 'announcement'),
(6, 'Hiyo ndiyo Logo yetu hapo juu', '2025-10-04 16:12:22', 'announcement'),
(5, 'Hiyo ndiyo Logo yetu hapo juu', '2025-10-04 16:12:22', 'announcement'),
(7, 'Jibu kwa Ali:\n\n', '2025-10-05 18:43:37', 'email'),
(8, 'Jibu kwa Ali:\n\n', '2025-10-05 18:43:58', 'email');

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
) ENGINE=MyISAM AUTO_INCREMENT=48 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `admin_otps`
--

INSERT INTO `admin_otps` (`id`, `user_id`, `otp_code`, `expires_at`, `verified`, `created_at`) VALUES
(1, 1, '777070', '2025-09-27 13:15:31', 1, '2025-09-27 07:40:30'),
(2, 1, '227766', '2025-09-27 14:31:34', 0, '2025-09-27 08:56:33'),
(3, 1, '862391', '2025-09-27 14:31:57', 1, '2025-09-27 08:56:57'),
(4, 1, '515079', '2025-09-27 15:54:30', 0, '2025-09-27 10:19:29'),
(5, 1, '961164', '2025-09-27 16:29:53', 1, '2025-09-27 10:54:52'),
(6, 1, '721776', '2025-09-27 16:34:13', 1, '2025-09-27 10:59:12'),
(7, 1, '610039', '2025-09-27 16:41:32', 1, '2025-09-27 11:06:31'),
(8, 1, '246015', '2025-09-27 18:04:16', 1, '2025-09-27 12:29:15'),
(9, 1, '553934', '2025-09-27 18:06:57', 1, '2025-09-27 12:31:56'),
(10, 1, '850498', '2025-09-28 12:10:08', 1, '2025-09-28 06:35:08'),
(11, 1, '545336', '2025-09-28 14:30:39', 1, '2025-09-28 08:55:38'),
(12, 1, '180824', '2025-09-28 15:33:32', 1, '2025-09-28 09:58:31'),
(13, 1, '930042', '2025-09-28 15:35:28', 1, '2025-09-28 10:00:27'),
(14, 1, '395671', '2025-09-28 16:28:10', 1, '2025-09-28 10:53:09'),
(15, 1, '711794', '2025-10-02 12:55:28', 1, '2025-10-02 07:20:28'),
(16, 1, '370330', '2025-10-03 20:36:12', 1, '2025-10-03 15:01:11'),
(17, 1, '503631', '2025-10-03 20:47:01', 1, '2025-10-03 15:12:01'),
(18, 1, '917686', '2025-10-03 20:51:26', 1, '2025-10-03 15:16:25'),
(19, 1, '929771', '2025-10-04 06:13:26', 1, '2025-10-04 00:38:26'),
(20, 1, '439824', '2025-10-04 06:44:01', 1, '2025-10-04 01:09:00'),
(21, 1, '234600', '2025-10-04 06:46:40', 1, '2025-10-04 01:11:39'),
(22, 1, '834399', '2025-10-04 06:52:10', 1, '2025-10-04 01:17:09'),
(23, 1, '864226', '2025-10-04 06:56:20', 1, '2025-10-04 01:21:19'),
(24, 1, '113596', '2025-10-04 07:59:36', 1, '2025-10-04 02:24:36'),
(25, 1, '407594', '2025-10-04 08:54:48', 1, '2025-10-04 03:19:48'),
(26, 1, '690865', '2025-10-04 08:56:54', 1, '2025-10-04 03:21:54'),
(27, 1, '890458', '2025-10-04 09:14:50', 1, '2025-10-04 03:39:49'),
(28, 1, '603460', '2025-10-04 11:37:32', 1, '2025-10-04 06:02:32'),
(29, 1, '835692', '2025-10-04 14:11:45', 1, '2025-10-04 08:36:45'),
(30, 1, '340604', '2025-10-04 21:29:10', 1, '2025-10-04 15:54:10'),
(31, 1, '801197', '2025-10-04 21:37:01', 1, '2025-10-04 16:02:00'),
(32, 1, '275527', '2025-10-04 23:59:28', 1, '2025-10-04 18:24:28'),
(33, 1, '501644', '2025-10-05 01:41:14', 1, '2025-10-04 20:06:13'),
(34, 1, '666001', '2025-10-05 13:24:12', 0, '2025-10-05 07:49:11'),
(35, 1, '929789', '2025-10-05 13:24:34', 0, '2025-10-05 07:49:33'),
(36, 1, '185846', '2025-10-05 13:28:16', 0, '2025-10-05 07:53:16'),
(37, 1, '418275', '2025-10-05 13:28:49', 0, '2025-10-05 07:53:48'),
(38, 1, '890276', '2025-10-05 13:40:22', 1, '2025-10-05 08:05:22'),
(39, 1, '219272', '2025-10-05 13:41:32', 1, '2025-10-05 08:06:32'),
(40, 1, '678692', '2025-10-05 13:42:28', 0, '2025-10-05 08:07:27'),
(41, 1, '700878', '2025-10-05 13:43:37', 0, '2025-10-05 08:08:36'),
(42, 1, '866002', '2025-10-05 13:47:20', 1, '2025-10-05 08:12:19'),
(43, 1, '121584', '2025-10-05 13:50:54', 1, '2025-10-05 08:15:53'),
(44, 1, '949528', '2025-10-05 13:53:33', 1, '2025-10-05 08:18:33'),
(45, 1, '336490', '2025-10-06 01:31:34', 1, '2025-10-05 19:56:34'),
(46, 1, '955448', '2025-10-06 02:00:19', 1, '2025-10-05 20:25:19'),
(47, 1, '340310', '2025-10-06 04:04:47', 1, '2025-10-05 22:29:46');

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
) ENGINE=MyISAM AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `ads`
--

INSERT INTO `ads` (`id`, `image_url`, `link`, `created_at`) VALUES
(3, '/uploads/products/1759052291256-45891789.jpg', 'https://chatgpt.com/c/68d790ae-5b18-8323-a133-696a049f4cf9', '2025-09-28 09:38:11'),
(4, '/uploads/products/1759593824583-861712340.png', 'https://www.instagram.com/lisfc_2022?igsh=emFldmVrNDh2MjN3', '2025-10-04 16:03:44'),
(5, '/uploads/products/1759594325622-696048930.png', 'https://chatgpt.com/c/68d790ae-5b18-8323-a133-696a049f4cf9', '2025-10-04 16:12:05');

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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `customers`
--

INSERT INTO `customers` (`id`, `first_name`, `last_name`, `phone`, `email`, `gender`, `created_at`, `updated_at`, `address`) VALUES
(1, 'Mohammed', 'Shehe', '0788365067', 'mosnake111@gmail.com', 'mwanaume', '2025-09-27 08:18:05', '2025-10-04 09:05:14', 'ZANZIBAR, TANZANIA'),
(3, 'Mohammed', 'Aminu', '+255774730606', 'mohammed@example.com', 'mwanaume', '2025-09-28 09:59:51', '2025-09-28 09:59:51', NULL),
(5, 'Ali', 'Juma', '+255677532140', 'ali@example.com', 'mwanaume', '2025-10-02 08:03:03', '2025-10-02 08:03:03', 'Mwanakwerekwe, Zanzibar'),
(6, 'Johnny', 'Doe', '+255678999888', 'john@example.com', 'mwanaume', '2025-10-02 15:35:11', '2025-10-02 15:39:35', '456 New Street');

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
) ENGINE=MyISAM AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `customer_notifications`
--

INSERT INTO `customer_notifications` (`id`, `customer_id`, `message`, `created_at`) VALUES
(3, 5, 'Order id 2 imeghairishwa kwasababu Changed my mind', '2025-10-03 14:56:05'),
(4, 5, 'Order id 3 imeghairishwa kwasababu Changed my mind', '2025-10-03 15:00:16'),
(5, 5, 'Order id 4 imeghairishwa kwasababu Changed my mind', '2025-10-03 15:28:43'),
(9, 1, 'Hellow', '2025-10-04 18:23:51'),
(8, 1, 'Hey', '2025-10-04 18:19:58'),
(10, 5, 'Order id 3 imeghairishwa kwasababu Changed my mind', '2025-10-04 19:39:36'),
(11, 5, 'Order id 1 imeghairishwa kwasababu Changed my mind', '2025-10-05 07:46:53'),
(12, 0, 'order', '2025-10-05 08:20:19'),
(13, 0, '@heyunread', '2025-10-05 15:06:18'),
(14, 5, 'Hey', '2025-10-05 15:08:46'),
(16, 0, 'order', '2025-10-05 15:13:45'),
(17, 5, 'Order id 4 imeghairishwa kwasababu Changed my mind', '2025-10-05 15:25:49'),
(18, 0, 'order', '2025-10-05 17:25:53'),
(19, 0, 'order', '2025-10-05 17:28:14'),
(20, 1, 'Order id 2 imeghairishwa kwasababu Nimebadilisha nia: Sijapenda', '2025-10-05 17:33:43'),
(21, 1, 'yow', '2025-10-05 17:44:15'),
(22, 0, 'message', '2025-10-05 18:06:08'),
(23, 5, 'Order id 1 inaombwa kurudishwa kwasababu Bidhaa imeharibika: Kwakweli sijapenda', '2025-10-05 18:18:23'),
(24, 5, 'Order id 1 inaombwa kurudishwa kwasababu Saizi haifai: jhhh', '2025-10-05 18:42:28'),
(25, 5, 'Order id 4 inaombwa kurudishwa kwasababu Nyingine: ffff', '2025-10-05 20:19:38'),
(26, 5, 'Order id 3 inaombwa kurudishwa kwasababu Bidhaa imeharibika: vvv', '2025-10-05 20:20:41'),
(27, 5, 'Order id 3 inaombwa kurudishwa kwasababu Bidhaa imeharibika: vvv', '2025-10-05 20:20:41'),
(28, 1, 'Wewe', '2025-10-05 22:01:20');

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
) ENGINE=InnoDB AUTO_INCREMENT=52 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `customer_otps`
--

INSERT INTO `customer_otps` (`id`, `customer_id`, `phone`, `otp`, `expires_at`, `used`, `created_at`) VALUES
(1, 5, '+255677532140', '907451', '2025-10-02 08:11:57', 0, '2025-10-02 08:06:57'),
(2, 5, '+255677532140', '888858', '2025-10-02 08:18:36', 0, '2025-10-02 08:13:35'),
(3, 5, '+255677532140', '127820', '2025-10-02 08:22:35', 0, '2025-10-02 08:17:34'),
(4, 5, '+255677532140', '456976', '2025-10-02 08:39:02', 0, '2025-10-02 08:34:02'),
(5, 5, '+255677532140', '355965', '2025-10-02 14:17:00', 1, '2025-10-02 08:42:00'),
(6, 6, '+255677532120', '116040', '2025-10-02 21:10:42', 1, '2025-10-02 15:35:42'),
(7, 6, '+255677532120', '437574', '2025-10-02 21:13:53', 1, '2025-10-02 15:38:53'),
(8, 5, '+255677532140', '251609', '2025-10-03 18:51:20', 1, '2025-10-03 13:16:20'),
(9, 5, '+255677532140', '528742', '2025-10-03 19:34:17', 1, '2025-10-03 13:59:17'),
(10, 5, '+255677532140', '810093', '2025-10-03 20:13:44', 1, '2025-10-03 14:38:44'),
(11, 5, '+255677532140', '560073', '2025-10-03 20:29:38', 1, '2025-10-03 14:54:38'),
(12, 5, '+255677532140', '789438', '2025-10-03 20:59:28', 1, '2025-10-03 15:24:28'),
(13, 5, '+255677532140', '048661', '2025-10-04 06:20:31', 1, '2025-10-04 00:45:31'),
(14, 1, '0788365067', '823144', '2025-10-04 09:48:57', 1, '2025-10-04 04:13:57'),
(15, 1, '0788365067', '478098', '2025-10-04 11:05:04', 0, '2025-10-04 05:30:04'),
(16, 1, '0788365067', '835483', '2025-10-04 11:12:55', 0, '2025-10-04 05:37:55'),
(17, 1, '0788365067', '424631', '2025-10-04 11:39:55', 0, '2025-10-04 06:04:55'),
(18, 5, '+255677532140', '177989', '2025-10-04 12:39:37', 1, '2025-10-04 07:04:37'),
(19, 1, '0788365067', '104971', '2025-10-04 12:58:53', 0, '2025-10-04 07:23:53'),
(20, 1, '0788365067', '856032', '2025-10-04 12:59:15', 0, '2025-10-04 07:24:15'),
(21, 1, '0788365067', '269315', '2025-10-04 12:59:30', 0, '2025-10-04 07:24:30'),
(22, 1, '0788365067', '242919', '2025-10-04 14:07:59', 1, '2025-10-04 08:32:59'),
(23, 1, '0788365067', '993513', '2025-10-04 14:10:33', 1, '2025-10-04 08:35:33'),
(24, 1, '0788365067', '535408', '2025-10-04 14:38:00', 1, '2025-10-04 09:03:00'),
(25, 1, '0788365067', '867778', '2025-10-04 14:38:57', 1, '2025-10-04 09:03:57'),
(26, 1, '0677532155', '557469', '2025-10-04 14:39:44', 1, '2025-10-04 09:04:44'),
(27, 5, '+255677532140', '539004', '2025-10-04 15:17:34', 1, '2025-10-04 09:42:34'),
(28, 1, '0788365067', '129203', '2025-10-04 15:25:15', 1, '2025-10-04 09:50:15'),
(29, 5, '+255677532140', '704688', '2025-10-04 20:02:45', 1, '2025-10-04 14:27:45'),
(30, 1, '0788365067', '438731', '2025-10-04 20:29:23', 1, '2025-10-04 14:54:23'),
(31, 5, '+255677532140', '486433', '2025-10-04 22:56:11', 1, '2025-10-04 17:21:11'),
(32, 5, '+255677532140', '186424', '2025-10-05 00:02:02', 1, '2025-10-04 18:27:02'),
(33, 5, '+255677532140', '269057', '2025-10-05 00:22:18', 1, '2025-10-04 18:47:18'),
(34, 1, '0788365067', '950699', '2025-10-05 01:08:26', 0, '2025-10-04 19:33:26'),
(35, 5, '+255677532140', '751605', '2025-10-05 01:11:11', 1, '2025-10-04 19:36:11'),
(36, 5, '+255677532140', '944311', '2025-10-05 01:39:06', 1, '2025-10-04 20:04:06'),
(37, 5, '+255677532140', '797377', '2025-10-05 13:17:11', 1, '2025-10-05 07:42:11'),
(38, 5, '+255677532140', '458289', '2025-10-05 13:20:57', 1, '2025-10-05 07:45:57'),
(39, 5, '+255677532140', '057907', '2025-10-05 13:54:19', 1, '2025-10-05 08:19:19'),
(40, 5, '+255677532140', '099777', '2025-10-05 20:29:53', 1, '2025-10-05 14:54:53'),
(41, 5, '+255677532140', '982656', '2025-10-05 20:33:44', 1, '2025-10-05 14:58:44'),
(42, 5, '+255677532140', '379618', '2025-10-05 20:45:59', 1, '2025-10-05 15:10:59'),
(43, 5, '+255677532140', '211980', '2025-10-05 20:58:11', 1, '2025-10-05 15:23:11'),
(44, 1, '0788365067', '269876', '2025-10-05 23:08:02', 1, '2025-10-05 17:33:02'),
(45, 1, '0788365067', '706324', '2025-10-05 23:22:09', 0, '2025-10-05 17:47:09'),
(46, 1, '0788365067', '164061', '2025-10-05 23:22:38', 1, '2025-10-05 17:47:38'),
(47, 5, '+255677532140', '854052', '2025-10-05 23:23:25', 1, '2025-10-05 17:48:25'),
(48, 5, '+255677532140', '282025', '2025-10-06 00:48:39', 1, '2025-10-05 19:13:39'),
(49, 1, '0788365067', '380397', '2025-10-06 02:16:09', 1, '2025-10-05 20:41:09'),
(50, 5, '+255677532140', '277443', '2025-10-06 02:22:15', 1, '2025-10-05 20:47:15'),
(51, 1, '0788365067', '591861', '2025-10-06 02:47:34', 1, '2025-10-05 21:12:34');

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

--
-- Dumping data for table `messages`
--

INSERT INTO `messages` (`id`, `content`, `created_at`) VALUES
(1, 'Hello customers! Check out our new football shoes.', '2025-09-27 08:34:13');

-- --------------------------------------------------------

--
-- Table structure for table `old_orders`
--

DROP TABLE IF EXISTS `old_orders`;
CREATE TABLE IF NOT EXISTS `old_orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `total_price` decimal(12,2) NOT NULL,
  `status` enum('Imewekwa','Inasafirishwa','Imepokelewa','Imepokelewa_PENDING','Ghairishwa','Kurudishwa') NOT NULL DEFAULT 'Imewekwa',
  `otp` varchar(6) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_customer_id` (`customer_id`),
  KEY `idx_product_id` (`product_id`),
  KEY `idx_status` (`status`)
) ENGINE=MyISAM AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `old_orders`
--

INSERT INTO `old_orders` (`id`, `customer_id`, `product_id`, `quantity`, `total_price`, `status`, `otp`, `created_at`, `updated_at`) VALUES
(5, 5, 6, 1, 162000.00, 'Imepokelewa', NULL, '2025-10-04 00:50:47', '2025-10-04 03:33:34'),
(6, 5, 6, 1, 60000.00, 'Imepokelewa', NULL, '2025-10-04 00:54:55', '2025-10-04 03:38:15'),
(7, 5, 7, 1, 54000.00, 'Ghairishwa', '649497', '2025-10-04 00:55:37', '2025-10-04 03:39:28'),
(8, 1, 6, 1, 360000.00, 'Imepokelewa', NULL, '2025-10-04 04:57:01', '2025-10-04 15:59:09'),
(9, 1, 6, 1, 300000.00, 'Imewekwa', NULL, '2025-10-04 05:02:31', '2025-10-04 05:02:31'),
(10, 1, 2, 1, 222000.00, 'Imewekwa', NULL, '2025-10-04 05:30:32', '2025-10-04 05:30:32'),
(11, 1, 7, 1, 54000.00, 'Imepokelewa', NULL, '2025-10-04 05:38:24', '2025-10-04 08:38:03'),
(12, 1, 2, 1, 120000.00, 'Imewekwa', NULL, '2025-10-04 08:39:27', '2025-10-04 08:39:27'),
(13, 1, 2, 1, 60000.00, 'Imewekwa', NULL, '2025-10-04 09:51:18', '2025-10-04 09:51:18');

-- --------------------------------------------------------

--
-- Table structure for table `old_order_items`
--

DROP TABLE IF EXISTS `old_order_items`;
CREATE TABLE IF NOT EXISTS `old_order_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `line_total` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `product_id` (`product_id`)
) ENGINE=MyISAM AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `old_order_items`
--

INSERT INTO `old_order_items` (`id`, `order_id`, `product_id`, `quantity`, `unit_price`, `line_total`) VALUES
(1, 5, 6, 1, 60000.00, 60000.00),
(2, 5, 2, 1, 60000.00, 60000.00),
(3, 5, 7, 1, 60000.00, 60000.00),
(4, 6, 6, 1, 60000.00, 60000.00),
(5, 7, 7, 1, 54000.00, 54000.00),
(6, 8, 6, 6, 60000.00, 360000.00),
(7, 9, 6, 5, 60000.00, 300000.00),
(8, 10, 2, 1, 60000.00, 60000.00),
(9, 10, 7, 3, 54000.00, 162000.00),
(10, 11, 7, 1, 54000.00, 54000.00),
(11, 12, 2, 2, 60000.00, 120000.00),
(12, 13, 2, 1, 60000.00, 60000.00);

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
) ENGINE=MyISAM AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `customer_id`, `total_price`, `status`, `otp`, `created_at`, `updated_at`) VALUES
(1, 5, 120000.00, 'Imepokelewa', NULL, '2025-10-04 18:50:37', '2025-10-05 19:55:41'),
(2, 1, 54000.00, 'Imepokelewa', NULL, '2025-10-04 19:33:52', '2025-10-05 19:55:18'),
(3, 5, 60000.00, 'Kurudishwa', NULL, '2025-10-04 19:39:23', '2025-10-05 20:20:41'),
(4, 5, 54000.00, 'Kurudishwa', NULL, '2025-10-05 15:24:31', '2025-10-05 20:19:38'),
(5, 5, 108000.00, 'Imepokelewa', NULL, '2025-10-05 20:24:47', '2025-10-05 20:25:56');

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
) ENGINE=MyISAM AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `quantity`, `unit_price`, `line_total`) VALUES
(1, 1, 2, 2, 60000.00, 120000.00),
(2, 2, 7, 1, 54000.00, 54000.00),
(3, 3, 6, 1, 60000.00, 60000.00),
(4, 4, 7, 1, 54000.00, 54000.00),
(5, 5, 7, 2, 54000.00, 108000.00);

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
) ENGINE=MyISAM AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `order_ratings`
--

INSERT INTO `order_ratings` (`id`, `order_id`, `customer_id`, `package_rating`, `delivery_rating`, `product_rating`, `overall_comment`, `created_at`, `updated_at`) VALUES
(1, 3, 5, 5, 4, 5, NULL, '2025-10-05 08:23:42', '2025-10-05 18:00:25'),
(2, 4, 5, 4, 5, 4, 'Bahati Mbaya', '2025-10-05 15:28:48', '2025-10-05 20:18:29'),
(3, 1, 5, 5, 4, 5, NULL, '2025-10-05 17:49:32', '2025-10-05 18:00:25'),
(4, 5, 5, 5, 4, 5, NULL, '2025-10-05 20:26:19', '2025-10-05 20:26:19'),
(5, 2, 1, 4, 5, 4, NULL, '2025-10-05 22:00:42', '2025-10-05 22:00:42');

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
) ENGINE=MyISAM AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `name`, `company`, `color`, `discount_percent`, `type`, `size_us`, `stock`, `price`, `created_at`) VALUES
(6, 'Air Zumo1', 'Reebok', 'Nyeusi', 0, 'Njumu', '6', 0, 60000.00, '2025-10-04 00:47:41'),
(2, 'Air Zumo', 'Adidas', 'Bluu', 0, 'Njumu', '11', 0, 60000.00, '2025-09-27 11:04:34'),
(7, 'Adidas 2*', 'Puma', 'Bluu', 10, 'Njumu na Trainer', '8', 7, 60000.00, '2025-10-04 00:48:34');

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
) ENGINE=MyISAM AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

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
(37, 6, '/uploads/products/1759593482762-12005833.png');

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
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `first_name`, `last_name`, `mobile`, `is_admin`, `created_at`) VALUES
(1, 'Mohammed', 'Shehe', '0677532140', 1, '2025-09-27 07:40:26');

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
