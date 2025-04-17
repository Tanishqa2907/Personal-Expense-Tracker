<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost/spendly');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

include 'db.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    ini_set('display_errors', 0);
    try {
        $rawInput = file_get_contents('php://input');
        error_log("Signup raw input: " . $rawInput);

        $data = json_decode($rawInput, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            error_log("JSON decode error: " . json_last_error_msg());
            echo json_encode(['status' => 'error', 'message' => 'Invalid JSON input']);
            exit;
        }

        $username = trim($data['username'] ?? '');
        $name = trim($data['name'] ?? '');
        $password = trim($data['password'] ?? '');
        $phone = trim($data['phone'] ?? '');

        if (empty($username) || empty($name) || empty($password) || empty($phone)) {
            error_log("Missing fields: username=$username, name=$name, phone=$phone");
            echo json_encode(['status' => 'error', 'message' => 'All fields are required']);
            exit;
        }

        $stmt = $pdo->prepare('SELECT COUNT(*) FROM users WHERE username = ?');
        $stmt->execute([$username]);
        if ($stmt->fetchColumn() > 0) {
            error_log("Username already exists: $username");
            echo json_encode(['status' => 'error', 'message' => 'Username already exists']);
            exit;
        }

        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

        $stmt = $pdo->prepare('INSERT INTO users (username, name, password, phone, points) VALUES (?, ?, ?, ?, 0)');
        $stmt->execute([$username, $name, $hashedPassword, $phone]);

        error_log("Signup successful for username: $username");
        echo json_encode(['status' => 'success', 'message' => 'User registered successfully']);
    } catch (Exception $e) {
        http_response_code(500);
        $errorMessage = "Signup error: " . $e->getMessage();
        error_log($errorMessage);
        echo json_encode(['status' => 'error', 'message' => $errorMessage]);
    }
} else {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
}
?>