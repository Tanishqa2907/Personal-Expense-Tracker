<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost/spendly');
header('Access-Control-Allow-Methods: GET, POST, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

include 'db.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Not logged in']);
    exit;
}

$user_id = $_SESSION['user_id'];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $pdo->prepare('SELECT expense_id AS id, date, category, amount, description FROM expenses WHERE user_id = ? ORDER BY date DESC');
    $stmt->execute([$user_id]);
    echo json_encode(['status' => 'success', 'expenses' => $stmt->fetchAll()]);
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $date = $data['date'];
    $category = $data['category'];
    $amount = $data['amount'];
    $description = $data['description'] ?? '';

    $stmt = $pdo->prepare('INSERT INTO expenses (user_id, date, category, amount, description) VALUES (?, ?, ?, ?, ?)');
    $stmt->execute([$user_id, $date, $category, $amount, $description]);
    $stmt = $pdo->prepare('SELECT expense_id AS id, date, category, amount, description FROM expenses WHERE user_id = ? ORDER BY date DESC');
    $stmt->execute([$user_id]);
    echo json_encode(['status' => 'success', 'expenses' => $stmt->fetchAll()]);
} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $stmt = $pdo->prepare('DELETE FROM expenses WHERE user_id = ?');
    $stmt->execute([$user_id]);
    echo json_encode(['status' => 'success', 'message' => 'All expenses cleared']);
}
?>