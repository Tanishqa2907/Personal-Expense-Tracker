<?php
session_start();
include 'db.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Not logged in']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $points = $data['points'] ?? 0;
    $user_id = $_SESSION['user_id'];

    $stmt = $pdo->prepare('SELECT points FROM users WHERE user_id = ?');
    $stmt->execute([$user_id]);
    $current_points = $stmt->fetch()['points'];

    if ($points <= 0 || $points > $current_points) {
        echo json_encode(['status' => 'error', 'message' => 'Invalid points amount']);
        exit;
    }

    $stmt = $pdo->prepare('UPDATE users SET points = points - ? WHERE user_id = ?');
    $stmt->execute([$points, $user_id]);
    echo json_encode(['status' => 'success', 'message' => "Redeemed $points points for $points rupees!"]);
}
?>