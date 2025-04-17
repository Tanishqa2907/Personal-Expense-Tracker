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
    $stmt = $pdo->prepare('SELECT id, date, category, amount, description FROM expenses WHERE user_id = ? ORDER BY date DESC');
    $stmt->execute([$user_id]);
    echo json_encode(['status' => 'success', 'expenses' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $date = trim($data['date'] ?? '');
    $category = trim($data['category'] ?? '');
    $amount = floatval($data['amount'] ?? 0);
    $description = trim($data['description'] ?? '');

    if (empty($date) || empty($category) || $amount <= 0) {
        echo json_encode(['status' => 'error', 'message' => 'Invalid expense details']);
        exit;
    }

    try {
        $stmt = $pdo->prepare('INSERT INTO expenses (user_id, date, category, amount, description) VALUES (?, ?, ?, ?, ?)');
        $stmt->execute([$user_id, $date, $category, $amount, $description]);

        $stmt = $pdo->prepare('SELECT id, date, category, amount, description FROM expenses WHERE user_id = ? ORDER BY date DESC');
        $stmt->execute([$user_id]);
        echo json_encode(['status' => 'success', 'expenses' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'message' => 'Insert failed: ' . $e->getMessage()]);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $stmt = $pdo->prepare('DELETE FROM expenses WHERE user_id = ?');
    $stmt->execute([$user_id]);
    echo json_encode(['status' => 'success', 'message' => 'All expenses cleared']);
}
?>