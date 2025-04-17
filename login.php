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
        error_log("Raw login input: " . $rawInput);

        $data = json_decode($rawInput, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            error_log("JSON decode error: " . json_last_error_msg());
            echo json_encode(['status' => 'error', 'message' => 'Invalid JSON input']);
            exit;
        }

        $username = trim($data['username'] ?? '');
        $password = trim($data['password'] ?? '');

        if (empty($username) || empty($password)) {
            error_log("Missing username or password: username=$username, password=$password");
            echo json_encode(['status' => 'error', 'message' => 'Username and password are required']);
            exit;
        }

        $stmt = $pdo->prepare('SELECT * FROM users WHERE username = ?');
        $stmt->execute([$username]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user && password_verify($password, $user['password'])) {
            $_SESSION['user_id'] = $user['id'];
            session_regenerate_id(true);
            error_log("Login successful for user ID: " . $user['id']);
            echo json_encode([
                'status' => 'success',
                'user' => [
                    'id' => $user['id'],
                    'username' => $user['username'],
                    'name' => $user['name']
                ]
            ]);
        } else {
            error_log("Login failed for username: $username - Invalid credentials or user not found");
            echo json_encode(['status' => 'error', 'message' => 'Invalid credentials']);
        }
    } catch (Exception $e) {
        http_response_code(500);
        $errorMessage = "Login error: " . $e->getMessage();
        error_log($errorMessage);
        echo json_encode(['status' => 'error', 'message' => $errorMessage]);
    }
} else {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
}
?>