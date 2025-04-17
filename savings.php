<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost/spendly');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

include 'db.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Not logged in']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $user_id = $_SESSION['user_id'];
    $goal_id = $data['goal_id'];
    $date = $data['date'];
    $amount = $data['amount'];

    $stmt = $pdo->prepare('INSERT INTO savings (user_id, goal_id, date, amount) VALUES (?, ?, ?, ?)');
    $stmt->execute([$user_id, $goal_id, $date, $amount]);
    $stmt = $pdo->prepare('SELECT saving_id AS id, user_id, goal_id, date, amount FROM savings WHERE saving_id = LAST_INSERT_ID()');
    $stmt->execute();
    echo json_encode(['status' => 'success', 'saving' => $stmt->fetch()]);
}
?>