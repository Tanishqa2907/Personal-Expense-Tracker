<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost/spendly');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

$host = '127.0.0.1';
$port = '3307'; 
$dbname = 'spendly';
$username = 'root';
$password = ''; 

try {
    $dsn = "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4";
    error_log("Connecting to: $dsn with user $username");
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_EMULATE_PREPARES => false
    ]);
    error_log("Database connection successful");
} catch (PDOException $e) {
    $errorMessage = "Database connection failed: " . $e->getMessage();
    error_log($errorMessage);
    ini_set('display_errors', 0);
    echo json_encode(['status' => 'error', 'message' => $errorMessage]);
    exit;
}
?>