<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost/spendly');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

include 'db.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Not logged in']);
    exit;
}

$user_id = $_SESSION['user_id'];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $pdo->prepare('SELECT username, name, phone, points FROM users WHERE id = ?');
    $stmt->execute([$user_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($user) {
        echo json_encode(['status' => 'success', 'user' => $user]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'User not found']);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $name = trim($data['name'] ?? '');
    $phone = trim($data['phone'] ?? '');

    if (empty($name) || empty($phone)) {
        echo json_encode(['status' => 'error', 'message' => 'Name and phone are required']);
        exit;
    }

    try {
        $stmt = $pdo->prepare('UPDATE users SET name = ?, phone = ? WHERE id = ?');
        $stmt->execute([$name, $phone, $user_id]);

        $stmt = $pdo->prepare('SELECT username, name, phone, points FROM users WHERE id = ?');
        $stmt->execute([$user_id]);
        $updatedUser = $stmt->fetch(PDO::FETCH_ASSOC);

        echo json_encode(['status' => 'success', 'user' => $updatedUser]);
    } catch (Exception $e) {
        http_response_code(500);
        error_log("Profile update error: " . $e->getMessage());
        echo json_encode(['status' => 'error', 'message' => 'Update failed: ' . $e->getMessage()]);
    }
}
?>